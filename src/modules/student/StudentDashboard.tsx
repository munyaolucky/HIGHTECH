import React, { useState } from "react";
import {
  Home,
  UserRound,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  HeartHandshake,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Headphones,
  Star,
  MapPin,
  Clock,
  BarChart3,
  FileText,
  Search,
  MessageCircle,
  Download,
  User,
  CalendarCheck,
  Wallet,
  BookMarked,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Smartphone,
  Printer,
  AlertCircle,
} from "lucide-react";
import "./StudentDashboard.css";
import { INITIAL_STUDENT_PROFILE, INITIAL_STUDENT_UNITS, INITIAL_BOOK_LOANS, INITIAL_TRANSACTIONS } from "../../data/mockCollegeData";

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

const menuItems = [
  { label: "Dashboard", icon: Home, page: "dashboard" },
  { label: "My Profile", icon: UserRound, page: "profile" },
  { label: "My Programme", icon: GraduationCap, page: "programme" },
  { label: "Course Registration", icon: ClipboardList, page: "course-registration" },
  { label: "Timetable", icon: CalendarDays, page: "timetable" },
  { label: "Results & Transcripts", icon: FileText, page: "results" },
  { label: "Fees & Payments", icon: CreditCard, page: "finance" },
  { label: "Library", icon: BookOpen, page: "library" },
  { label: "Student Support", icon: HeartHandshake, page: "support" },
];

const quickActions = [
  {
    title: "View Timetable",
    description: "See your classes",
    icon: CalendarDays,
    color: "blue",
    page: "timetable",
  },
  {
    title: "Register Courses",
    description: "Manage your units",
    icon: CheckCircle2,
    color: "green",
    page: "course-registration",
  },
  {
    title: "Check Results",
    description: "View your grades",
    icon: ClipboardList,
    color: "purple",
    page: "results",
  },
  {
    title: "Pay Fees",
    description: "Manage payments",
    icon: CreditCard,
    color: "teal",
    page: "finance",
  },
  {
    title: "Access Library",
    description: "Books and resources",
    icon: BookMarked,
    color: "orange",
    page: "library",
  },
  {
    title: "Get Support",
    description: "Contact the college",
    icon: Headphones,
    color: "navy",
    page: "support",
  },
];

const notifications = [
  {
    id: 1,
    title: "Your assignment is due tomorrow",
    detail: "CSC 301: Advanced Data Structures · 11:59 PM",
    time: "2 hours ago",
    color: "blue",
    unread: true,
  },
  {
    id: 2,
    title: "Semester results are available",
    detail: "Check your academic results breakdown",
    time: "Yesterday",
    color: "green",
    unread: true,
  },
  {
    id: 3,
    title: "Official payment receipt generated",
    detail: "Receipt #RCT-2026-0002 for KES 15,000",
    time: "2 days ago",
    color: "blue",
    unread: true,
  },
];

const events = [
  {
    day: "06",
    month: "NOV",
    title: "CAT II – Advanced Data Structures & Algorithms",
    time: "9:00 AM – 11:00 AM",
    location: "Tech Lab 3B",
  },
  {
    day: "08",
    month: "NOV",
    title: "Virtual Masterclass – Cloud Microservices in Africa",
    time: "10:00 AM – 12:00 PM",
    location: "Online / LMS Portal",
  },
  {
    day: "12",
    month: "NOV",
    title: "HI-TECH Annual Career & Innovation Expo",
    time: "9:00 AM – 4:00 PM",
    location: "Nairobi Main Auditorium",
  },
];

export default function StudentDashboard({
  studentName = INITIAL_STUDENT_PROFILE.fullName,
  registrationNumber = INITIAL_STUDENT_PROFILE.registrationNumber,
  programme = INITIAL_STUDENT_PROFILE.programme,
  academicYear = INITIAL_STUDENT_PROFILE.academicYear,
  semester = INITIAL_STUDENT_PROFILE.semester,
  registeredCourses = INITIAL_STUDENT_PROFILE.registeredCourses,
  attendance = INITIAL_STUDENT_PROFILE.attendanceRate,
  gpa = INITIAL_STUDENT_PROFILE.gpa,
  onNavigate,
  onLogout,
  onSwitchPortal,
}: StudentDashboardProps) {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [readNotifications, setReadNotifications] = useState<number[]>([]);

  // Interactive sub-page states
  const [mpesaPhone, setMpesaPhone] = useState("0712345678");
  const [mpesaAmount, setMpesaAmount] = useState("12500");
  const [mpesaStatus, setMpesaStatus] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const unreadCount = notifications.filter(
    (item) => !readNotifications.includes(item.id)
  ).length;

  const navigate = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
    onNavigate?.(page);
  };

  const markAllRead = () => {
    setReadNotifications(notifications.map((item) => item.id));
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    const confirmed = window.confirm("Are you sure you want to log out from Student Portal?");
    if (confirmed) {
      window.location.reload();
    }
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setMpesaStatus("SENDING");
    setTimeout(() => {
      setMpesaStatus("PROMPT_SENT");
      setTimeout(() => {
        setMpesaStatus("SUCCESS");
      }, 1500);
    }, 1000);
  };

  return (
    <div className="hca-dashboard">
      {/* TOP HEADER */}
      <header className="hca-topbar">
        <div className="hca-brand">
          <div className="hca-brand-icon">
            <GraduationCap size={38} strokeWidth={2.2} />
          </div>

          <div>
            <h1>HI-TECH COLLEGE</h1>
            <p>Learn • Innovate • Excel</p>
          </div>
        </div>

        <button
          className="hca-mobile-menu"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </button>

        <div className="hca-header-right">
          <div className="hca-search">
            <Search size={17} />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search units, exams, fees..."
              aria-label="Search portal"
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue.trim()) {
                  onNavigate?.(`search:${searchValue.trim()}`);
                }
              }}
            />
          </div>

          {/* Quick Portal Switcher */}
          {onSwitchPortal && (
            <div className="hidden lg:flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-2.5 py-1 text-xs font-semibold">
              <Sparkles size={14} className="text-amber-500" />
              <span>Portal:</span>
              <select
                aria-label="Select administrative portal"
                className="bg-transparent font-bold text-blue-800 outline-none cursor-pointer"
                value="student"
                onChange={(e) => onSwitchPortal(e.target.value)}
              >
                <option value="student">Student Portal</option>
                <option value="generator">Central Reg Generator (HCA/STAFF/...)</option>
                <option value="lecturer">Lecturer Portal (Module 18)</option>
                <option value="registrar">Registrar Portal (Module 19)</option>
                <option value="finance">Finance Portal (Module 20)</option>
                <option value="library">Library Portal (Module 22)</option>
                <option value="examination">Examination Portal (Module 23)</option>
                <option value="admissions">Admissions Portal (Module 24)</option>
              </select>
            </div>
          )}

          <div className="hca-header-dropdown">
            <button
              className="hca-notification-button"
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
            >
              <Bell size={23} />
              {unreadCount > 0 && (
                <span className="hca-notification-badge">{unreadCount}</span>
              )}
            </button>

            {notificationOpen && (
              <div className="hca-dropdown hca-notification-dropdown">
                <div className="hca-dropdown-heading">
                  <div>
                    <strong>Notifications</strong>
                    <small>{unreadCount} unread messages</small>
                  </div>
                  <button onClick={markAllRead}>Mark all read</button>
                </div>

                {notifications.map((item) => (
                  <button
                    className="hca-dropdown-notification"
                    key={item.id}
                    onClick={() => {
                      setReadNotifications((previous) =>
                        previous.includes(item.id)
                          ? previous
                          : [...previous, item.id]
                      );
                    }}
                  >
                    <span className={`hca-dot ${item.color}`} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                      <small>{item.time}</small>
                    </span>
                    {!readNotifications.includes(item.id) && (
                      <span className="hca-unread-indicator" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hca-header-dropdown">
            <button
              className="hca-profile-button"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationOpen(false);
              }}
            >
              <div className="hca-avatar">
                <UserRound size={25} />
              </div>

              <span className="hca-profile-info">
                <strong>{studentName}</strong>
                <small className="font-mono text-blue-700">{registrationNumber}</small>
              </span>

              <ChevronDown size={17} />
            </button>

            {profileOpen && (
              <div className="hca-dropdown hca-profile-dropdown">
                <button onClick={() => navigate("profile")}>
                  <User size={17} /> My Profile
                </button>
                <button onClick={() => navigate("results")}>
                  <FileText size={17} /> Transcripts
                </button>
                <button onClick={() => navigate("settings")}>
                  <Settings size={17} /> Account Settings
                </button>
                <button onClick={handleLogout}>
                  <LogOut size={17} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="hca-layout">
        {/* SIDEBAR */}
        <aside className={`hca-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="hca-sidebar-label">STUDENT MENU</div>

          <nav className="hca-navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.page}
                  className={`hca-nav-item ${
                    activePage === item.page ? "active" : ""
                  }`}
                  onClick={() => navigate(item.page)}
                >
                  <Icon size={21} />
                  <span>{item.label}</span>

                  {item.page === "support" && (
                    <span className="hca-nav-new">Help</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hca-sidebar-label hca-sidebar-secondary">
            ACCOUNT
          </div>

          <nav className="hca-navigation">
            <button
              className={`hca-nav-item ${
                activePage === "notifications" ? "active" : ""
              }`}
              onClick={() => navigate("notifications")}
            >
              <Bell size={21} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="hca-sidebar-count">{unreadCount}</span>
              )}
            </button>

            <button
              className={`hca-nav-item ${
                activePage === "documents" ? "active" : ""
              }`}
              onClick={() => navigate("documents")}
            >
              <FileText size={21} />
              <span>Documents</span>
            </button>

            <button
              className={`hca-nav-item ${
                activePage === "settings" ? "active" : ""
              }`}
              onClick={() => navigate("settings")}
            >
              <Settings size={21} />
              <span>Settings</span>
            </button>
          </nav>

          <div className="hca-sidebar-bottom">
            <div className="hca-help-card">
              <div className="hca-help-icon">
                <MessageCircle size={22} />
              </div>
              <strong>Need assistance?</strong>
              <p>Our student support team is ready to help.</p>
              <button onClick={() => navigate("support")}>
                Contact Support <ArrowRight size={14} />
              </button>
            </div>

            <button className="hca-logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            className="hca-sidebar-overlay"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <main className="hca-main">
          <div className="hca-main-content">
            {activePage === "dashboard" && (
              <>
                {/* WELCOME HERO */}
                <section className="hca-hero">
                  <div className="hca-hero-overlay" />

                  <div className="hca-hero-content">
                    <span className="hca-hero-eyebrow">
                      YOUR FUTURE STARTS HERE
                    </span>

                    <h2>
                      Welcome back,
                      <br />
                      {studentName}
                    </h2>

                    <p>Enrolled in {programme} • Reg No: <span className="font-mono text-amber-300 font-bold">{registrationNumber}</span></p>

                    <button
                      className="hca-hero-button"
                      onClick={() => navigate("programme")}
                    >
                      Explore Your Units
                      <ArrowRight size={19} />
                    </button>
                  </div>

                  <div className="hca-hero-tag">
                    <ShieldCheck size={16} />
                    Official Student Portal
                  </div>
                </section>

                {/* QUICK ACTIONS */}
                <section className="hca-quick-actions">
                  {quickActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.page}
                        className={`hca-quick-card ${action.color}`}
                        onClick={() => navigate(action.page)}
                      >
                        <span className="hca-quick-icon">
                          <Icon size={29} />
                        </span>

                        <span className="hca-quick-text">
                          <strong>{action.title}</strong>
                          <small>{action.description}</small>
                        </span>

                        <ArrowRight className="hca-quick-arrow" size={17} />
                      </button>
                    );
                  })}
                </section>

                {/* CONTENT GRID */}
                <div className="hca-content-grid">
                  <div className="hca-left-column">
                    {/* ACADEMIC OVERVIEW */}
                    <section className="hca-panel">
                      <div className="hca-panel-heading">
                        <div className="hca-panel-title">
                          <BarChart3 size={23} />
                          <h3>Your Academic Overview</h3>
                        </div>

                        <button
                          className="hca-text-link"
                          onClick={() => navigate("programme")}
                        >
                          View Details <ArrowRight size={15} />
                        </button>
                      </div>

                      <div className="hca-academic-grid">
                        <div className="hca-stat-card stat-blue">
                          <GraduationCap size={37} />
                          <div>
                            <small>Current Programme</small>
                            <strong>{programme}</strong>
                          </div>
                        </div>

                        <div className="hca-stat-card stat-green">
                          <CalendarDays size={36} />
                          <div>
                            <small>Academic Year</small>
                            <strong>{academicYear}</strong>
                          </div>
                        </div>

                        <div className="hca-stat-card stat-purple">
                          <CalendarCheck size={36} />
                          <div>
                            <small>Current Semester</small>
                            <strong>{semester}</strong>
                          </div>
                        </div>

                        <div className="hca-stat-card stat-light-blue">
                          <BookOpen size={36} />
                          <div>
                            <small>Registered Units</small>
                            <strong>{registeredCourses} Units</strong>
                          </div>
                        </div>

                        <div className="hca-stat-card stat-light-green">
                          <CheckCircle2 size={36} />
                          <div>
                            <small>Class Attendance</small>
                            <strong>{attendance}%</strong>
                          </div>
                        </div>

                        <div className="hca-stat-card stat-light-orange">
                          <Star size={36} />
                          <div>
                            <small>Cumulative GPA</small>
                            <strong>{gpa.toFixed(2)} / 4.00</strong>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* UPCOMING EVENTS */}
                    <section className="hca-panel hca-events-panel">
                      <div className="hca-panel-heading">
                        <div className="hca-panel-title">
                          <CalendarDays size={22} />
                          <h3>Upcoming Academic Deadlines</h3>
                        </div>

                        <button
                          className="hca-text-link"
                          onClick={() => navigate("timetable")}
                        >
                          View Timetable <ArrowRight size={15} />
                        </button>
                      </div>

                      <div className="hca-event-list">
                        {events.map((event, index) => (
                          <div className="hca-event-row" key={index}>
                            <div className="hca-event-date">
                              <small>{event.month}</small>
                              <strong>{event.day}</strong>
                            </div>

                            <div className="hca-event-name">
                              <strong>{event.title}</strong>
                            </div>

                            <div className="hca-event-time">
                              <Clock size={14} />
                              <span>{event.time}</span>
                            </div>

                            <div className="hca-event-location">
                              <MapPin size={15} />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* STUDENT SHORTCUTS */}
                    <section className="hca-panel hca-shortcuts-panel">
                      <div className="hca-panel-heading">
                        <div className="hca-panel-title">
                          <Wallet size={22} />
                          <h3>Student Services</h3>
                        </div>
                      </div>

                      <div className="hca-shortcuts">
                        <button onClick={() => navigate("documents")}>
                          <FileText size={21} />
                          <span>My Documents</span>
                        </button>

                        <button onClick={() => navigate("finance")}>
                          <Download size={21} />
                          <span>Fee Receipts</span>
                        </button>

                        <button onClick={() => navigate("profile")}>
                          <UserRound size={21} />
                          <span>Student ID</span>
                        </button>

                        <button onClick={() => navigate("results")}>
                          <BarChart3 size={21} />
                          <span>Transcripts</span>
                        </button>
                      </div>
                    </section>
                  </div>

                  <div className="hca-right-column">
                    {/* NOTIFICATIONS */}
                    <section className="hca-panel hca-notifications-panel">
                      <div className="hca-panel-heading">
                        <div className="hca-panel-title">
                          <Bell size={22} />
                          <h3>Notifications</h3>
                        </div>

                        <button
                          className="hca-text-link"
                          onClick={() => navigate("notifications")}
                        >
                          View All <ArrowRight size={15} />
                        </button>
                      </div>

                      <div className="hca-notification-list">
                        {notifications.map((item) => (
                          <button
                            className={`hca-notification-row ${
                              readNotifications.includes(item.id) ? "read" : ""
                            }`}
                            key={item.id}
                            onClick={() =>
                              setReadNotifications((previous) =>
                                previous.includes(item.id)
                                  ? previous
                                  : [...previous, item.id]
                              )
                            }
                          >
                            <span className={`hca-dot ${item.color}`} />

                            <span className="hca-notification-message">
                              <strong>{item.title}</strong>
                              <small>{item.detail}</small>
                            </span>

                            <span className="hca-notification-time">
                              {item.time}
                            </span>
                          </button>
                        ))}
                      </div>

                      <button
                        className="hca-all-notifications"
                        onClick={markAllRead}
                      >
                        Mark all notifications as read
                      </button>
                    </section>

                    {/* FEE SUMMARY */}
                    <section className="hca-panel hca-fee-panel">
                      <div className="hca-panel-heading">
                        <div className="hca-panel-title">
                          <CreditCard size={22} />
                          <h3>Fee Summary</h3>
                        </div>

                        <button
                          className="hca-text-link"
                          onClick={() => navigate("finance")}
                        >
                          Full Statement
                        </button>
                      </div>

                      <div className="hca-fee-balance">
                        <small>Outstanding Balance</small>
                        <strong>KES 12,500.00</strong>
                        <span>Tuition & Practical Lab Fee</span>
                      </div>

                      <div className="hca-fee-progress">
                        <div className="hca-fee-progress-label">
                          <span>Fee payment progress</span>
                          <strong>75% Paid</strong>
                        </div>
                        <div className="hca-progress-track">
                          <div className="hca-progress-value" />
                        </div>
                      </div>

                      <button
                        className="hca-pay-button"
                        onClick={() => navigate("finance")}
                      >
                        <CreditCard size={18} />
                        Make a Payment (M-Pesa)
                        <ArrowRight size={17} />
                      </button>
                    </section>

                    {/* PROMOTIONAL BANNER */}
                    <section className="hca-promo-banner">
                      <div className="hca-promo-content">
                        <span>LEARN • INNOVATE • EXCEL</span>
                        <h3>
                          Build Your Future
                          <br />
                          with <b>HI-TECH College</b>
                        </h3>
                        <p>Quality TVET & Degree Education. Real Industry Skills.</p>

                        <button onClick={() => navigate("programme")}>
                          Learn More <ArrowRight size={16} />
                        </button>
                      </div>
                    </section>

                    {/* SUPPORT */}
                    <section className="hca-support-card">
                      <div className="hca-support-icon">
                        <Headphones size={25} />
                      </div>
                      <div>
                        <strong>Student Support Centre</strong>
                        <p>Need help with your exams, fees or units?</p>
                        <button onClick={() => navigate("support")}>
                          Get Help <ArrowRight size={14} />
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}

            {/* TIMETABLE VIEW */}
            {activePage === "timetable" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Semester Timetable</h2>
                      <p className="text-xs text-slate-500">{academicYear} • {semester} • {programme}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
                  >
                    <Printer size={15} /> Print Timetable
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {INITIAL_STUDENT_UNITS.map((unit) => (
                    <div key={unit.code} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded">
                            {unit.code}
                          </span>
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {unit.credits} Credits
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{unit.title}</h4>
                        <p className="text-xs text-slate-500 mb-3">{unit.lecturerName}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-blue-600" />
                          <span className="font-semibold text-slate-800">{unit.day}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400" />
                          <span>{unit.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{unit.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS VIEW */}
            {activePage === "results" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Academic Results &amp; Transcript</h2>
                      <p className="text-xs text-slate-500">Official Semester Provisional Transcript</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-right">
                      <small className="text-[10px] text-amber-800 font-semibold block uppercase">Cumulative GPA</small>
                      <strong className="text-base text-amber-900 font-bold">{gpa.toFixed(2)} / 4.00</strong>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                    >
                      <Download size={15} /> Download Official Transcript
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-600">
                    <div>Student Name: <strong className="text-slate-900">{studentName}</strong></div>
                    <div>Registration No: <strong className="font-mono text-blue-700">{registrationNumber}</strong></div>
                    <div>Transcript Register Ref: <strong className="font-mono text-emerald-700">TRX-2026-0001</strong></div>
                    <div>Status: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">OFFICIALLY ISSUED</span></div>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-4">Unit Code</th>
                        <th className="p-4">Unit Title</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4">Raw Score</th>
                        <th className="p-4">Grade</th>
                        <th className="p-4">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {INITIAL_STUDENT_UNITS.map((unit) => (
                        <tr key={unit.code} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-bold text-blue-900">{unit.code}</td>
                          <td className="p-4 font-medium text-slate-800">{unit.title}</td>
                          <td className="p-4 text-slate-600">{unit.credits}</td>
                          <td className="p-4 font-semibold text-slate-700">{unit.score}%</td>
                          <td className="p-4">
                            <span className="px-2 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                              {unit.grade}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-semibold text-emerald-700">Pass (Completed)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FINANCE & PAYMENTS VIEW */}
            {activePage === "finance" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Student Fees &amp; Payments</h2>
                      <p className="text-xs text-slate-500">M-Pesa Daraja Integration &amp; Official Invoices</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-right">
                    <small className="text-[10px] text-red-700 font-semibold uppercase block">Balance Due</small>
                    <strong className="text-lg text-red-800 font-bold">KES 12,500.00</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* M-PESA STK Push Simulator */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold">
                        <Smartphone size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Lipa na M-Pesa Online</h3>
                        <p className="text-xs text-slate-500">Instant STK Push to Phone</p>
                      </div>
                    </div>

                    <form onSubmit={handleSimulatePayment} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">M-Pesa Mobile Number</label>
                        <input
                          type="text"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                          placeholder="e.g. 0712345678"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Amount (KES)</label>
                        <input
                          type="number"
                          value={mpesaAmount}
                          onChange={(e) => setMpesaAmount(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={mpesaStatus === "SENDING" || mpesaStatus === "PROMPT_SENT"}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition"
                      >
                        {mpesaStatus === "SENDING"
                          ? "Connecting to Daraja API..."
                          : mpesaStatus === "PROMPT_SENT"
                          ? "Check your phone for PIN prompt..."
                          : "Trigger STK Push (Pay Now)"}
                      </button>
                    </form>

                    {mpesaStatus === "SUCCESS" && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Payment of KES {Number(mpesaAmount).toLocaleString()} Successful!</strong>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Receipt <span className="font-mono font-bold">RCT-2026-0004</span> generated. Balance updated.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment History & Receipts */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">Payment Receipts &amp; Ledger</h3>
                      <span className="text-xs text-slate-500">Double-Entry Verified</span>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                        <tr>
                          <th className="p-3">Receipt No</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Channel / Ref</th>
                          <th className="p-3">Amount (KES)</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {INITIAL_TRANSACTIONS.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-blue-900">{tx.receiptNumber}</td>
                            <td className="p-3 text-slate-600">{new Date(tx.timestamp).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 block">{tx.paymentMethod}</span>
                              <span className="font-mono text-slate-500 text-[10px]">{tx.referenceNumber}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-900">
                              KES {tx.amount.toLocaleString()}.00
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* LIBRARY VIEW */}
            {activePage === "library" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Digital Library &amp; Physical Loans</h2>
                      <p className="text-xs text-slate-500">HI-TECH Central Library Access System</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-right">
                    <small className="text-[10px] text-blue-700 font-semibold uppercase block">Active Member Card</small>
                    <strong className="text-xs font-mono text-blue-900 font-bold">HCA/LIB/2026/001</strong>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">My Currently Borrowed Physical Books</h3>
                  <div className="divide-y divide-slate-100">
                    {INITIAL_BOOK_LOANS.filter((l) => l.borrowerRegNo === registrationNumber).map((loan) => (
                      <div key={loan.id} className="py-3 flex items-center justify-between">
                        <div>
                          <strong className="text-sm font-bold text-slate-800 block">{loan.bookTitle}</strong>
                          <span className="text-xs text-slate-500 font-mono">Barcode: {loan.barcode}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs block text-slate-600">Due Date: <strong className="text-slate-900">{loan.dueDate}</strong></span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                            {loan.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MY PROFILE VIEW */}
            {activePage === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Student Academic Profile</h2>
                      <p className="text-xs text-slate-500">Official Student Records Registry</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    ENROLLED &amp; ACTIVE
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Academic Identity</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Official Registration Number:</span>
                        <strong className="font-mono text-blue-800 text-sm">{registrationNumber}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Admission Reference:</span>
                        <strong className="font-mono text-slate-800">{INITIAL_STUDENT_PROFILE.admissionNumber}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Enrolled Programme:</span>
                        <strong className="text-slate-900">{programme}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Department / Faculty:</span>
                        <strong className="text-slate-900">{INITIAL_STUDENT_PROFILE.department}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Campus:</span>
                        <strong className="text-slate-900">{INITIAL_STUDENT_PROFILE.campus}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Personal Details</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Full Name:</span>
                        <strong className="text-slate-900">{studentName}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Student Email:</span>
                        <strong className="text-slate-900">{INITIAL_STUDENT_PROFILE.email}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Phone Number:</span>
                        <strong className="text-slate-900">{INITIAL_STUDENT_PROFILE.phoneNumber}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">National ID / Index Ref:</span>
                        <strong className="text-slate-900">{INITIAL_STUDENT_PROFILE.nationalId}</strong>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Date of Admission:</span>
                        <strong className="text-slate-900">{INITIAL_STUDENT_PROFILE.admissionDate}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUPPORT VIEW */}
            {activePage === "support" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Student Support &amp; Helpdesk</h2>
                      <p className="text-xs text-slate-500">Academic, Financial &amp; Technical Inquiries</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Submit a Support Request</h3>
                  {supportSubmitted ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <strong>Support Ticket #TKT-2026-0941 Created!</strong>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          A student counsellor or registrar officer will review and reply within 24 hours.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSupportSubmitted(true);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Inquiry Category</label>
                        <select className="w-full text-xs p-2.5 border border-slate-300 rounded-lg">
                          <option>Academic &amp; Course Registration</option>
                          <option>Fees &amp; M-Pesa Payment Reconciliation</option>
                          <option>Timetable &amp; Exam Room Conflict</option>
                          <option>Library Fines &amp; Digital Access</option>
                          <option>Hostels &amp; Student Welfare</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Explain Your Inquiry</label>
                        <textarea
                          rows={4}
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          placeholder="Please describe your question or issue in detail..."
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                      >
                        Submit Ticket
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* DOCUMENTS VIEW */}
            {activePage === "documents" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Official Student Documents</h2>
                      <p className="text-xs text-slate-500">Verified and Downloadable Credentials</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <FileText size={28} className="text-blue-600 mb-2" />
                      <h4 className="font-bold text-slate-900 text-sm">Admission Letter</h4>
                      <p className="text-xs text-slate-500 mb-4">Official letter of admission into {programme}.</p>
                    </div>
                    <button
                      onClick={() => alert(`Downloading Official Admission Letter for ${studentName} (${registrationNumber})`)}
                      className="px-3 py-2 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <ShieldCheck size={28} className="text-emerald-600 mb-2" />
                      <h4 className="font-bold text-slate-900 text-sm">Examination Clearance Card</h4>
                      <p className="text-xs text-slate-500 mb-4">Valid exam permit for 2026 Semester 1 series.</p>
                    </div>
                    <button
                      onClick={() => alert(`Generating Examination Clearance Pass for ${registrationNumber}`)}
                      className="px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Download Card
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <CreditCard size={28} className="text-purple-600 mb-2" />
                      <h4 className="font-bold text-slate-900 text-sm">Consolidated Fee Statement</h4>
                      <p className="text-xs text-slate-500 mb-4">Certified student financial ledger breakdown.</p>
                    </div>
                    <button
                      onClick={() => alert(`Exporting Consolidated Financial Statement for ${registrationNumber}`)}
                      className="px-3 py-2 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Export Statement
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PROGRAMME & COURSES VIEW */}
            {(activePage === "programme" || activePage === "course-registration") && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("dashboard")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Enrolled Units &amp; Course Registration</h2>
                      <p className="text-xs text-slate-500">{programme} • 6 Registered Core &amp; Practical Units</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg">
                    Total Credits: 20
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-4">Unit Code</th>
                        <th className="p-4">Unit Name</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4">Assigned Lecturer</th>
                        <th className="p-4">Attendance</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {INITIAL_STUDENT_UNITS.map((unit) => (
                        <tr key={unit.code} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-bold text-blue-900">{unit.code}</td>
                          <td className="p-4 font-semibold text-slate-800">{unit.title}</td>
                          <td className="p-4 text-slate-600">{unit.credits}</td>
                          <td className="p-4 text-xs text-slate-600">{unit.lecturerName}</td>
                          <td className="p-4 text-xs font-semibold text-slate-800">
                            <span className="text-emerald-700 font-bold">{unit.attendance}%</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                              Registered
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FOOTER */}
            <footer className="hca-footer">
              <div>
                <strong>HI-TECH COLLEGE</strong>
                <span>Learn • Innovate • Excel</span>
              </div>

              <p>
                © {new Date().getFullYear()} HI-TECH College. All rights reserved.
              </p>

              <div className="hca-footer-links">
                <button onClick={() => alert("HI-TECH College ISO 9001:2015 Policy & Data Protection Act 2019 compliance.")}>Privacy</button>
                <button onClick={() => alert("HI-TECH College Student Handbook & Code of Academic Integrity.")}>Terms</button>
                <button onClick={() => navigate("support")}>Help Centre</button>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

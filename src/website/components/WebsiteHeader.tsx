import React, { useState } from "react";
import {
  GraduationCap,
  Phone,
  Mail,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  Sparkles,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileCheck2,
  Headphones,
  BedDouble,
  Briefcase,
  Vote,
  Bell,
  BarChart3,
  LifeBuoy,
  QrCode,
  CreditCard,
  KeyRound,
  Users,
  UserPlus,
} from "lucide-react";
import { COLLEGE_INFO } from "../../data/college";
import { usePortalShellContext } from "../../context/PortalShellContext";

export interface WebsiteHeaderNavTarget {
  page: string;
  slug?: string;
  categoryFilter?: string;
  levelFilter?: string;
  departmentFilter?: string;
  dateFilter?: string;
  modeFilter?: string;
  action?: "chat" | "portal" | "apply";
}

interface DropdownChild {
  label: string;
  href: string;
  isSectionHeader?: boolean;
  target: WebsiteHeaderNavTarget;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  matchPages: string[];
  target: WebsiteHeaderNavTarget;
  children?: DropdownChild[];
}

interface WebsiteHeaderProps {
  currentPage: string;
  onNavigate: (page: string, options?: Omit<WebsiteHeaderNavTarget, "page" | "action">) => void;
  onOpenPortalModal: () => void;
  onSwitchToERP: (role: string) => void;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    matchPages: ["home"],
    target: { page: "home" },
  },
  {
    id: "about",
    label: "About Us",
    href: "/about",
    matchPages: ["about"],
    target: { page: "about" },
    children: [
      { label: "About the College", href: "/about", target: { page: "about" } },
      { label: "Vision, Mission & Values", href: "/about", target: { page: "about" } },
      {
        label: "Leadership & Governance",
        href: "/our-staff",
        target: { page: "our-staff", categoryFilter: "College leadership" },
      },
      { label: "TVETA Accreditation", href: "/about", target: { page: "about" } },
    ],
  },
  {
    id: "departments-staff",
    label: "Departments & Staff",
    href: "/departments",
    matchPages: ["departments", "department-details", "our-staff", "staff-details"],
    target: { page: "departments" },
    children: [
      {
        label: "Academic Departments",
        href: "/departments",
        isSectionHeader: true,
        target: { page: "departments" },
      },
      {
        label: "ICT & Computing",
        href: "/departments/ict-computer-science",
        target: { page: "department-details", slug: "ict-computer-science" },
      },
      {
        label: "Artificial Intelligence",
        href: "/departments/artificial-intelligence-data-science",
        target: { page: "department-details", slug: "artificial-intelligence-data-science" },
      },
      {
        label: "Business Studies",
        href: "/departments/business-management",
        target: { page: "department-details", slug: "business-management" },
      },
      {
        label: "Engineering & Technology",
        href: "/departments/engineering-technical-studies",
        target: { page: "department-details", slug: "engineering-technical-studies" },
      },
      {
        label: "Professional Studies",
        href: "/departments/professional-certification",
        target: { page: "department-details", slug: "professional-certification" },
      },
      {
        label: "Our Staff",
        href: "/our-staff",
        isSectionHeader: true,
        target: { page: "our-staff", categoryFilter: "ALL" },
      },
      {
        label: "College Management",
        href: "/our-staff",
        target: { page: "our-staff", categoryFilter: "College leadership" },
      },
      {
        label: "Academic Staff",
        href: "/our-staff",
        target: { page: "our-staff", categoryFilter: "Lecturers and trainers" },
      },
      {
        label: "Administrative Staff",
        href: "/our-staff",
        target: { page: "our-staff", categoryFilter: "Finance and administration" },
      },
      {
        label: "Heads of Departments",
        href: "/our-staff",
        target: { page: "our-staff", categoryFilter: "Heads of Departments" },
      },
      {
        label: "Full Staff Directory",
        href: "/our-staff",
        target: { page: "our-staff", categoryFilter: "ALL" },
      },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    href: "/academics",
    matchPages: ["academics", "course-details", "resources"],
    target: { page: "academics", levelFilter: "ALL" },
    children: [
      {
        label: "All Programmes",
        href: "/academics",
        target: { page: "academics", levelFilter: "ALL" },
      },
      {
        label: "Diploma Courses",
        href: "/academics",
        target: { page: "academics", levelFilter: "Diploma" },
      },
      {
        label: "Certificate Courses",
        href: "/academics",
        target: { page: "academics", levelFilter: "Certificate" },
      },
      {
        label: "Short Courses",
        href: "/academics",
        target: { page: "academics", levelFilter: "Short Course" },
      },
      {
        label: "Prospectus & Examination Bodies",
        href: "/resources",
        target: { page: "resources" },
      },
    ],
  },
  {
    id: "admissions",
    label: "Admissions",
    href: "/admissions",
    matchPages: ["admissions", "apply", "fees", "portal-guide"],
    target: { page: "admissions" },
    children: [
      { label: "How to Apply", href: "/admissions", target: { page: "admissions" } },
      { label: "Entry Requirements", href: "/admissions", target: { page: "admissions" } },
      { label: "Fees Structure", href: "/fees", target: { page: "fees" } },
      { label: "Online Application", href: "/apply", target: { page: "apply" } },
      { label: "Portal Access Guide", href: "/portal-guide", target: { page: "portal-guide" } },
    ],
  },
  {
    id: "campus",
    label: "Campus",
    href: "/campus",
    matchPages: ["campus", "verify"],
    target: { page: "campus" },
    children: [
      { label: "Our Campus", href: "/campus", target: { page: "campus" } },
      { label: "Campus Facilities & Labs", href: "/campus", target: { page: "campus" } },
      { label: "Verify Certificate", href: "/verify", target: { page: "verify" } },
      { label: "Campuses & Directions", href: "/contact", target: { page: "contact" } },
    ],
  },
  {
    id: "student-life",
    label: "Student Life",
    href: "/student-life",
    matchPages: ["student-life", "campus-life"],
    target: { page: "student-life" },
    children: [
      { label: "Clubs & Societies", href: "/student-life", target: { page: "student-life" } },
      { label: "Student Hostels & Welfare", href: "/student-life", target: { page: "student-life" } },
      {
        label: "Student Support (Dr.IT)",
        href: "/student-life",
        target: { page: "student-life", action: "chat" },
      },
    ],
  },
  {
    id: "news-events",
    label: "News & Events",
    href: "/events",
    matchPages: [
      "news",
      "events",
      "events-calendar",
      "events-verify-ticket",
      "event-details",
      "event-register",
      "event-confirmation",
      "graduation",
    ],
    target: { page: "events" },
    children: [
      { label: "Latest News & Bulletins", href: "/news", target: { page: "news" } },
      { label: "All College Events", href: "/events", target: { page: "events", dateFilter: "ALL" } },
      { label: "Graduation & Convocation", href: "/graduation", target: { page: "graduation" } },
      { label: "Monthly Events Calendar", href: "/events/calendar", target: { page: "events-calendar" } },
      { label: "Happening Today", href: "/events", target: { page: "events", dateFilter: "TODAY" } },
      { label: "Upcoming Summits & Expos", href: "/events", target: { page: "events", dateFilter: "UPCOMING" } },
      { label: "Workshops & Training", href: "/events", target: { page: "events", categoryFilter: "Workshop & Training" } },
      { label: "Online Webinars", href: "/events", target: { page: "events", modeFilter: "ONLINE" } },
      { label: "Verify Ticket / Certificate", href: "/events/verify-ticket", target: { page: "events-verify-ticket" } },
      { label: "Academic Circulars", href: "/resources", target: { page: "resources" } },
    ],
  },
  {
    id: "contact",
    label: "Contact Us",
    href: "/contact",
    matchPages: ["contact"],
    target: { page: "contact" },
  },
];

export default function WebsiteHeader({
  currentPage,
  onNavigate,
  onOpenPortalModal,
  onSwitchToERP,
}: WebsiteHeaderProps) {
  const ctx = usePortalShellContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);

  const isNavItemActive = (item: NavItem) => item.matchPages.includes(currentPage);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setExpandedMenu(null);
  };

  const navigateTarget = (target: WebsiteHeaderNavTarget, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    closeMenus();
    if (target.action === "chat") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hitech:open-chat"));
      }
      return;
    }
    if (target.action === "portal") {
      onOpenPortalModal();
      return;
    }
    const { page, slug, categoryFilter, levelFilter, departmentFilter, dateFilter, modeFilter } =
      target;
    onNavigate(page, {
      slug,
      categoryFilter,
      levelFilter,
      departmentFilter,
      dateFilter,
      modeFilter,
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleSubmenu = (id: string) => {
    setExpandedMenu((prev) => (prev === id ? null : id));
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b-4 border-[#193968] shadow-[0_2px_12px_rgba(10,32,65,0.07)]">
      {/* Top Institutional Utility Bar */}
      <div className="bg-[#0f274a] text-white text-xs py-2 px-4 sm:px-6 border-b border-blue-900/40">
        <div className="max-w-[1510px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-300">
            <a
              href={`tel:${COLLEGE_INFO.contacts.admissionsPhone.replace(/\s+/g, "")}`}
              className="flex items-center gap-1.5 hover:text-white transition"
            >
              <Phone className="w-3.5 h-3.5 text-red-400" />
              <span className="tabular-nums">{COLLEGE_INFO.contacts.admissionsPhone}</span>
            </a>
            <a
              href={`mailto:${COLLEGE_INFO.contacts.email}`}
              className="hidden md:flex items-center gap-1.5 hover:text-white transition"
            >
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>{COLLEGE_INFO.contacts.email}</span>
            </a>
            <div className="hidden lg:flex items-center gap-1.5 text-blue-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TVETA Accredited: {COLLEGE_INFO.registrationNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onSwitchToERP("catalogue")}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#092c60] px-2.5 py-1 rounded font-black text-xs transition shadow-sm"
              title="View Complete 84 Modules, Feature Register & Export Official PDF Document"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Master Blueprint (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTarget({ page: "portal-guide" })}
              className="hidden md:inline-flex items-center gap-1 text-blue-200 hover:text-white hover:underline transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Portal Guide</span>
            </button>

            <button
              type="button"
              onClick={onOpenPortalModal}
              className="inline-flex items-center gap-1.5 bg-[#d92332] hover:bg-[#b81d2a] text-white px-3 py-1 rounded font-semibold text-xs transition shadow-sm"
              title="Click to sign in or learn how to access your student portal"
            >
              <Lock className="w-3 h-3" />
              <span>Student Portal</span>
            </button>

            <div className="relative">
              <button
                type="button"
                aria-expanded={portalDropdownOpen}
                onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-xs font-semibold transition"
              >
                <span>Staff &amp; ERP (20)</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {portalDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-72 max-h-[80vh] overflow-y-auto bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs font-medium"
                  onMouseLeave={() => setPortalDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase font-black text-[#092c60] tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>HI-TECH ERP Portals</span>
                    <span className="bg-blue-100 text-[#092c60] px-1.5 py-0.5 rounded text-[9px] font-black">20 Workspaces</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("staff");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-[#0f274a] font-bold border-b border-slate-100 bg-blue-50/40"
                  >
                    <Briefcase className="w-4 h-4 text-[#0875e8]" />
                    <div>
                      <div>Staff Portal (All 21 Roles)</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Admin, Principal, Registrar, HR, Finance &amp; Ops
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("manual-registration");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-800 font-semibold border-b border-slate-100"
                  >
                    <UserPlus className="w-4 h-4 text-[#1769AA]" />
                    <div>
                      <div>Manual User Registration</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Create &amp; Approve Staff-Managed Accounts
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("activate-account");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center gap-2.5 text-emerald-900 font-semibold border-b border-slate-100"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Activate Invited Account</div>
                      <div className="text-[10px] text-emerald-700 font-normal">
                        Single-Use Token Password Setup
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("catalogue");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2.5 text-amber-900 font-bold border-b border-slate-100"
                  >
                    <FileCheck2 className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-amber-900">Master Feature Blueprint</div>
                      <div className="text-[10px] text-amber-700 font-normal">
                        All 84 Modules &amp; Baseline PDF
                      </div>
                    </div>
                  </button>

                  {/* Academics & Learning */}
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-extrabold text-blue-700 bg-blue-50/60">
                    Academics &amp; Learning
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("student");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-blue-900 font-semibold"
                  >
                    <GraduationCap className="w-4 h-4 text-blue-700 shrink-0" />
                    <div>
                      <div>Student Dashboard</div>
                      <div className="text-[10px] text-slate-500 font-normal">HCA/STU/2026/001 Portal</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("lecturer");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div>Lecturer / Trainer Portal</div>
                      <div className="text-[10px] text-slate-500">Module 18 Faculty Workspace</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("examination");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <FileCheck2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div>Examinations &amp; CBT Engine</div>
                      <div className="text-[10px] text-slate-500">63 Question Types &amp; CBT Runner</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchToERP("library");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <div>Central Library Management</div>
                      <div className="text-[10px] text-slate-500">Circulation, Barcodes &amp; E-Books</div>
                    </div>
                  </button>

                  {/* Admissions & Registry */}
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-extrabold text-indigo-700 bg-indigo-50/60 border-t border-slate-100">
                    Admissions &amp; Registry
                  </div>
                  <button
                    onClick={() => {
                      onSwitchToERP("admissions");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div>Admissions &amp; Enrolment</div>
                      <div className="text-[10px] text-slate-500">Applications, Offers &amp; Enrolment</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchToERP("registrar");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                    <div>
                      <div>Academic Registrar Dashboard</div>
                      <div className="text-[10px] text-slate-500">Module 19 Transcripts (TRX), Roll &amp; Deferments</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("finance");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div>Finance &amp; Accounts</div>
                      <div className="text-[10px] text-slate-500">Module 20 M-Pesa &amp; Receipts</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("admissions");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Admissions &amp; Enrolment</div>
                      <div className="text-[10px] text-slate-500">Module 24 Offers &amp; Intake</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("library");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <div>
                      <div>Library Management</div>
                      <div className="text-[10px] text-slate-500">Module 22 Physical &amp; E-Books</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("examination");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <FileCheck2 className="w-4 h-4 text-indigo-700" />
                    <div>
                      <div>Examinations &amp; CBT</div>
                      <div className="text-[10px] text-slate-500">Module 23 Question Bank &amp; Tests</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("generator");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div>Central Reg Generator</div>
                      <div className="text-[10px] text-slate-500">HCA/<wbr/>STAFF/2026/001 Engine</div>
                    </div>
                  </button>
                  {/* Finance & HR */}
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-extrabold text-emerald-800 bg-emerald-50/60 border-t border-slate-100">
                    Finance &amp; Operations
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("finance");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <div>Finance &amp; Lipa na M-Pesa</div>
                      <div className="text-[10px] text-slate-500">STK Push, Fee Structures &amp; Receipts</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("hr");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Briefcase className="w-4 h-4 text-blue-700 shrink-0" />
                    <div>
                      <div>HR &amp; Staff People Ops</div>
                      <div className="text-[10px] text-slate-500">Contracts, Leave &amp; Teaching Hours</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchToERP("staff-users");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <KeyRound className="w-4 h-4 text-indigo-700 shrink-0" />
                    <div>
                      <div>Staff User Management</div>
                      <div className="text-[10px] text-slate-500">Platform Accounts, RBAC &amp; Invitations</div>
                    </div>
                  </button>

                  {/* Campus Ops & Student Welfare */}
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-extrabold text-amber-800 bg-amber-50/60 border-t border-slate-100">
                    Campus Life &amp; Compliance
                  </div>
                  <button
                    onClick={() => {
                      onSwitchToERP("hostels");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <BedDouble className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <div>Hostels &amp; Student Welfare</div>
                      <div className="text-[10px] text-slate-500">Beds, Stays, Billing &amp; Support</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("community");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Vote className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <div>Elections, Clubs &amp; Alumni</div>
                      <div className="text-[10px] text-slate-500">Secret Ballots &amp; Campus Societies</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("engagement");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div>Notices, Guardians &amp; Careers</div>
                      <div className="text-[10px] text-slate-500">Broadcasts, Parent Consent &amp; Attachments</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("quality-reports");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <div>Docs, Quality &amp; Reports</div>
                      <div className="text-[10px] text-slate-500">TVETA Audit, Vault &amp; CSV Analytics</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToERP("campus-services");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <QrCode className="w-4 h-4 text-[#153b70] shrink-0" />
                    <div>
                      <div>Credentials, CRM &amp; Services</div>
                      <div className="text-[10px] text-slate-500">QR Verify, CRM Pipeline &amp; Compliance</div>
                    </div>
                  </button>

                  {/* AI & Governance */}
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-extrabold text-purple-800 bg-purple-50/60 border-t border-slate-100">
                    AI &amp; Support Systems
                  </div>
                  <button
                    onClick={() => {
                      onSwitchToERP("chatbot-admin");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Headphones className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div>Chatbot &amp; AI Service Desk</div>
                      <div className="text-[10px] text-slate-500">Modules 36-39 KB &amp; Escalations</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchToERP("ai-governance");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>AI Governance Centre</div>
                      <div className="text-[10px] text-slate-500">Modules 40-42 Quotas &amp; Indexing</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchToERP("ai-support");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <LifeBuoy className="w-4 h-4 text-[#d92332] shrink-0" />
                    <div>
                      <div>AI Support &amp; Help Centre</div>
                      <div className="text-[10px] text-slate-500">Module 43 Assistants &amp; Tickets</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchToERP("catalogue");
                      setPortalDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2.5 text-amber-900 font-bold border-t border-slate-100"
                  >
                    <FileCheck2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-amber-900">Master Feature Blueprint</div>
                      <div className="text-[10px] text-amber-700 font-normal">47 Modules Specification &amp; PDF</div>
                    </div>
                  </button>

                  {/* ALL PORTALS LAUNCHER BUTTON */}
                  <div className="p-2 border-t border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        setPortalDropdownOpen(false);
                        ctx?.openSwitcher?.();
                      }}
                      className="w-full py-2 px-3 bg-[#092c60] hover:bg-[#061d40] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Open All 20 Portals Hub...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Sticky Header Container */}
      <div className="max-w-[1510px] mx-auto px-4 sm:px-6 min-h-[76px] flex items-center justify-between gap-5">
        {/* College Brand */}
        <a
          href="/"
          onClick={(e) => navigateTarget({ page: "home" }, e)}
          className="flex items-center gap-3 shrink-0 group select-none"
        >
          <div className="w-10 h-11 rounded-lg bg-gradient-to-br from-[#254878] to-[#10294f] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-[162px]">
            <div className="text-[17px] leading-tight font-black tracking-tight text-[#193968] whitespace-nowrap">
              HI-TECH <span className="text-[#e31c32]">COLLEGE</span>
            </div>
            <p className="mt-0.5 text-[9px] font-semibold tracking-wider text-[#536783] uppercase">
              Technology &amp; Applied Sciences · Kenya
            </p>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden xl:flex items-center justify-center gap-3.5 2xl:gap-5 flex-1 h-[76px]">
          {NAVIGATION_ITEMS.map((item) => {
            const active = isNavItemActive(item);
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isCombinedMenu = item.id === "departments-staff";

            return (
              <div
                key={item.id}
                className="relative h-full flex items-center group"
              >
                <a
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => navigateTarget(item.target, e)}
                  className={`relative h-full flex items-center gap-1 text-[12px] whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? "text-[#193968] font-bold"
                      : "text-[#3d4e69] hover:text-[#193968] font-medium"
                  }`}
                >
                  <span>{item.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      size={13}
                      className="transition-transform duration-150 group-hover:rotate-180"
                    />
                  )}
                  <span
                    className={`absolute left-0 right-0 bottom-3.5 h-[3px] rounded-full bg-[#214b88] transition-opacity duration-150 ${
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </a>

                {hasChildren && item.children && (
                  <div
                    className={`absolute top-[calc(100%-2px)] left-0 ${
                      isCombinedMenu ? "min-w-[280px] max-h-[75vh] overflow-y-auto" : "min-w-[235px]"
                    } p-2.5 bg-white border border-[#e6ebf2] border-t-[3px] border-t-[#e31c32] rounded-b-lg shadow-[0_12px_30px_rgba(12,35,70,0.15)] opacity-0 invisible translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:pointer-events-auto transition-all duration-150 z-50`}
                  >
                    <div className="px-2.5 py-2 text-xs font-extrabold text-[#193968] border-b border-[#edf0f5] mb-1">
                      {item.label}
                    </div>
                    <div className="space-y-0.5">
                      {item.children.map((child, idx) =>
                        child.isSectionHeader ? (
                          <a
                            key={`${child.label}-${idx}`}
                            href={child.href}
                            onClick={(e) => navigateTarget(child.target, e)}
                            className="mt-1.5 first:mt-0 block px-3 py-2 rounded text-[11px] font-black uppercase tracking-wider text-[#193968] bg-[#f0f4fa] border-l-[3px] border-l-[#e31c32] hover:bg-[#e4ecf7] transition-colors"
                          >
                            {child.label}
                          </a>
                        ) : (
                          <a
                            key={`${child.label}-${idx}`}
                            href={child.href}
                            onClick={(e) => navigateTarget(child.target, e)}
                            className="group/link flex items-center justify-between gap-3 px-3 py-2 rounded text-xs text-[#465671] hover:bg-[#f0f4fa] hover:text-[#193968] hover:pl-3.5 transition-all"
                          >
                            <span>{child.label}</span>
                            <ArrowRight
                              size={14}
                              className="text-[#e31c32] opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0"
                            />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Primary CTA Button */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <a
            href="/apply"
            onClick={(e) => navigateTarget({ page: "apply" }, e)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1c3f75] hover:bg-[#e31c32] text-white rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <span>Apply Now</span>
            <ArrowRight size={15} />
          </a>
        </div>

        {/* Mobile Controls */}
        <div className="xl:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPortalModal}
            className="sm:hidden bg-[#d92332] text-white px-3 py-2 rounded-lg font-semibold text-xs min-h-[40px]"
          >
            Portal
          </button>
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="ht-mobile-navigation"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="min-w-[44px] min-h-[44px] rounded-lg bg-[#f0f3f8] text-[#193968] flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Navigation Drawer */}
      <div
        id="ht-mobile-navigation"
        aria-hidden={!mobileMenuOpen}
        className={`xl:hidden border-t border-[#e9edf3] bg-white px-5 pb-6 pt-3 max-h-[calc(100dvh-120px)] overflow-y-auto shadow-lg ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#193968]">Student Portal Fast Access</div>
            <div className="text-[11px] text-[#536783]">Login with HCA/STU/2026/001</div>
          </div>
          <button
            type="button"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => {
              onOpenPortalModal();
              closeMenus();
            }}
            className="bg-[#e31c32] text-white px-3 py-2 rounded-md font-bold text-xs min-h-[40px]"
          >
            Sign In
          </button>
        </div>

        <nav aria-label="Mobile college navigation" className="divide-y divide-[#edf0f5]">
          {NAVIGATION_ITEMS.map((item) => {
            const active = isNavItemActive(item);
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isExpanded = expandedMenu === item.id;

            return (
              <div key={item.id} className="py-1">
                <div className="flex items-center justify-between">
                  <a
                    href={item.href}
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => navigateTarget(item.target, e)}
                    className={`flex-1 py-3 px-1 text-sm font-semibold ${
                      active ? "text-[#e31c32]" : "text-[#344966]"
                    }`}
                  >
                    {item.label}
                  </a>
                  {hasChildren && (
                    <button
                      type="button"
                      tabIndex={mobileMenuOpen ? 0 : -1}
                      aria-label={`Toggle ${item.label} submenu`}
                      aria-expanded={isExpanded}
                      onClick={() => toggleSubmenu(item.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#193968]"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-150 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {hasChildren && isExpanded && item.children && (
                  <div className="pb-3 pl-3.5 flex flex-col gap-0.5">
                    {item.children.map((child, idx) => (
                      <a
                        key={`${child.label}-${idx}`}
                        href={child.href}
                        tabIndex={mobileMenuOpen ? 0 : -1}
                        onClick={(e) => navigateTarget(child.target, e)}
                        className={`py-2 px-3 text-xs border-l-2 ${
                          child.isSectionHeader
                            ? "border-[#193968] bg-[#f0f4fa] text-[#193968] font-black uppercase tracking-wider mt-1.5"
                            : "border-[#e31c32] text-[#536783] hover:text-[#193968] hover:bg-slate-50 font-medium"
                        }`}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="pt-4 space-y-2.5">
          <a
            href="/apply"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={(e) => navigateTarget({ page: "apply" }, e)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#193968] text-white text-xs font-extrabold"
          >
            <span>Apply Now</span>
            <ArrowRight size={16} />
          </a>

          <button
            type="button"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => {
              onOpenPortalModal();
              closeMenus();
            }}
            className="flex items-center justify-center w-full py-3 rounded-lg bg-[#edf2fa] border border-[#dce5f1] text-[#193968] text-xs font-extrabold"
          >
            Student Portal Login
          </button>
        </div>
      </div>
    </header>
  );
}

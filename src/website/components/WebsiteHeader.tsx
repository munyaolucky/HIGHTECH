import React, { useState } from "react";
import {
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  Sparkles,
  ExternalLink,
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
  Users,
  KeyRound,
} from "lucide-react";
import { COLLEGE_INFO } from "../../data/college";
import { usePortalShellContext } from "../../context/PortalShellContext";

interface WebsiteHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenPortalModal: () => void;
  onSwitchToERP: (role: string) => void;
}

export default function WebsiteHeader({
  currentPage,
  onNavigate,
  onOpenPortalModal,
  onSwitchToERP,
}: WebsiteHeaderProps) {
  const ctx = usePortalShellContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "about", label: "About Us" },
    { id: "academics", label: "Academics & Courses" },
    { id: "admissions", label: "Admissions" },
    { id: "apply", label: "Apply Online", badge: "2026 Intake" },
    { id: "campus-life", label: "Campus Life" },
    { id: "news", label: "News & Events" },
    { id: "resources", label: "Resources & Downloads" },
    { id: "portal-guide", label: "Student Portal Guide" },
    { id: "contact", label: "Contact" },
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-[52px] z-40 bg-white shadow-sm border-b border-slate-200">
      {/* Top Institutional Bar */}
      <div className="bg-[#0f274a] text-white text-xs py-2 px-4 sm:px-6 border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Quick Contact & Accreditation */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-300">
            <div className="flex items-center gap-1.5 hover:text-white transition">
              <Phone className="w-3.5 h-3.5 text-red-400" />
              <span>{COLLEGE_INFO.contacts.admissionsPhone}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 hover:text-white transition">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>{COLLEGE_INFO.contacts.email}</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-blue-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TVETA Accredited: {COLLEGE_INFO.registrationNumber}</span>
            </div>
          </div>

          {/* Institutional Portal Jump Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onSwitchToERP("catalogue")}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-[#092c60] px-2.5 py-1 rounded font-black text-xs transition shadow-sm"
              title="View Complete 47 Modules & Export Official PDF Document"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Master Blueprint (PDF)</span>
            </button>

            <button
              onClick={() => handleNavClick("portal-guide")}
              className="hidden md:inline-flex items-center gap-1 text-blue-200 hover:text-white hover:underline transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Portal Guide</span>
            </button>

            {/* Direct Student Portal Quick Access */}
            <button
              onClick={onOpenPortalModal}
              className="inline-flex items-center gap-1.5 bg-[#d92332] hover:bg-[#b81d2a] text-white px-3 py-1 rounded font-semibold text-xs transition shadow-sm"
              title="Click to sign in or learn how to access your student portal"
            >
              <Lock className="w-3 h-3" />
              <span>Student Portal</span>
            </button>

            {/* Other ERP Portals Dropdown */}
            <div className="relative">
              <button
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

                  {/* Academics & Learning */}
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-extrabold text-blue-700 bg-blue-50/60">
                    Academics &amp; Learning
                  </div>
                  <button
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
                      <div className="text-[10px] text-slate-500">Transcripts (TRX), Roll &amp; Deferments</div>
                    </div>
                  </button>
                  <button
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

      {/* Main Brand & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#153b70] to-[#091b38] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-[#153b70]">HI-TECH</span>
              <span className="font-bold text-xl tracking-tight text-[#d92332]">COLLEGE</span>
            </div>
            <div className="text-[11px] font-medium text-slate-500 tracking-wide uppercase hidden sm:block">
              Technology & Applied Sciences Kenya
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`transition-colors py-1 relative flex items-center gap-1 ${
                  isActive
                    ? "text-[#153b70] font-bold"
                    : "hover:text-[#153b70] text-slate-600"
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#153b70] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => handleNavClick("apply")}
            className="bg-[#153b70] hover:bg-[#0f274a] text-white px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition shadow-sm flex items-center gap-1.5"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={onOpenPortalModal}
            className="sm:hidden bg-[#d92332] text-white px-2.5 py-1.5 rounded font-semibold text-xs"
          >
            Portal
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-900">Student Portal Fast Access</div>
              <div className="text-[11px] text-blue-700">Login with HCA/STU/2026/001</div>
            </div>
            <button
              onClick={() => {
                onOpenPortalModal();
                setMobileMenuOpen(false);
              }}
              className="bg-[#d92332] text-white px-3 py-1.5 rounded font-bold text-xs"
            >
              Sign In
            </button>
          </div>

          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left py-2 px-3 rounded-md text-sm font-medium flex items-center justify-between ${
                currentPage === link.id
                  ? "bg-blue-50 text-[#153b70] font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-200">
            <button
              onClick={() => {
                handleNavClick("apply");
              }}
              className="w-full bg-[#153b70] text-white py-2.5 rounded-lg font-bold text-sm text-center shadow-sm"
            >
              Apply Online for 2026 Intake
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

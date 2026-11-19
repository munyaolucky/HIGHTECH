/**
 * HI-TECH College Integrated Digital Academic & Certification Platform
 * Multi-Role Enterprise ERP & Central Registration Number Generator Suite
 */

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Hash,
  BookOpen,
  FileCheck2,
  Users,
  CreditCard,
  Building2,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  UserCheck,
  Globe,
  Headphones,
  BedDouble,
  Briefcase,
  Vote,
  Bell,
  BarChart3,
  LifeBuoy,
  QrCode,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import StudentDashboard from "./modules/student/StudentDashboard";
import RegistrationGeneratorPortal from "./components/RegistrationGeneratorPortal";
import LibraryPortal from "./modules/library/LibraryPortal";
import ExaminationPortal from "./modules/examination/ExaminationPortal";
import AdmissionsPortal from "./modules/admissions/AdmissionsPortal";
import RegistrarPortal from "./modules/registrar/RegistrarPortal";
import FinancePortal from "./modules/finance/FinancePortal";
import LecturerPortal from "./modules/lecturer/LecturerPortal";
import MasterFeatureCataloguePortal from "./modules/catalogue/MasterFeatureCataloguePortal";
import ChatbotAdminPortal from "./modules/chatbot/ChatbotAdminPortal";
import AIGovernancePortal from "./modules/ai-governance/AIGovernancePortal";
import HostelsServicesPortal from "./modules/hostels/HostelsServicesPortal";
import HRStaffPortal from "./modules/hr/HRStaffPortal";
import ElectionsCommunityPortal from "./modules/community/ElectionsCommunityPortal";
import EngagementHubPortal from "./modules/engagement/EngagementHubPortal";
import QualityReportsPortal from "./modules/quality/QualityReportsPortal";
import AISupportCentrePortal from "./modules/ai-support/AISupportCentrePortal";
import CampusServicesPortal from "./modules/campus-services/CampusServicesPortal";
import StaffUserManagementPage from "./modules/users/StaffUserManagementPage";
import PublicWebsite from "./website/PublicWebsite";
import UserPortalShell from "./components/UserPortalShell";
import GlobalPortalSwitcherModal from "./components/GlobalPortalSwitcherModal";
import { PortalShellProvider, usePortalShellContext } from "./context/PortalShellContext";
import { getPortalShellConfig, ShellRoleKey } from "./config/portalShellConfigs";
import { PortalRole } from "./types";

const portals = [
    {
      id: "website" as PortalRole,
      label: "Public Website",
      badge: "Campus",
      icon: Globe,
      description: "Official College Website, Courses, Admissions & Enquiries",
    },
    {
      id: "catalogue" as PortalRole,
      label: "Master Feature Blueprint",
      badge: "47 Modules & PDF",
      icon: FileCheck2,
      description: "Full Feature Catalogue, 63 CBT Questions, RBAC Matrix & PDF Export",
    },
    {
      id: "chatbot-admin" as PortalRole,
      label: "Chatbot & AI Desk",
      badge: "Mod 36-39",
      icon: Headphones,
      description: "Knowledge Base, Escalations, Analytics & Controlled RAG Desk",
    },
    {
      id: "ai-governance" as PortalRole,
      label: "AI Governance Centre",
      badge: "Mod 40-42",
      icon: ShieldCheck,
      description: "AI Quotas, Prompt Rollback, Indexing Queue, Performance & Alerts",
    },
    {
      id: "student" as PortalRole,
      label: "Student Portal",
      badge: "HCA/STU/...",
      icon: GraduationCap,
      description: "Student Dashboard, Units, Timetable & Results",
    },
    {
      id: "generator" as PortalRole,
      label: "Central Reg Generator",
      badge: "HCA/<TYPE>/<YEAR>/<SEQ>",
      icon: Hash,
      description: "Atomic Generator for HCA/STAFF/2026/001 & All Types",
    },
    {
      id: "lecturer" as PortalRole,
      label: "Lecturer / Trainer",
      badge: "Module 18",
      icon: UserCheck,
      description: "Faculty Teaching Roster & Attendance Register",
    },
    {
      id: "registrar" as PortalRole,
      label: "Registrar Portal",
      badge: "Module 19",
      icon: Building2,
      description: "Official Transcripts (TRX), Records & Certificates",
    },
    {
      id: "finance" as PortalRole,
      label: "Finance & Accounts",
      badge: "Module 20",
      icon: CreditCard,
      description: "Fee Structures, M-Pesa STK & Official Receipts",
    },
    {
      id: "library" as PortalRole,
      label: "Library Management",
      badge: "Module 22",
      icon: BookOpen,
      description: "Physical Catalogue, Barcodes & Digital E-Books",
    },
    {
      id: "examination" as PortalRole,
      label: "Examinations & CBT",
      badge: "Module 23",
      icon: FileCheck2,
      description: "63 Question Types Registry & Online CBT Test Engine",
    },
    {
      id: "admissions" as PortalRole,
      label: "Admissions & Enrolment",
      badge: "Module 24",
      icon: Users,
      description: "Applications, Offer Letters & Student Conversion",
    },
    {
      id: "hostels" as PortalRole,
      label: "Hostels & Welfare",
      badge: "Campus Ops",
      icon: BedDouble,
      description: "Residence Inventory, Bed Allocations, Billing & Sensitive Cases",
    },
    {
      id: "hr" as PortalRole,
      label: "HR & Staff",
      badge: "People Ops",
      icon: Briefcase,
      description: "Staff Registry, Independent Contracts, Leave, Attendance & Workloads",
    },
    {
      id: "community" as PortalRole,
      label: "Elections & Community",
      badge: "Secret Ballot",
      icon: Vote,
      description: "Secret-Ballot SRC Elections, Clubs, Events, Volunteering & Alumni",
    },
    {
      id: "engagement" as PortalRole,
      label: "Notices, Guardians & Careers",
      badge: "Stakeholders",
      icon: Bell,
      description: "In-App Inbox, Outbox, Parent Consent Portal & Placements",
    },
    {
      id: "quality-reports" as PortalRole,
      label: "Docs, Quality & Reports",
      badge: "TVETA / CSV",
      icon: BarChart3,
      description: "Document Vault, TVETA Accreditation & Multi-Currency CSV Exports",
    },
    {
      id: "ai-support" as PortalRole,
      label: "AI Support & Help Centre",
      badge: "Module 43",
      icon: LifeBuoy,
      description: "7-Role AI Assistants, PII Redaction & Help Desk Tickets",
    },
    {
      id: "campus-services" as PortalRole,
      label: "Credentials, CRM & Services",
      badge: "Campus Suite",
      icon: QrCode,
      description: "QR Credential Verify, Admissions CRM Pipeline, Appointments & Compliance",
    },
    {
      id: "staff-users" as PortalRole,
      label: "Staff User Management",
      badge: "Admin",
      icon: Users,
      description: "Platform Account Administration, Role Assignment & Access Governance",
    },
  ];

const primaryQuickIds: PortalRole[] = [
  "website",
  "student",
  "lecturer",
  "examination",
  "finance",
  "registrar",
  "generator",
  "catalogue",
];

function AppContent() {
  const ctx = usePortalShellContext();
  const currentRole = ctx?.currentRole ?? "website";
  const setCurrentRole = ctx?.setCurrentRole ?? (() => {});
  const isSwitcherOpen = ctx?.isSwitcherOpen ?? false;
  const setIsSwitcherOpen = ctx?.setIsSwitcherOpen ?? (() => {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSwitcherOpen(!isSwitcherOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSwitcherOpen, setIsSwitcherOpen]);

  const activePortalInfo = portals.find((p) => p.id === currentRole) ?? portals[0];
  const ActiveIcon = activePortalInfo.icon;

  const renderShellPortalBody = (role: ShellRoleKey) => {
    switch (role) {
      case "catalogue":
        return <MasterFeatureCataloguePortal />;
      case "chatbot-admin":
        return <ChatbotAdminPortal />;
      case "ai-governance":
        return <AIGovernancePortal />;
      case "generator":
        return <RegistrationGeneratorPortal />;
      case "registrar":
        return <RegistrarPortal onSwitchPortal={(r) => setCurrentRole(r)} />;
      case "finance":
        return <FinancePortal onSwitchPortal={(r) => setCurrentRole(r)} />;
      case "library":
        return <LibraryPortal onSwitchPortal={(r) => setCurrentRole(r)} />;
      case "examination":
        return <ExaminationPortal />;
      case "admissions":
        return <AdmissionsPortal onSwitchPortal={(r) => setCurrentRole(r)} />;
      case "hostels":
        return <HostelsServicesPortal />;
      case "hr":
        return <HRStaffPortal />;
      case "community":
        return <ElectionsCommunityPortal />;
      case "engagement":
        return <EngagementHubPortal />;
      case "quality-reports":
        return <QualityReportsPortal />;
      case "ai-support":
        return <AISupportCentrePortal />;
      case "campus-services":
        return <CampusServicesPortal />;
      case "staff-users":
        return <StaffUserManagementPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fd] text-[#102b55] flex flex-col font-sans">
      {/* Top Global Role Navigation Bar */}
      <nav className="bg-[#061d40] text-white border-b border-blue-900/60 sticky top-0 z-50 px-3 sm:px-6 h-[52px] flex items-center shadow-md">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentRole("website")}
              className="flex items-center gap-2.5 text-left group select-none shrink-0"
              title="Return to Public Website Homepage"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-300 text-[#092c60] flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
                <GraduationCap size={20} />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-xs sm:text-sm text-white">
                    HI-TECH COLLEGE
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-[#092c60]">
                    ERP 2026
                  </span>
                </div>
              </div>
            </button>

            {/* Breadcrumb Indicator */}
            <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/15 text-xs text-blue-200 truncate">
              <ChevronRight size={13} className="text-slate-400 shrink-0" />
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md text-white font-bold truncate">
                <ActiveIcon size={14} className="text-amber-300 shrink-0" />
                <span className="truncate">{activePortalInfo.label}</span>
                <span className="hidden lg:inline text-[10px] text-blue-200 font-normal">
                  ({activePortalInfo.badge})
                </span>
              </div>
            </div>
          </div>

          {/* Quick-Jump Ribbon + Hub Launcher */}
          <div className="flex items-center gap-2">
            {/* Desktop Quick-Jump Pills */}
            <div className="hidden xl:flex items-center gap-1 bg-black/25 p-0.5 rounded-xl border border-white/10">
              {portals
                .filter((p) => primaryQuickIds.includes(p.id))
                .map((p) => {
                  const Icon = p.icon;
                  const isActive = currentRole === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setCurrentRole(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? "bg-[#0875e8] text-white shadow-xs"
                          : "text-blue-200 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon size={13} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
            </div>

            {/* GLOBAL SWITCHER BUTTON */}
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(true)}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-[#092c60] px-3 py-1.5 rounded-lg text-xs font-black shadow-sm transition group"
              title="Open Complete 20-Portal Workspace Hub (Ctrl+K / ⌘K)"
            >
              <LayoutGrid size={14} className="group-hover:rotate-12 transition-transform" />
              <span>All 20 Portals</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 rounded text-[10px] bg-black/15 font-mono font-bold">
                ⌘K
              </kbd>
            </button>

            {/* Quick Dropdown Fallback */}
            <select
              aria-label="Select institutional portal"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as PortalRole)}
              className="bg-[#092c60] border border-blue-400/40 text-xs font-bold text-white px-2.5 py-1.5 rounded-lg outline-none cursor-pointer max-w-[170px] sm:max-w-[210px] truncate"
            >
              {portals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.badge})
                </option>
              ))}
            </select>
          </div>
        </div>
      </nav>

      {/* RENDER CURRENT ACTIVE PORTAL */}
      <div className="flex-1">
        {currentRole === "website" ? (
          <PublicWebsite
            onSwitchToERP={(role) => setCurrentRole(role as PortalRole)}
            onLaunchStudentDashboard={() => setCurrentRole("student")}
          />
        ) : currentRole === "student" ? (
          <StudentDashboard
            onSwitchPortal={(role) => setCurrentRole(role as PortalRole)}
            onLogout={() => setCurrentRole("website")}
          />
        ) : currentRole === "lecturer" ? (
          <LecturerPortal
            onLogout={() => setCurrentRole("website")}
            onSwitchPortal={(role) => setCurrentRole(role as PortalRole)}
          />
        ) : (
          <UserPortalShell
            config={getPortalShellConfig(currentRole as ShellRoleKey)}
            onSwitchPortal={(role) => setCurrentRole(role)}
            onLogout={() => setCurrentRole("website")}
          >
            {renderShellPortalBody(currentRole as ShellRoleKey)}
          </UserPortalShell>
        )}
      </div>

      {/* GLOBAL 20-PORTAL SWITCHER MODAL */}
      <GlobalPortalSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentRole={currentRole}
        onSelectRole={(role) => setCurrentRole(role)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PortalShellProvider>
      <AppContent />
    </PortalShellProvider>
  );
}

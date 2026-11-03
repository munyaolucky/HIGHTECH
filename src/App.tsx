/**
 * HI-TECH College Integrated Digital Academic & Certification Platform
 * Multi-Role Enterprise ERP & Central Registration Number Generator Suite
 */

import React, { useState } from "react";
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
import PublicWebsite from "./website/PublicWebsite";
import { PortalRole } from "./types";

export default function App() {
  const [currentRole, setCurrentRole] = useState<PortalRole>("website");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fd] text-[#102b55] flex flex-col font-sans">
      {/* Top Global Role Navigation Bar */}
      <nav className="bg-[#061d40] text-white border-b border-blue-900/60 sticky top-0 z-50 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-300 text-[#092c60] flex items-center justify-center font-black shadow-sm">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-sm sm:text-base text-white">
                  HI-TECH COLLEGE
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-[#092c60]">
                  ERP 2026
                </span>
              </div>
              <p className="text-[10px] text-blue-200 hidden sm:block">
                Integrated Academic &amp; Central Certification Platform
              </p>
            </div>
          </div>

          {/* Desktop Portal Switcher Pills */}
          <div className="hidden xl:flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/10">
            {portals.map((p) => {
              const Icon = p.icon;
              const isActive = currentRole === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentRole(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#0875e8] text-white shadow-md"
                      : "text-blue-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={14} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dropdown for Medium / Mobile */}
          <div className="xl:hidden flex items-center gap-2">
            <select
              aria-label="Select administrative portal"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as PortalRole)}
              className="bg-[#092c60] border border-blue-400/40 text-xs font-bold text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer"
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
        {currentRole === "website" && (
          <PublicWebsite
            onSwitchToERP={(role) => setCurrentRole(role as PortalRole)}
            onLaunchStudentDashboard={() => setCurrentRole("student")}
          />
        )}

        {currentRole === "catalogue" && (
          <MasterFeatureCataloguePortal />
        )}

        {currentRole === "chatbot-admin" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <ChatbotAdminPortal />
          </div>
        )}

        {currentRole === "student" && (
          <StudentDashboard
            onSwitchPortal={(role) => setCurrentRole(role as PortalRole)}
            onLogout={() => setCurrentRole("website")}
          />
        )}

        {currentRole === "generator" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <RegistrationGeneratorPortal />
          </div>
        )}

        {currentRole === "lecturer" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <LecturerPortal />
          </div>
        )}

        {currentRole === "registrar" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <RegistrarPortal />
          </div>
        )}

        {currentRole === "finance" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <FinancePortal />
          </div>
        )}

        {currentRole === "library" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <LibraryPortal />
          </div>
        )}

        {currentRole === "examination" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <ExaminationPortal />
          </div>
        )}

        {currentRole === "admissions" && (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <AdmissionsPortal />
          </div>
        )}
      </div>
    </div>
  );
}

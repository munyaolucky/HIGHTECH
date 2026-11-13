import React, { useState } from "react";
import {
  Printer,
  Download,
  Search,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Award,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  BookOpen,
  Cpu,
  FileCheck2,
  Filter,
  GraduationCap,
  CreditCard,
  Briefcase,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Check,
  QrCode,
  Stamp,
  Globe,
  Lock,
} from "lucide-react";
import {
  MASTER_FEATURE_SECTIONS,
  QUESTION_TYPES_63_COMPLETE,
  USER_ROLES_32_COMPLETE,
  IMPLEMENTATION_PHASES_22_COMPLETE,
  BUDGET_KES_400K_BREAKDOWN,
  TOTAL_PROJECT_BUDGET_KES,
  FeatureSection,
  QuestionTypeItem,
  UserRoleItem,
} from "../../data/masterFeatureCatalogue";
import { COLLEGE_INFO } from "../../data/college";
import { useSyncedPortalTab } from "../../context/PortalShellContext";

export default function MasterFeatureCataloguePortal() {
  const [activeTab, setActiveTab] = useSyncedPortalTab<
    "modules" | "questions63" | "rbac" | "phases" | "budget" | "print_view"
  >("catalogue", "modules");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState<string>("ALL");
  const [expandedSectionId, setExpandedSectionId] = useState<number | null>(1);
  const [questionCategory, setQuestionCategory] = useState<string>("ALL");
  const [roleCategory, setRoleCategory] = useState<string>("ALL");

  // Filter modules
  const filteredModules = MASTER_FEATURE_SECTIONS.filter((sec) => {
    const matchesSearch =
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.keyFeatures.some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesPart = selectedPart === "ALL" || sec.part.includes(selectedPart);
    return matchesSearch && matchesPart;
  });

  // Filter 63 question types
  const filteredQuestions = QUESTION_TYPES_63_COMPLETE.filter((q) => {
    const matchesSearch =
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      questionCategory === "ALL" || q.category === questionCategory;
    return matchesSearch && matchesCat;
  });

  // Filter 32 roles
  const filteredRoles = USER_ROLES_32_COMPLETE.filter((r) => {
    const matchesSearch =
      r.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mainResponsibilities.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = roleCategory === "ALL" || r.category === roleCategory;
    return matchesSearch && matchesCat;
  });

  const handlePrint = () => {
    window.print();
  };

  const partsList = [
    { id: "ALL", label: "All 47 Modules" },
    { id: "Part A", label: "Part A: Foundation" },
    { id: "Part B", label: "Part B: Governance" },
    { id: "Part C", label: "Part C: Admissions & SIS" },
    { id: "Part D", label: "Part D: Academic & LMS" },
    { id: "Part E", label: "Part E: Exams & CBT" },
    { id: "Part F", label: "Part F: Finance" },
    { id: "Part G", label: "Part G: HR & Payroll" },
    { id: "Part H", label: "Part H: Welfare & Portals" },
    { id: "Part I", label: "Part I: Library" },
    { id: "Part J", label: "Part J: CBET & Quality" },
    { id: "Part K", label: "Part K: Communications" },
    { id: "Part L", label: "Part L: Operations & ICT" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* HEADER & EXECUTIVE INSTITUTIONAL BANNER (Hidden on print if in interactive mode, customized in print-view) */}
      <div className="bg-gradient-to-r from-[#0d274c] via-[#153B70] to-[#1c4b8e] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/40 no-print">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-[#092c60] shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[#092c60]" />
              <span>OFFICIAL INSTITUTIONAL MASTER BLUEPRINT · REF: HCA/SPEC/2026/DOC-001</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              HI-TECH COLLEGE – COMPLETE INTEGRATED DIGITAL COLLEGE MANAGEMENT SYSTEM
            </h1>

            <p className="text-sm sm:text-base text-blue-100 font-medium leading-relaxed">
              Master Feature Catalogue covering Website + Admin Portal + Student Portal + Staff Portal + Mobile App.
              Complete 47 functional sections, 63 CBT assessment formats, 32 RBAC roles, 22 implementation phases, and fixed KES 400,000 project valuation.
            </p>

            {/* Regulatory & Exclusion Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-white/10 text-white font-semibold flex items-center gap-1.5 border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                TVETA Accredited: {COLLEGE_INFO.registrationNumber}
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-200 font-semibold flex items-center gap-1.5 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Atomic Reg No Engine: HCA/&lt;TYPE&gt;/2026/001
              </span>
              <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-200 font-semibold flex items-center gap-1.5 border border-red-400/30">
                <AlertCircle className="w-3.5 h-3.5 text-red-300" />
                Mandate Compliance: 100% Transport Excluded
              </span>
            </div>
          </div>

          {/* Action Hub & Print to PDF */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 bg-[#d92332] hover:bg-[#b81d2a] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Printer className="w-4 h-4" />
              <span>Convert to PDF / Print</span>
            </button>

            <button
              onClick={() => setActiveTab("print_view")}
              className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 px-5 py-2.5 rounded-xl font-bold text-xs shadow transition"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Official Document Preview</span>
            </button>

            <div className="text-center text-[11px] text-blue-200 font-medium">
              Fixed Enterprise Value: <span className="text-amber-300 font-black">KES 400,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC HIGHLIGHT TILES (No-Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Functional Modules</p>
          <p className="text-2xl font-black text-[#153B70] mt-1">47</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Parts A through U</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">CBT Question Formats</p>
          <p className="text-2xl font-black text-[#d92332] mt-1">63</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Objective + Lab Sandbox</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">RBAC User Roles</p>
          <p className="text-2xl font-black text-blue-700 mt-1">32</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Hierarchical Access</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Implementation Phases</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">22</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Structured Sprints</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Valuation</p>
          <p className="text-2xl font-black text-amber-600 mt-1">KES 400K</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fixed Enterprise Scope</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transport Module</p>
          <p className="text-2xl font-black text-slate-400 mt-1">0%</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Strictly Excluded</p>
        </div>
      </div>

      {/* TABS NAVIGATION (No-Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("modules")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "modules"
                ? "bg-[#153B70] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All 47 Modules ({MASTER_FEATURE_SECTIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("questions63")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "questions63"
                ? "bg-[#153B70] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>63 CBT Question Types</span>
          </button>

          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "rbac"
                ? "bg-[#153B70] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>32 RBAC Roles Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("phases")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "phases"
                ? "bg-[#153B70] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>22 Execution Phases</span>
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "budget"
                ? "bg-[#153B70] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>KES 400K Valuation</span>
          </button>

          <button
            onClick={() => setActiveTab("print_view")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "print_view"
                ? "bg-[#d92332] text-white shadow-sm"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Official Print / PDF View</span>
          </button>
        </div>

        {/* Global Search Bar */}
        {activeTab !== "print_view" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search features, codes, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ALL 47 FUNCTIONAL MODULES */}
      {/* ======================================================== */}
      {activeTab === "modules" && (
        <div className="space-y-6 no-print">
          {/* Part Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-500 px-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Category Filter:</span>
            </span>
            {partsList.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPart(p.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedPart === p.id
                    ? "bg-[#153B70] text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              Showing {filteredModules.length} of {MASTER_FEATURE_SECTIONS.length} modules
            </span>
            <span>
              Exclusion Status: <strong className="text-emerald-700">Transport 0% (Strictly Excluded)</strong>
            </span>
          </div>

          {/* Modules List Cards */}
          <div className="space-y-3">
            {filteredModules.map((module) => {
              const isExpanded = expandedSectionId === module.id;
              return (
                <div
                  key={module.id}
                  className={`bg-white rounded-xl border transition shadow-sm overflow-hidden ${
                    isExpanded
                      ? "border-[#153B70] ring-1 ring-blue-900/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Card Collapsible Header */}
                  <div
                    onClick={() =>
                      setExpandedSectionId(isExpanded ? null : module.id)
                    }
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#153B70] flex items-center justify-center font-black text-xs shrink-0 border border-blue-100">
                        {module.code}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#153B70]">
                            {module.part}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {module.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>{module.status}</span>
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-[#153B70] mt-1">
                          {module.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                          {module.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[#153B70]" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      {/* Operational Scope */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Operational Institutional Scope
                        </p>
                        <p className="text-xs text-slate-800 font-medium mt-1">
                          {module.operationalScope}
                        </p>
                      </div>

                      {/* Key Features Grid */}
                      <div>
                        <h4 className="text-xs font-extrabold text-[#153B70] uppercase tracking-wider mb-2">
                          Core Functional Capabilities &amp; Specifications
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {module.keyFeatures.map((feat, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-xs text-slate-700 leading-snug">
                                {feat}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Deliverables & Compliance */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Technical Deliverables
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {module.deliverables.map((del, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[11px] font-semibold border border-blue-200"
                              >
                                {del}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Regulatory &amp; Compliance Standards
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {module.complianceStandards.map((std, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 text-[11px] font-semibold border border-amber-200"
                              >
                                {std}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: 63 CBT QUESTION TYPES ENGINE */}
      {/* ======================================================== */}
      {activeTab === "questions63" && (
        <div className="space-y-6 no-print">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#153B70]">
                  63 Computer-Based Testing (CBT) Question Types Registry
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Universal assessment engine built into Examination Portal (Module 23).
                  Supports automated grading, live code sandboxes, and Bloom Taxonomy cognitive levels 1 through 6.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  48 Auto-Scored
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                  15 Rubric-Marked
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  14 Sandboxes
                </span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500 px-1">Filter Type:</span>
              {[
                "ALL",
                "Objective",
                "Interactive",
                "Coding & Lab",
                "Practical & Office",
                "STEM & Math",
                "Subjective",
                "Multimedia",
                "Vocational & CBET",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setQuestionCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    questionCategory === cat
                      ? "bg-[#153B70] text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table of 63 Question Types */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#092c60] text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold"># Code</th>
                    <th className="py-3 px-4 font-bold">Question Format Name</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Grading Engine</th>
                    <th className="py-3 px-4 font-bold">Auto-Mark?</th>
                    <th className="py-3 px-4 font-bold">Live Sandbox</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-black text-[#153B70]">
                        {q.code}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {q.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {q.description}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {q.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {q.gradingMechanism}
                      </td>
                      <td className="py-3 px-4">
                        {q.autoMarkable ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <Check className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                            Rubric
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {q.sandboxSupported ? (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[11px]">
                            Supported
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 32 RBAC ROLES MATRIX */}
      {/* ======================================================== */}
      {activeTab === "rbac" && (
        <div className="space-y-6 no-print">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#153B70]">
                  32 Role-Based Access Control (RBAC) Permissions Matrix
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Hierarchical role separation ensuring zero unauthorized data leaks between students, faculty, cashiers, and registrars.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500">
                Total Roles: <strong className="text-[#153B70]">32 Defined</strong>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500 px-1">Role Group:</span>
              {[
                "ALL",
                "Executive",
                "Academic",
                "Administrative",
                "Operations",
                "Student & Public",
              ].map((grp) => (
                <button
                  key={grp}
                  onClick={() => setRoleCategory(grp)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    roleCategory === grp
                      ? "bg-[#153B70] text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                        {role.id}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {role.category}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[#153B70] mt-1">
                      {role.roleName}
                    </h4>
                  </div>

                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 text-right">
                    {role.accessLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {role.mainResponsibilities}
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">
                      Permitted Portals
                    </span>
                    <span className="font-semibold text-slate-800">
                      {role.permittedPortals.join(", ")}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">
                      Approval Authority
                    </span>
                    <span className="font-bold text-emerald-700">
                      {role.approvalThreshold}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: 22 IMPLEMENTATION PHASES & TIMELINE */}
      {/* ======================================================== */}
      {activeTab === "phases" && (
        <div className="space-y-6 no-print">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#153B70]">
                22 Structured Implementation Phases &amp; Sprints
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                From initial security foundation to final executive BI analytics and production deployment.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-bold block">
                Total Budget Allocation
              </span>
              <span className="text-lg font-black text-[#d92332]">
                KES {TOTAL_PROJECT_BUDGET_KES.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {IMPLEMENTATION_PHASES_22_COMPLETE.map((phase) => (
              <div
                key={phase.phaseNumber}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded bg-[#153B70] text-white font-black text-xs">
                      {phase.phaseNumber}
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      {phase.phaseName}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {phase.timeframe}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      {phase.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-black">
                      KES {phase.budgetAllocationKES.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2">
                  {phase.mainImplementation}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">
                    Key Milestones:
                  </span>
                  {phase.keyMilestones.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[11px] font-semibold border border-blue-200"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: KES 400,000 VALUATION & DISBURSEMENT */}
      {/* ======================================================== */}
      {activeTab === "budget" && (
        <div className="space-y-6 no-print">
          {/* Main Financial Hero */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-[#153B70] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-2xl space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900 uppercase tracking-wider">
                Approved Institutional Enterprise Contract
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">
                Total Fixed Project Valuation: KES 400,000
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 leading-relaxed font-medium">
                Comprehensive turnkey delivery of the HI-TECH College integrated digital platform.
                Covers 100% source code ownership, zero recurring software license fees, and full TVETA accreditation compliance.
              </p>
            </div>
          </div>

          {/* 4 Tranche Milestone Schedule */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-[#153B70]">
              Institutional Milestone Disbursement Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BUDGET_KES_400K_BREAKDOWN.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#153B70] uppercase tracking-wider">
                      {m.milestone}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                      {m.percentage}% · KES {m.amountKES.toLocaleString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {m.deliverableCriteria}
                  </p>

                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <strong>Trigger Event:</strong> {m.triggerEvent}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Comparison Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-[#153B70]">
              Commercial Value Comparison: Off-The-Shelf vs. HI-TECH Custom Build
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">Cost Component</th>
                    <th className="py-2.5 px-3 font-bold">Standard Commercial Off-the-Shelf ERP</th>
                    <th className="py-2.5 px-3 font-bold text-[#153B70]">HI-TECH College Turnkey Build</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Software Licensing</td>
                    <td className="py-2.5 px-3">KES 450,000 / year (per-user fee)</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">KES 0 (100% Institutionally Owned)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">CBT &amp; 63 Question Types Engine</td>
                    <td className="py-2.5 px-3">KES 300,000 separate add-on</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">Included in Base Scope</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Kenyan Statutory Payroll &amp; M-Pesa</td>
                    <td className="py-2.5 px-3">KES 250,000 customization charge</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">Included in Base Scope</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Public Website &amp; Admissions CMS</td>
                    <td className="py-2.5 px-3">KES 200,000 external agency</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">Included in Base Scope</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-3 px-3 text-slate-900">Total 3-Year Cost of Ownership</td>
                    <td className="py-3 px-3 text-red-700 line-through">KES 1,800,000+</td>
                    <td className="py-3 px-3 text-emerald-700 text-sm">KES 400,000 Total Fixed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6 & PRINT VIEW: INSTITUTIONAL PRINT-READY PDF DOCUMENT */}
      {/* ======================================================== */}
      {(activeTab === "print_view" || true) && (
        <div
          className={`${
            activeTab === "print_view" ? "block" : "hidden print:block"
          } print-container bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xl space-y-8 text-black`}
        >
          {/* Printable Action Bar (Hidden when printed on paper/PDF) */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 no-print">
            <div className="flex items-center gap-2 text-xs text-blue-900">
              <FileText className="w-5 h-5 text-[#153B70]" />
              <div>
                <p className="font-bold">Institutional PDF Print Mode Active</p>
                <p className="text-[11px] text-blue-700">
                  Clicking the button below will trigger your browser's Print dialog. Select "Save as PDF" to generate the official document.
                </p>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-[#d92332] hover:bg-[#b81d2a] text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save to PDF</span>
            </button>
          </div>

          {/* OFFICIAL INSTITUTIONAL HEADER & CREST */}
          <div className="border-b-2 border-[#153B70] pb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#092c60] text-amber-300 flex items-center justify-center font-black text-2xl shadow-sm border-2 border-amber-400">
                <GraduationCap className="w-10 h-10" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#092c60] uppercase">
                  HI-TECH COLLEGE
                </h1>
                <p className="text-xs font-bold text-[#d92332] tracking-wider uppercase">
                  Integrated Academic &amp; Central Certification Platform
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Main Campus: {COLLEGE_INFO.headquarters.address}, {COLLEGE_INFO.headquarters.city} · Tel: {COLLEGE_INFO.contacts.admissionsPhone} · Email: {COLLEGE_INFO.contacts.email}
                </p>
                <p className="text-[11px] text-slate-700 font-semibold">
                  TVETA Registration: {COLLEGE_INFO.registrationNumber} · Ministry of Education (State Dept for TVET)
                </p>
              </div>
            </div>

            {/* Document Reference Box */}
            <div className="text-right border-l-2 border-slate-200 pl-4 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Document Reference
              </div>
              <div className="text-xs font-black text-[#153B70]">
                HCA/SPEC/2026/DOC-001
              </div>
              <div className="text-[10px] text-slate-500">
                Date: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                Approved Enterprise Scope
              </div>
            </div>
          </div>

          {/* EXECUTIVE BLUEPRINT CERTIFICATION BLOCK */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#153B70] uppercase tracking-wide">
                1. Executive Summary &amp; Institutional Scope Certification
              </h2>
              <span className="text-xs font-bold text-slate-600">
                Total Valuation: <strong className="text-[#d92332]">KES 400,000</strong>
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              This document certifies the complete architectural blueprint and operational feature catalogue of the HI-TECH College Integrated Digital College Management System.
              The unified system operates from one single institutional database, delivering multi-role portals for Website + Admin Portal + Student Portal + Staff Portal + Mobile App.
              The system includes <strong>47 functional domains (Parts A through U)</strong>, <strong>63 computerized testing formats</strong>, <strong>32 granular user roles</strong>, <strong>22 implementation phases</strong>, and enforces strict compliance with TVETA and Kenya National Qualifications Authority (KNQA) regulations.
              Per institutional requirements, <strong>Transport Management is strictly 0% and excluded</strong> from the scope.
            </p>
          </div>

          {/* 47 MODULES SUMMARY TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#153B70] uppercase tracking-wide">
                2. Master Feature Catalogue: All 47 Functional Modules (Parts A–L)
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                47 Modules Complete · 0% Transport
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-[#092c60] text-white">
                <tr>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-16">Code</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-48">Part &amp; Domain</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold">Module Title &amp; Technical Capabilities</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-800">
                {MASTER_FEATURE_SECTIONS.map((sec) => (
                  <tr key={sec.id} className="page-break-inside-avoid">
                    <td className="py-2 px-3 border border-slate-300 font-black text-[#153B70]">
                      {sec.code}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-[11px] font-semibold text-slate-600">
                      {sec.part}
                    </td>
                    <td className="py-2 px-3 border border-slate-300">
                      <strong className="text-slate-900 block">{sec.title}</strong>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        {sec.description}
                      </span>
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-[11px] font-bold text-emerald-800">
                      ✓ {sec.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 63 QUESTION TYPES SUMMARY (PAGE BREAK) */}
          <div className="page-break-before space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#153B70] uppercase tracking-wide">
                3. Examination &amp; CBT Assessment Engine: 63 Question Formats
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                Module 23 Standardized Registry
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-[#092c60] text-white">
                <tr>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-16">#</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-60">Question Type Name</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-32">Category</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold">Grading Mechanism</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-20">Auto?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-800">
                {QUESTION_TYPES_63_COMPLETE.map((q) => (
                  <tr key={q.id} className="page-break-inside-avoid">
                    <td className="py-1.5 px-3 border border-slate-300 font-black text-[#153B70]">
                      {q.code}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-bold text-slate-900">
                      {q.name}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 text-[11px]">
                      {q.category}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 text-[11px] text-slate-600">
                      {q.gradingMechanism}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 text-[11px] font-bold text-center">
                      {q.autoMarkable ? "Yes" : "Rubric"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 32 ROLES & RBAC MATRIX */}
          <div className="page-break-before space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#153B70] uppercase tracking-wide">
                4. Role-Based Access Control (RBAC): 32 Institutional Roles
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                Security &amp; Segregation of Duties
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-[#092c60] text-white">
                <tr>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-16">Role ID</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-52">Role Name &amp; Category</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold">Main Responsibilities</th>
                  <th className="py-2 px-3 border border-slate-300 font-bold w-40">Approval Authority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-800">
                {USER_ROLES_32_COMPLETE.map((r) => (
                  <tr key={r.id} className="page-break-inside-avoid">
                    <td className="py-1.5 px-3 border border-slate-300 font-black text-[#153B70]">
                      {r.id}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300">
                      <strong className="text-slate-900 block">{r.roleName}</strong>
                      <span className="text-[10px] text-slate-500 block">
                        {r.category} · {r.accessLevel}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 text-[11px] text-slate-700">
                      {r.mainResponsibilities}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 text-[11px] font-bold text-emerald-800">
                      {r.approvalThreshold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 22 IMPLEMENTATION PHASES & KES 400,000 DISBURSEMENT */}
          <div className="page-break-before space-y-4">
            <h2 className="text-sm font-black text-[#153B70] uppercase tracking-wide">
              5. Project Budget Breakdown &amp; 4-Tranche Disbursement (KES 400,000)
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {BUDGET_KES_400K_BREAKDOWN.map((b, idx) => (
                <div key={idx} className="p-3 border border-slate-300 rounded bg-slate-50">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{b.milestone}</span>
                    <span className="text-[#d92332]">KES {b.amountKES.toLocaleString()} ({b.percentage}%)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-1">{b.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{b.deliverableCriteria}</p>
                </div>
              ))}
            </div>

            {/* INSTITUTIONAL SIGN-OFF & OFFICIAL SEAL BLOCK */}
            <div className="pt-6 border-t-2 border-slate-300 page-break-inside-avoid">
              <h3 className="text-xs font-black text-[#092c60] uppercase tracking-wide mb-4">
                6. Institutional Approval, Executive Sign-Off &amp; Official Seal
              </h3>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="border border-slate-300 p-3 rounded bg-white">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-slate-800 text-xs">Eng. P. M. Ndung'u</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-900">Chairman, Board of Governors</p>
                  <p className="text-[10px] text-slate-500">HI-TECH College</p>
                </div>

                <div className="border border-slate-300 p-3 rounded bg-white">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-slate-800 text-xs">Dr. E. K. Chemweno</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-900">College Principal / CEO</p>
                  <p className="text-[10px] text-slate-500">HI-TECH College</p>
                </div>

                <div className="border border-slate-300 p-3 rounded bg-white">
                  <div className="h-10 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                    <span className="font-serif italic text-slate-800 text-xs">Prof. H. A. Mutua</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-900">Chief Information Officer</p>
                  <p className="text-[10px] text-slate-500">ICT Directorate</p>
                </div>

                <div className="border border-slate-300 p-3 rounded bg-white relative">
                  <div className="w-12 h-12 mx-auto rounded-full border-2 border-dashed border-[#d92332] text-[#d92332] flex items-center justify-center text-[9px] font-black uppercase rotate-[-12deg] mb-1">
                    OFFICIAL SEAL
                  </div>
                  <p className="text-[11px] font-bold text-[#d92332]">Institutional Seal</p>
                  <p className="text-[9px] text-slate-500">Verified &amp; Certified</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-4">
                © {new Date().getFullYear()} HI-TECH College. All Rights Reserved. Regulated under TVET Act No. 29 of 2013, Republic of Kenya.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

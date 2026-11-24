import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Globe,
  FileCheck2,
  Headphones,
  ShieldCheck,
  Hash,
  UserCheck,
  Building2,
  CreditCard,
  BookOpen,
  Users,
  BedDouble,
  Briefcase,
  Vote,
  Bell,
  BarChart3,
  LifeBuoy,
  QrCode,
  Search,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { PortalRole } from '../types';

export interface PortalItemDefinition {
  id: PortalRole;
  label: string;
  badge: string;
  category: 'public' | 'academics' | 'admissions_registry' | 'finance_hr' | 'operations' | 'ai_services';
  categoryLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  keywords: string;
  gradientClass: string;
}

export const ALL_PORTALS_REGISTRY: PortalItemDefinition[] = [
  {
    id: 'website',
    label: 'Public Website',
    badge: 'Campus Life & Info',
    category: 'public',
    categoryLabel: 'Public & General',
    icon: Globe,
    description: 'Official College Website, Course Catalogue, Admissions, News & Public Enquiries',
    keywords: 'public website homepage courses prospectus about apply contact',
    gradientClass: 'from-blue-600 to-indigo-700 text-white',
  },
  {
    id: 'catalogue',
    label: 'Master Feature Blueprint',
    badge: '47 Modules & PDF',
    category: 'public',
    categoryLabel: 'Public & General',
    icon: FileCheck2,
    description: 'Complete 47-Module Blueprint, 63 CBT Questions Registry, RBAC Security Matrix & PDF Export',
    keywords: 'catalogue blueprint specification 47 modules rbac questions pdf roadmap',
    gradientClass: 'from-amber-500 to-amber-700 text-white',
  },
  {
    id: 'student',
    label: 'Student Portal',
    badge: 'HCA/STU/...',
    category: 'academics',
    categoryLabel: 'Academic & Learning',
    icon: GraduationCap,
    description: 'Personalized Student Dashboard, Course Registration, Timetable, CBT Exams & Fee Statement',
    keywords: 'student dashboard timetable units fee balance grades profile results',
    gradientClass: 'from-blue-700 to-cyan-700 text-white',
  },
  {
    id: 'lecturer',
    label: 'Lecturer / Trainer Portal',
    badge: 'Module 18 Faculty',
    category: 'academics',
    categoryLabel: 'Academic & Learning',
    icon: UserCheck,
    description: 'Faculty Teaching Roster, Lesson Plans, Schemes of Work, Class Attendance & Question Authoring',
    keywords: 'lecturer faculty teacher trainer attendance roster lessons schemes marking',
    gradientClass: 'from-emerald-600 to-teal-800 text-white',
  },
  {
    id: 'examination',
    label: 'Examinations & CBT Engine',
    badge: 'Module 23 Engine',
    category: 'academics',
    categoryLabel: 'Academic & Learning',
    icon: FileCheck2,
    description: '63 Question Formats Registry, Timed CBT Exam Runner, Seating Permits & Senate Moderation',
    keywords: 'examination cbt test questions runner marking anonymous seating permits',
    gradientClass: 'from-purple-600 to-indigo-800 text-white',
  },
  {
    id: 'library',
    label: 'Central Library Management',
    badge: 'Module 22 Library',
    category: 'academics',
    categoryLabel: 'Academic & Learning',
    icon: BookOpen,
    description: 'Physical Dewey Inventory, Barcode Circulation Loans, Holds & Digital E-Books Repository',
    keywords: 'library books borrowing loans circulation dewey ebooks pdf catalog',
    gradientClass: 'from-teal-600 to-emerald-800 text-white',
  },
  {
    id: 'admissions',
    label: 'Admissions & Enrolment',
    badge: 'Module 24 Pipeline',
    category: 'admissions_registry',
    categoryLabel: 'Admissions & Registry',
    icon: Users,
    description: 'Applicant Review Pipeline, Walk-in Application Intake, Offer Letters & Instant Student Conversion',
    keywords: 'admissions applications applicants offer letter enrolment intake convert',
    gradientClass: 'from-blue-600 to-sky-700 text-white',
  },
  {
    id: 'registrar',
    label: 'Academic Registrar Portal',
    badge: 'Module 19 Records',
    category: 'admissions_registry',
    categoryLabel: 'Admissions & Registry',
    icon: Building2,
    description: 'Nominal Student Roll, Unit Add/Drop Approvals, Official Transcripts (TRX) & Graduation Certificates',
    keywords: 'registrar transcripts trx certificates graduation deferments approval records',
    gradientClass: 'from-slate-700 to-slate-900 text-white',
  },
  {
    id: 'generator',
    label: 'Central Reg Generator',
    badge: 'HCA/<TYPE>/<YEAR>/<SEQ>',
    category: 'admissions_registry',
    categoryLabel: 'Admissions & Registry',
    icon: Hash,
    description: 'Atomic Generator for STU, STAFF, LECT, CERT, LIB & 11 Types with Collision-Free Sequence Engine',
    keywords: 'generator registration number sequence atomic hca staff stu lect cert lib',
    gradientClass: 'from-amber-600 to-orange-700 text-white',
  },
  {
    id: 'finance',
    label: 'Finance & Cash Office',
    badge: 'Module 20 Treasury',
    category: 'finance_hr',
    categoryLabel: 'Finance & HR Operations',
    icon: CreditCard,
    description: 'Fee Billing Structures, Lipa na M-Pesa STK Simulator & Immutable Official Receipts Ledger',
    keywords: 'finance fees payments mpesa stk receipts ledger bursar reconciliation',
    gradientClass: 'from-emerald-700 to-teal-900 text-white',
  },
  {
    id: 'hr',
    label: 'HR & Staff People Operations',
    badge: 'Module 25 People',
    category: 'finance_hr',
    categoryLabel: 'Finance & HR Operations',
    icon: Briefcase,
    description: 'Staff Directory, Independent Contracts Review, Leave Approvals & Faculty Contact Workloads',
    keywords: 'hr human resources staff contracts leave attendance payroll workload',
    gradientClass: 'from-blue-800 to-indigo-950 text-white',
  },
  {
    id: 'staff-users',
    label: 'Staff User Management',
    badge: 'Admin & RBAC',
    category: 'finance_hr',
    categoryLabel: 'Finance & HR Operations',
    icon: KeyRound,
    description: 'Platform User Accounts, Security Roles, Granular Permission Matrices & Activation Invitations',
    keywords: 'users accounts roles permissions rbac admin security invite audit',
    gradientClass: 'from-indigo-700 to-slate-900 text-white',
  },
  {
    id: 'hostels',
    label: 'Hostels & Student Welfare',
    badge: 'Campus Operations',
    category: 'operations',
    categoryLabel: 'Campus Operations & Student Life',
    icon: BedDouble,
    description: 'Residence Inventory, Room & Bed Allocations, Damage Billing & Confidential Welfare Counselling',
    keywords: 'hostels residence rooms beds accommodation welfare counselling maintenance',
    gradientClass: 'from-cyan-700 to-blue-900 text-white',
  },
  {
    id: 'community',
    label: 'SRC Elections & Community',
    badge: 'Secret Ballot',
    category: 'operations',
    categoryLabel: 'Campus Operations & Student Life',
    icon: Vote,
    description: 'Secret-Ballot SRC Voting with Cryptographic Receipts, Campus Clubs, Events & Alumni Directory',
    keywords: 'elections voting src ballot clubs societies events volunteering alumni',
    gradientClass: 'from-rose-600 to-red-800 text-white',
  },
  {
    id: 'engagement',
    label: 'Notices, Guardians & Careers',
    badge: 'Stakeholder Hub',
    category: 'operations',
    categoryLabel: 'Campus Operations & Student Life',
    icon: Bell,
    description: 'Institutional Notification Outbox, DPA 2019 Revocable Parent Portal & Industry Attachment Placements',
    keywords: 'notices announcements guardian parent consent careers internships attachment',
    gradientClass: 'from-amber-600 to-amber-900 text-white',
  },
  {
    id: 'campus-services',
    label: 'Credentials, CRM & Services',
    badge: 'Campus Suite',
    category: 'operations',
    categoryLabel: 'Campus Operations & Student Life',
    icon: QrCode,
    description: 'QR Credential Verification, Admissions CRM Pipeline Funnel, Appointments & TVETA Compliance',
    keywords: 'credentials qr verify crm appointments visitor compliance accreditation',
    gradientClass: 'from-indigo-800 to-blue-950 text-white',
  },
  {
    id: 'quality-reports',
    label: 'Docs, TVETA Quality & Reports',
    badge: 'TVETA / CSV Export',
    category: 'operations',
    categoryLabel: 'Campus Operations & Student Life',
    icon: BarChart3,
    description: 'Institutional Document Vault, TVETA Self-Audit Compliance & Multi-Currency CSV Analytics Exports',
    keywords: 'quality accreditation tveta reports audit documents vault csv export',
    gradientClass: 'from-emerald-800 to-slate-900 text-white',
  },
  {
    id: 'chatbot-admin',
    label: 'Chatbot & AI Service Desk',
    badge: 'Modules 36-39',
    category: 'ai_services',
    categoryLabel: 'AI Intelligence & Support',
    icon: Headphones,
    description: 'Grounded Knowledge Base Articles, Support Escalation Queue, Service Analytics & Controlled RAG Desk',
    keywords: 'chatbot ai rag knowledge base escalations tickets support analytics',
    gradientClass: 'from-blue-600 to-indigo-800 text-white',
  },
  {
    id: 'ai-governance',
    label: 'AI Governance Centre',
    badge: 'Modules 40-42',
    category: 'ai_services',
    categoryLabel: 'AI Intelligence & Support',
    icon: ShieldCheck,
    description: 'Model Quotas, Token Budgeting, Prompt Rollback, Async Indexing Queue & Compliance Audit Logs',
    keywords: 'ai governance quotas token budget prompts rollback indexing audit security',
    gradientClass: 'from-purple-700 to-slate-900 text-white',
  },
  {
    id: 'ai-support',
    label: 'AI Support & Help Centre',
    badge: 'Module 43 Support',
    category: 'ai_services',
    categoryLabel: 'AI Intelligence & Support',
    icon: LifeBuoy,
    description: '7-Role Specialized AI Assistants, Automatic PII Masking, Human Fallback & Help Desk Tickets',
    keywords: 'support helpdesk ai assistant ticket role student lecturer pii masking',
    gradientClass: 'from-red-600 to-rose-800 text-white',
  },
];

interface GlobalPortalSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: PortalRole;
  onSelectRole: (role: PortalRole) => void;
}

export default function GlobalPortalSwitcherModal({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
}: GlobalPortalSwitcherModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const categories = [
    { id: 'all', label: 'All Portals (20)' },
    { id: 'public', label: 'Public & General' },
    { id: 'academics', label: 'Academics & CBT' },
    { id: 'admissions_registry', label: 'Admissions & Registry' },
    { id: 'finance_hr', label: 'Finance & HR' },
    { id: 'operations', label: 'Operations & Welfare' },
    { id: 'ai_services', label: 'AI & Intelligence' },
  ];

  const filteredPortals = useMemo(() => {
    return ALL_PORTALS_REGISTRY.filter((portal) => {
      const matchesCategory =
        selectedCategory === 'all' || portal.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        portal.label.toLowerCase().includes(term) ||
        portal.badge.toLowerCase().includes(term) ||
        portal.description.toLowerCase().includes(term) ||
        portal.keywords.toLowerCase().includes(term)
      );
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  const handleSelect = (role: PortalRole) => {
    onSelectRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#061d40] via-[#092c60] to-[#0c3a7a] text-white p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-[#092c60] flex items-center justify-center font-black shadow-md shrink-0">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Institutional Portal Hub
                </h2>
                <span className="bg-amber-400 text-[#092c60] text-[10px] font-black px-2 py-0.5 rounded-full">
                  20 Workspaces
                </span>
              </div>
              <p className="text-xs text-blue-200">
                HI-TECH College Integrated Academic, Enterprise ERP &amp; AI Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close portal switcher"
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Close Switcher (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY BAR */}
        <div className="p-4 bg-[#f8fafc] border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workspaces by name, keyword, module number or capability (e.g., M-Pesa, Transcripts, CBT, Library)..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0866d7] focus:ring-2 focus:ring-blue-100 shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#092c60] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* PORTAL CARDS GRID */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredPortals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Search size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No portals match &ldquo;{search}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-[#0866d7] font-bold hover:underline"
              >
                Clear search filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPortals.map((portal) => {
                const Icon = portal.icon;
                const isActive = currentRole === portal.id;
                return (
                  <button
                    key={portal.id}
                    type="button"
                    onClick={() => handleSelect(portal.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between group relative ${
                      isActive
                        ? 'bg-[#eef4fd] border-[#0866d7] shadow-sm ring-2 ring-blue-200'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${portal.gradientClass} flex items-center justify-center shrink-0 shadow-sm`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {portal.badge}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 size={10} /> Active
                            </span>
                          )}
                        </div>
                      </div>

                      <strong className="text-sm font-bold text-slate-900 group-hover:text-[#0866d7] block transition-colors leading-tight">
                        {portal.label}
                      </strong>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {portal.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-[#0866d7]">
                      <span className="text-[11px] font-medium text-slate-400">
                        {portal.categoryLabel}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Open Workspace <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* QUICK PERSONA SWITCHER FOOTER */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-semibold">
            <Sparkles size={15} className="text-amber-500" />
            <span>Quick Persona Jump:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelect('student')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-400 text-[#092c60] font-bold text-[11px] transition shadow-xs"
            >
              👩‍🎓 Student: Amina
            </button>
            <button
              type="button"
              onClick={() => handleSelect('lecturer')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-400 text-slate-800 font-bold text-[11px] transition shadow-xs"
            >
              👨‍🏫 Lecturer: Dr. Otieno
            </button>
            <button
              type="button"
              onClick={() => handleSelect('registrar')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-purple-400 text-slate-800 font-bold text-[11px] transition shadow-xs"
            >
              🏛️ Registrar: Dr. Kiprop
            </button>
            <button
              type="button"
              onClick={() => handleSelect('finance')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-teal-400 text-slate-800 font-bold text-[11px] transition shadow-xs"
            >
              💳 Finance: CPA Beatrice
            </button>
            <button
              type="button"
              onClick={() => handleSelect('staff-users')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-indigo-400 text-slate-800 font-bold text-[11px] transition shadow-xs"
            >
              🛡️ Super Admin: Systems Lead
            </button>
            <button
              type="button"
              onClick={() => handleSelect('website')}
              className="px-2.5 py-1 rounded-md bg-[#092c60] hover:bg-[#061d40] text-white font-bold text-[11px] transition shadow-xs"
            >
              🌐 Public Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

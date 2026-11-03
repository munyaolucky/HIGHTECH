import React from "react";
import {
  GraduationCap,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Lock,
  ArrowRight,
  BookOpen,
  Award,
  Globe,
  Clock,
} from "lucide-react";
import { COLLEGE_INFO } from "../../data/college";

interface WebsiteFooterProps {
  onNavigate: (page: string) => void;
  onOpenPortalModal: () => void;
  onSwitchToERP: (role: string) => void;
}

export default function WebsiteFooter({
  onNavigate,
  onOpenPortalModal,
  onSwitchToERP,
}: WebsiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b1d38] text-white border-t-4 border-[#d92332]">
      {/* Top Accreditation & Trust Ribbon */}
      <div className="bg-[#071426] py-4 px-4 sm:px-6 border-b border-blue-950/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Government Accreditations:</span>
            <span>TVETA / CDACC / KNEC / KASNEB / NITA Registered</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Official Reg: <strong className="text-white">{COLLEGE_INFO.registrationNumber}</strong></span>
            <span>•</span>
            <span>Exam Centre Code: <strong className="text-white">KNEC 2040182</strong></span>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Column 1: College Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="font-black text-xl text-white tracking-tight">HI-TECH</span>{" "}
              <span className="font-bold text-xl text-[#d92332] tracking-tight">COLLEGE</span>
              <p className="text-xs text-slate-400">{COLLEGE_INFO.motto}</p>
            </div>
          </div>

          <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
            {COLLEGE_INFO.tagline}. Providing government-accredited diploma and certificate programmes in Computing, Artificial Intelligence, Business Management, and Engineering with high-fidelity digital campus infrastructure.
          </p>

          <div className="space-y-2 text-xs text-slate-300 pt-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{COLLEGE_INFO.headquarters.address}, {COLLEGE_INFO.headquarters.city}, Kenya</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-red-400 shrink-0" />
              <span>{COLLEGE_INFO.contacts.mainPhone} / {COLLEGE_INFO.contacts.admissionsPhone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-red-400 shrink-0" />
              <span>{COLLEGE_INFO.contacts.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mon - Fri: 7:30 AM - 6:00 PM | Sat: 8:00 AM - 2:00 PM</span>
            </div>
          </div>
        </div>

        {/* Column 2: Academic Programmes */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-blue-900/60 pb-2">
            Top Programmes
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <button
                onClick={() => onNavigate("academics")}
                className="hover:text-amber-400 transition text-left"
              >
                Diploma in ICT (DICT Level 6)
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("academics")}
                className="hover:text-amber-400 transition text-left"
              >
                Certificate in ICT (CICT Level 5)
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("academics")}
                className="hover:text-amber-400 transition text-left"
              >
                AI & Machine Learning Diploma
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("academics")}
                className="hover:text-amber-400 transition text-left"
              >
                Diploma in Business Management
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("academics")}
                className="hover:text-amber-400 transition text-left"
              >
                KASNEB Accounting & CPA
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("academics")}
                className="hover:text-amber-400 transition text-left"
              >
                Cyber Security & Digital Forensics
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("academics")}
                className="hover:text-amber-400 transition text-left"
              >
                Computer Packages & Digital Literacy
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Quick Navigation */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-blue-900/60 pb-2">
            Quick Links
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <button onClick={() => onNavigate("about")} className="hover:text-white transition">
                About HI-TECH College
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("admissions")} className="hover:text-white transition">
                Admissions & Requirements
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("apply")} className="hover:text-white transition">
                Apply Online (2026 Intake)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("resources")} className="hover:text-white transition">
                Download Prospectus & Fees
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("campus-life")} className="hover:text-white transition">
                Hostels & Student Services
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("news")} className="hover:text-white transition">
                Campus News & Events
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("contact")} className="hover:text-white transition">
                Campuses & Directions
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Institutional Portals (Answers 'How can student get portal') */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-blue-900/60 pb-2">
            Student & Staff Portals
          </h4>
          <div className="space-y-2.5">
            <button
              onClick={onOpenPortalModal}
              className="w-full text-left bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-2.5 rounded-lg text-xs font-bold flex items-center justify-between shadow-sm transition"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Student Portal Login</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate("portal-guide")}
              className="w-full text-left bg-blue-900/40 hover:bg-blue-900/70 text-blue-200 border border-blue-800/60 p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition"
            >
              <span>How to Access Portal Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="pt-2 border-t border-blue-950/80 space-y-1.5 text-xs text-slate-300">
              <button
                onClick={() => onSwitchToERP("lecturer")}
                className="w-full text-left hover:text-white transition flex items-center gap-1.5"
              >
                <span>• Lecturer / Trainer Portal</span>
              </button>
              <button
                onClick={() => onSwitchToERP("registrar")}
                className="w-full text-left hover:text-white transition flex items-center gap-1.5"
              >
                <span>• Registrar & Transcripts</span>
              </button>
              <button
                onClick={() => onSwitchToERP("finance")}
                className="w-full text-left hover:text-white transition flex items-center gap-1.5"
              >
                <span>• Finance & M-Pesa Receipts</span>
              </button>
              <button
                onClick={() => onSwitchToERP("catalogue")}
                className="w-full text-left text-amber-300 hover:text-white transition flex items-center gap-1.5 font-bold"
              >
                <span>★ Master Feature Blueprint (PDF)</span>
              </button>
              <button
                onClick={() => onSwitchToERP("chatbot-admin")}
                className="w-full text-left text-blue-300 hover:text-white transition flex items-center gap-1.5 font-semibold"
              >
                <span>• Chatbot &amp; AI Service Desk (Mod 36-39)</span>
              </button>
              <button
                onClick={() => onSwitchToERP("generator")}
                className="w-full text-left hover:text-white transition flex items-center gap-1.5"
              >
                <span>• Reg Number Generator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-950 bg-[#050e1c] py-4 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            © {currentYear} {COLLEGE_INFO.name}. All Rights Reserved. Reg No: {COLLEGE_INFO.registrationNumber}.
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Admission</span>
            <span>•</span>
            <span>Student Code</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

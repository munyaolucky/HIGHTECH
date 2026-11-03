import React from "react";
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Users,
  Target,
  Eye,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { COLLEGE_INFO } from "../../data/college";

interface AboutProps {
  onNavigate: (page: string) => void;
  onOpenPortalModal: () => void;
}

export default function About({ onNavigate, onOpenPortalModal }: AboutProps) {
  const leadershipTeam = [
    {
      name: "Eng. Dr. Kenneth Mwangi, PhD",
      role: "College Principal & Chief Executive Officer",
      qualifications: "PhD Computer Systems Engineering, MSc Software Engineering, B.Ed Tech (Hons)",
      bio: "Over 20 years leading technical tertiary education in East Africa, championing national TVET competency curriculum frameworks."
    },
    {
      name: "Dr. Grace Nyambura, EdD",
      role: "Deputy Principal - Academic & Student Affairs",
      qualifications: "EdD Curriculum Development, MSc Information Science, B.Sc Computing",
      bio: "Pioneered the integration of TVET CDACC assessment rubrics and digital examination workflows."
    },
    {
      name: "CPA Patrick Kiprono",
      role: "Registrar of Academic Operations",
      qualifications: "CPA(K), MBA Strategic Management, B.Com Accounting",
      bio: "Oversees central student registration, automated transcripts, official graduation clearance, and examination security."
    },
    {
      name: "Eng. Samuel Oduor",
      role: "Dean, School of Computing & Informatics",
      qualifications: "MSc Cybersecurity, B.Sc Electrical & Electronics, Cisco Certified CCAI",
      bio: "Directs 38+ computer laboratories, cloud infrastructure, and enterprise AI engineering tracks."
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Page Header */}
      <div className="bg-[#0f274a] text-white py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/60 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Established 2012 • TVETA Registered TVETA/PUBLIC/0291/2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            About HI-TECH College of Technology & Applied Sciences
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            A premier Kenyan technical institution committed to nurturing competent, ethical, and innovation-driven professionals equipped for the digital economy.
          </p>
        </div>
      </div>

      {/* Mission, Vision & Core Values */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Our Vision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To be the leading centre of excellence in practical technology, applied sciences, and entrepreneurial TVET training in Africa.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To empower students with industry-relevant technical competencies, ethical leadership, and creative innovation through world-class practical learning facilities.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Core Values</h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Excellence & Academic Rigour</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Innovation & Hands-On Problem Solving</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Integrity & Professional Ethics</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Inclusivity & Student Success</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Official Accreditations */}
      <div className="bg-slate-100 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">Accreditations & Examination Bodies</h2>
            <p className="text-xs text-slate-600 mt-1">
              All academic programmes conform to national statutory frameworks and examination boards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <span className="font-extrabold text-blue-900 text-sm">TVETA KENYA</span>
              <p className="text-[11px] text-slate-600">
                Registered under the TVET Act No. 29 of 2013 (Reg No: TVETA/ACC/0482/2026).
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <span className="font-extrabold text-blue-900 text-sm">TVET CDACC</span>
              <p className="text-[11px] text-slate-600">
                Approved Competency-Based Assessment & Certification Centre for ICT Level 5 & 6.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <span className="font-extrabold text-blue-900 text-sm">KNEC</span>
              <p className="text-[11px] text-slate-600">
                National Examination Centre (Code 2040182) for Business and Technical Diplomas.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
              <span className="font-extrabold text-blue-900 text-sm">KASNEB</span>
              <p className="text-[11px] text-slate-600">
                Accredited Tuition and Computer-Based Examination Centre for CPA and ATD.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* College Leadership */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
            Academic Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Executive Leadership & Faculty Heads
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leadershipTeam.map((leader, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 text-[#153b70] flex items-center justify-center font-bold text-sm">
                  {leader.name.split(" ")[1]?.[0] || "H"}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{leader.name}</h4>
                  <div className="text-xs font-semibold text-blue-700">{leader.role}</div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500">{leader.qualifications}</div>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">{leader.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Locations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
            Physical Presence
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Our Campuses Across Kenya
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLLEGE_INFO.campuses.map((campus, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded">
                {campus.type}
              </span>
              <h3 className="font-bold text-sm text-slate-900">{campus.name}</h3>
              <p className="text-xs text-slate-600">{campus.address}</p>
              <div className="text-[11px] text-slate-500 pt-1 font-mono">{campus.phone}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

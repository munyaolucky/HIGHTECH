import React, { useState } from "react";
import {
  GraduationCap,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  KeyRound,
  FileCheck2,
  Calendar,
  CreditCard,
  BookOpen,
  HelpCircle,
  Hash,
  ExternalLink,
} from "lucide-react";

interface StudentPortalGuideProps {
  onLaunchStudentDashboard: () => void;
  onNavigateToApply: () => void;
  onOpenPortalModal: () => void;
  onSwitchToERP: (role: string) => void;
}

export default function StudentPortalGuide({
  onLaunchStudentDashboard,
  onNavigateToApply,
  onOpenPortalModal,
  onSwitchToERP,
}: StudentPortalGuideProps) {
  const [testRegNo, setTestRegNo] = useState("HCA/STU/2026/001");
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (testRegNo.toUpperCase().includes("STU")) {
      setLookupResult(
        `Active Student Record Found: Amina Wanjiku • Programme: BSc. Computer Science • Status: ACTIVE • Portal Enabled`
      );
    } else {
      setLookupResult(
        `Registration Number format verified: Valid HI-TECH format (HCA/<TYPE>/<YEAR>/<SEQ>). Ready for authentication.`
      );
    }
  };

  const portalSteps = [
    {
      step: 1,
      title: "Apply Online or at Admissions Office",
      description:
        "Prospective students apply through the website's Apply Online page or directly at any HI-TECH College campus. You submit your KCSE results, personal ID, and target course.",
      badge: "Stage 1",
      icon: GraduationCap,
    },
    {
      step: 2,
      title: "Automatic Reg Number Generation",
      description:
        "Once accepted by the Registrar and Admissions Office, our Central Registration Number Generator automatically assigns your official institutional number in the format HCA/STU/YYYY/SEQ (e.g., HCA/STU/2026/001).",
      badge: "Atomic ID",
      icon: Hash,
    },
    {
      step: 3,
      title: "Receive Admission Letter & Initial PIN",
      description:
        "Your official Letter of Admission contains your permanent Student Reg Number, your student email (@student.hitech.ac.ke), and a default security PIN sent via SMS.",
      badge: "Credentials",
      icon: KeyRound,
    },
    {
      step: 4,
      title: "Access Student Portal from the Website",
      description:
        "Click the red 'Student Portal' button in the top navigation header on any page of this website. Enter your Reg Number and PIN to enter your live student dashboard.",
      badge: "Instant Access",
      icon: Lock,
    },
  ];

  const portalCapabilities = [
    {
      title: "Semester Course Registration",
      desc: "Enroll in your core and elective curriculum units at the start of each trimester with immediate lecturer roster sync.",
      icon: FileCheck2,
    },
    {
      title: "Real-Time Weekly Timetable",
      desc: "View class times, physical lecture halls, computer lab assignments, and lecturer contact references.",
      icon: Calendar,
    },
    {
      title: "Online M-Pesa Fee Payments",
      desc: "Initiate instant M-Pesa STK push payments for tuition, hostel, and exams. Download official financial receipts.",
      icon: CreditCard,
    },
    {
      title: "Digital Transcripts & Grades",
      desc: "View trimester GPAs, CAT scores, and download tamper-evident official transcripts signed by the Academic Registrar.",
      icon: ShieldCheck,
    },
    {
      title: "Digital E-Library & Borrowing",
      desc: "Search over 12,000 physical books, reserve copies, read digital e-books, and monitor return due dates.",
      icon: BookOpen,
    },
    {
      title: "CBT Exam Practice & Tests",
      desc: "Take online continuous assessment tests (CATs), multiple choice quizzes, and practical code evaluations.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f274a] text-white py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <span>Student Onboarding Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How Students Access the HI-TECH Portal
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            The HI-TECH College Student Portal is your all-in-one digital campus workspace. Learn how student registration numbers are issued, how to log in, and explore the complete suite of student features.
          </p>
        </div>
      </div>

      {/* Direct Interactive Test / Launcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-blue-900 to-[#153b70] text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Immediate Demo Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              Try the Live Student Portal Right Now
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
              Experience the student dashboard with verified test account <strong>Amina Wanjiku (HCA/STU/2026/001)</strong>. Check units, timetables, results, and fee balances with a single click.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={onLaunchStudentDashboard}
              className="w-full sm:w-auto bg-[#d92332] hover:bg-[#b81d2a] text-white px-6 py-3.5 rounded-xl font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Launch Live Student Portal</span>
            </button>
            <button
              onClick={onOpenPortalModal}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/25 px-5 py-3.5 rounded-xl font-semibold text-xs transition"
            >
              Open Login Dialog
            </button>
          </div>
        </div>
      </div>

      {/* Step by Step Walkthrough */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
            Detailed Roadmap
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            From Application to Portal Access in 4 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {portalSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-full bg-[#153b70] text-white flex items-center justify-center text-xs font-bold">
                      {s.step}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Reg Number Format Explanation & Tester */}
      <div className="bg-slate-50 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
                Institutional Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Understanding Your Registration Number
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                HI-TECH College employs a centralized, atomic numbering standard conforming to national TVET registry guidelines:
              </p>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm font-mono text-xs space-y-2">
                <div className="text-base font-black text-[#153b70] tracking-wide">
                  HCA / STU / 2026 / 001
                </div>
                <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    <strong className="text-slate-800 block">HCA</strong>
                    <span>HI-TECH College</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 block">STU</strong>
                    <span>Student Type</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 block">2026</strong>
                    <span>Enrolment Year</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 block">001</strong>
                    <span>Sequential ID</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reg No Lookup Tester */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">
                Test Student Registration Number Verification
              </h3>
              <p className="text-xs text-slate-600">
                Enter any valid student registration number below to simulate database verification:
              </p>

              <form onSubmit={handleLookup} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testRegNo}
                    onChange={(e) => setTestRegNo(e.target.value)}
                    placeholder="e.g. HCA/STU/2026/001"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-[#153b70] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#0f274a] transition"
                  >
                    Verify
                  </button>
                </div>

                {lookupResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{lookupResult}</span>
                  </div>
                )}
              </form>

              <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Want to see how numbers are issued?</span>
                <button
                  onClick={() => onSwitchToERP("generator")}
                  className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Open Central Generator</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You Can Do in the Portal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
            Comprehensive Student Features
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            What Can You Do Inside the Student Portal?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portalCapabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#153b70] flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{cap.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#0f274a] text-white p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Don't Have a Student Account Yet?</h3>
            <p className="text-xs text-slate-300">
              Apply online for the 2026 academic intake and receive your official registration credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToApply}
              className="bg-[#d92332] hover:bg-[#b81d2a] text-white px-6 py-3 rounded-lg font-bold text-xs tracking-wide transition shadow-md"
            >
              Apply Online Now
            </button>
            <button
              onClick={onLaunchStudentDashboard}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-lg font-semibold text-xs transition"
            >
              Demo Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

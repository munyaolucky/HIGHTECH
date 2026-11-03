import React from "react";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  Cpu,
  BookOpen,
  Award,
  Users,
} from "lucide-react";
import { COLLEGE_INFO } from "../../data/college";

interface HeroProps {
  onNavigate: (page: string) => void;
  onOpenPortalModal: () => void;
}

export default function Hero({ onNavigate, onOpenPortalModal }: HeroProps) {
  return (
    <div className="relative bg-[#0d2345] text-white overflow-hidden">
      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-16 lg:pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/60 text-blue-200 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Government Registered & TVETA Accredited College</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Shape the Future of <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-white">
                Technology & Innovation
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Equip yourself with industry-validated diplomas and certificates in Computing, Artificial Intelligence, Business Management, and Engineering. Join over 4,800 students on a modern digital campus.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => onNavigate("apply")}
                className="bg-[#d92332] hover:bg-[#b81d2a] text-white px-6 py-3.5 rounded-lg font-bold text-sm tracking-wide transition shadow-lg shadow-red-950/40 flex items-center gap-2 group cursor-pointer"
              >
                <span>Apply for 2026 Intake</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenPortalModal}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/25 px-5 py-3.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 cursor-pointer backdrop-blur-sm"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Student Portal Login</span>
              </button>

              <button
                onClick={() => onNavigate("academics")}
                className="text-slate-300 hover:text-white px-4 py-3.5 text-sm font-semibold transition underline underline-offset-4"
              >
                Explore Programmes
              </button>
            </div>

            {/* Trust Points */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>TVET CDACC & KNEC Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Flexible Day & Evening Classes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Reg No & Portal Access</span>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Gateway & Quick Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/15 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Digital Student Portal</h3>
                    <p className="text-[11px] text-blue-200">HI-TECH Integrated Campus ERP</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LIVE & ACTIVE
                </span>
              </div>

              {/* Portal Highlights */}
              <div className="space-y-3">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Verified Student Profile</div>
                    <div className="text-xs font-semibold text-white">Amina Wanjiku (HCA/STU/2026/001)</div>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                    ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40">
                    <div className="text-[10px] text-slate-400">Course Units</div>
                    <div className="font-bold text-white text-sm">6 Registered</div>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40">
                    <div className="text-[10px] text-slate-400">Trimester GPA</div>
                    <div className="font-bold text-amber-300 text-sm">3.75 Distinction</div>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40">
                    <div className="text-[10px] text-slate-400">Exam Transcripts</div>
                    <div className="font-bold text-emerald-300 text-sm">Instant Download</div>
                  </div>
                  <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40">
                    <div className="text-[10px] text-slate-400">M-Pesa STK Fees</div>
                    <div className="font-bold text-sky-300 text-sm">Direct Push</div>
                  </div>
                </div>
              </div>

              {/* Direct Portal Entrance Button */}
              <button
                onClick={onOpenPortalModal}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Student Portal Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center">
                <button
                  onClick={() => onNavigate("portal-guide")}
                  className="text-[11px] text-slate-300 hover:text-white underline"
                >
                  Need help logging in? Read the Step-by-Step Portal Guide →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Statistics Banner Strip */}
      <div className="bg-[#08182f] border-t border-b border-blue-900/60 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">4,850+</div>
            <div className="text-xs text-blue-200 mt-0.5">Enrolled Students</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">98.4%</div>
            <div className="text-xs text-blue-200 mt-0.5">TVET Exam Pass Rate</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">38+</div>
            <div className="text-xs text-blue-200 mt-0.5">Modern Computer Labs</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
            <div className="text-xs text-blue-200 mt-0.5">Attachment Placement</div>
          </div>
        </div>
      </div>
    </div>
  );
}

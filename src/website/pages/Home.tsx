import React from "react";
import Hero from "../components/Hero";
import CourseCard from "../components/CourseCard";
import { COURSES_CATALOGUE, NEWS_AND_EVENTS, COLLEGE_INFO, FAQS_LIST } from "../../data/college";
import { CourseProgramme } from "../../types";
import {
  GraduationCap,
  ShieldCheck,
  Cpu,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  Calendar,
  Building,
  Layers,
  HelpCircle,
} from "lucide-react";

interface HomeProps {
  onNavigate: (page: string) => void;
  onSelectCourse: (course: CourseProgramme) => void;
  onOpenPortalModal: () => void;
}

export default function Home({ onNavigate, onSelectCourse, onOpenPortalModal }: HomeProps) {
  const featuredCourses = COURSES_CATALOGUE.filter((c) => c.featured);
  const latestNews = NEWS_AND_EVENTS.slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <Hero
        onNavigate={onNavigate}
        onOpenPortalModal={onOpenPortalModal}
      />

      {/* Special Banner: "How Can Students Get Portal" Quick Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-[#153b70] via-[#102b55] to-[#07162c] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Student Portal Access Information</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                How Can a Student Access the HI-TECH Portal?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Every admitted student receives an official <strong>Student Registration Number</strong> (e.g., <code>HCA/STU/2026/001</code>). Simply click <strong>"Student Portal"</strong> on the top right of this website to view units, download official transcripts, pay fees via M-Pesa STK push, and take online CBT assessments.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenPortalModal}
                  className="bg-[#d92332] hover:bg-[#b81d2a] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Launch Student Portal Now</span>
                </button>
                <button
                  onClick={() => onNavigate("portal-guide")}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-amber-300" />
                  <span>Read Full Access Guide</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 text-xs backdrop-blur-sm">
              <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>4-Step Portal Journey</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Apply online & submit KCSE index</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>System issues <strong>HCA/STU/2026/001</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Log in with Reg No & initial PIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>Manage units, timetable & results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programmes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#d92332] mb-1">
              Top Ranked TVET Qualifications
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Academic Programmes
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Curricula designed in consultation with industry leaders, examined by TVET CDACC, KNEC, and KASNEB.
            </p>
          </div>

          <button
            onClick={() => onNavigate("academics")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#153b70] hover:text-[#0f274a] transition self-start md:self-auto"
          >
            <span>View All {COURSES_CATALOGUE.length} Programmes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={onSelectCourse}
              onApply={() => {
                onSelectCourse(course);
                onNavigate("apply");
              }}
            />
          ))}
        </div>
      </section>

      {/* Why Choose HI-TECH College */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
              Institutional Advantages
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Why Choose HI-TECH College?
            </h2>
            <p className="text-slate-600 text-sm">
              We bridge the gap between classroom theory and enterprise technology readiness through high-standard TVET training.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#153b70] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">TVETA & CDACC Accredited</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fully registered by the Ministry of Education & TVETA. Nationally recognized certifications accepted across public and private sectors.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Cpu className="w-6 h-6 text-[#d92332]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">38+ Modern Computing Labs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Equipped with high-performance workstations, Cisco networking racks, AI GPU environments, and hardware diagnostics bays.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Integrated Digital ERP</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time Student Portal for online unit registration, M-Pesa STK payments, e-transcripts, CBT exam practice, and library reservations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">100% Industry Attachment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Active partnerships with over 180 leading technology firms, telecom providers, banks, and public corporations for guaranteed attachment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News & Announcements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#d92332] mb-1">
              Campus Updates
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              News & Academic Notices
            </h2>
          </div>
          <button
            onClick={() => onNavigate("news")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#153b70] hover:text-[#0f274a] transition self-start"
          >
            <span>Read All News</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestNews.map((article) => (
            <div
              key={article.id}
              onClick={() => onNavigate("news")}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {article.category}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {article.publishedDate}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm hover:text-[#153b70] transition leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#153b70]">
                <span>Read Full Notice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d92332]">
              Student Enquiries
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-xs">
              Quick answers to the most common questions regarding admissions, registration numbers, and portal access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {FAQS_LIST.slice(0, 4).map((faq, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h4>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate("resources")}
              className="text-xs font-bold text-[#153b70] hover:underline"
            >
              View More FAQs & Downloadable Resources →
            </button>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#0f274a] text-white rounded-2xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Kickstart Your Career at HI-TECH College?
            </h2>
            <p className="text-slate-300 text-sm">
              Applications for the 2026 Academic Year intakes are currently being processed. Secure your admission place and receive your registration number today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("apply")}
              className="bg-[#d92332] hover:bg-[#b81d2a] text-white px-7 py-3 rounded-lg font-bold text-sm tracking-wide transition shadow-lg flex items-center gap-2"
            >
              <span>Apply Online Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPortalModal}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-lg font-semibold text-sm transition"
            >
              Access Student Portal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import { CourseProgramme } from "../../types";
import {
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
  DollarSign,
  ChevronLeft,
  Briefcase,
  Layers,
  Download,
  Share2,
} from "lucide-react";

interface CourseDetailsProps {
  course: CourseProgramme;
  onBack: () => void;
  onApply: (course: CourseProgramme) => void;
}

export default function CourseDetails({ course, onBack, onApply }: CourseDetailsProps) {
  return (
    <div className="space-y-12 pb-16">
      {/* Top Banner */}
      <div className="bg-[#0f274a] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Academics & Course Catalog</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {course.level}
            </span>
            <span className="bg-blue-800 text-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              {course.examiningBody}
            </span>
            <span className="text-xs font-mono text-slate-300">Code: {course.code}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-4xl">
            {course.title}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            {course.department}
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Programme Information */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview Section */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Programme Overview
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {course.overview}
              </p>
            </div>

            {/* Key Curriculum Modules */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Key Curriculum Units & Modules</span>
                <span className="text-xs font-normal text-slate-500">
                  {course.keyModules.length} Core Units
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {course.keyModules.map((module, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{module}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Opportunities */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Career Pathways & Employment Opportunities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {course.careerOpportunities.map((career, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-lg text-xs font-medium text-blue-900 flex items-center gap-2.5"
                  >
                    <Briefcase className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>{career}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Admission Summary & Tuition Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-6 sticky top-24">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tuition Fee Structure
                </span>
                <div className="text-3xl font-black text-[#153b70] mt-1">
                  KES {course.tuitionPerTerm.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-500">/ Trimester</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Payable in flexible monthly instalments or via M-Pesa STK push.
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Minimum Requirement:</span>
                  <span className="font-bold text-slate-800">{course.minimumRequirements}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Course Duration:</span>
                  <span className="font-bold text-slate-800">{course.duration}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Available Intakes:</span>
                  <span className="font-bold text-slate-800">{course.intake.join(", ")}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Study Modes:</span>
                  <span className="font-bold text-slate-800">{course.mode.join(", ")}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Examining Body:</span>
                  <span className="font-bold text-blue-800">{course.examiningBody}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onApply(course)}
                  className="w-full bg-[#d92332] hover:bg-[#b81d2a] text-white py-3 rounded-xl font-bold text-xs tracking-wide transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Apply for this Programme</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onBack}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition text-center"
                >
                  Back to All Courses
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-snug">
                <strong>Portal Activation Note:</strong> Admitted students in this course will receive their official registration number within 24 hours of offer acceptance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

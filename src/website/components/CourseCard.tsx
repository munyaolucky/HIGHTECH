import React from "react";
import {
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { CourseProgramme } from "../../types";

interface CourseCardProps {
  course: CourseProgramme;
  onSelect: (course: CourseProgramme) => void;
  onApply: (course: CourseProgramme) => void;
}

export default function CourseCard({ course, onSelect, onApply }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden group">
      {/* Top Banner & Badges */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            {course.examiningBody}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded text-slate-600 bg-slate-100">
            {course.level}
          </span>
        </div>

        {/* Course Code & Title */}
        <div className="text-xs font-mono text-slate-500 mb-1">{course.code}</div>
        <h3
          onClick={() => onSelect(course)}
          className="font-bold text-lg text-slate-900 group-hover:text-[#153b70] transition-colors cursor-pointer line-clamp-2"
        >
          {course.title}
        </h3>

        {/* Overview snippet */}
        <p className="text-slate-600 text-xs mt-2.5 line-clamp-2 leading-relaxed">
          {course.overview}
        </p>

        {/* Metadata Details */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Duration: <strong>{course.duration}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>Intake: <strong>{course.intake.join(", ")}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Min Entry: <strong>{course.minimumRequirements}</strong></span>
          </div>
        </div>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="p-5 pt-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tuition</div>
          <div className="text-sm font-extrabold text-[#153b70]">
            KES {course.tuitionPerTerm.toLocaleString()}{" "}
            <span className="text-[10px] font-normal text-slate-500">/ term</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(course)}
            className="text-xs font-semibold text-slate-700 hover:text-[#153b70] px-2.5 py-1.5 transition"
          >
            Details
          </button>
          <button
            onClick={() => onApply(course)}
            className="bg-[#153b70] hover:bg-[#0f274a] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition flex items-center gap-1 shadow-sm"
          >
            <span>Apply</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import CourseCard from "../components/CourseCard";
import { COURSES_CATALOGUE } from "../../data/college";
import { CourseProgramme } from "../../types";
import { Search, Filter, BookOpen, Layers, Award, Sparkles } from "lucide-react";

interface AcademicsProps {
  initialDepartment?: string;
  initialLevel?: string;
  onSelectCourse: (course: CourseProgramme) => void;
  onApplyCourse: (course: CourseProgramme) => void;
}

export default function Academics({
  initialDepartment,
  initialLevel,
  onSelectCourse,
  onApplyCourse,
}: AcademicsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment ?? "ALL");
  const [selectedLevel, setSelectedLevel] = useState(initialLevel ?? "ALL");

  useEffect(() => {
    setSelectedDepartment(initialDepartment ?? "ALL");
  }, [initialDepartment]);

  useEffect(() => {
    setSelectedLevel(initialLevel ?? "ALL");
  }, [initialLevel]);

  const departments = [
    { id: "ALL", label: "All Departments" },
    { id: "School of Computing & Informatics", label: "Computing & IT" },
    { id: "School of Business Studies", label: "Business & Management" },
    { id: "School of Engineering", label: "Engineering" },
  ];

  const levels = ["ALL", "Diploma", "Certificate", "Professional", "Short Course"];

  const filteredCourses = useMemo(() => {
    return COURSES_CATALOGUE.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.overview.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDepartment === "ALL" || course.department === selectedDepartment;

      const matchesLevel =
        selectedLevel === "ALL" || course.level === selectedLevel;

      return matchesSearch && matchesDept && matchesLevel;
    });
  }, [searchQuery, selectedDepartment, selectedLevel]);

  return (
    <div className="space-y-12 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f274a] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-900/60 border border-blue-700/60 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>TVET CDACC, KNEC & KASNEB Approved Curriculum</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Academic Programmes & Courses
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Browse our comprehensive catalog of industry-driven diploma, certificate, and professional courses. Designed to equip you with real-world technical competence.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by name or code (e.g. DICT, AI, CPA)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === "ALL" ? "All Levels" : lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing <strong className="text-slate-900">{filteredCourses.length}</strong> available courses
            </div>
            {(searchQuery || selectedDepartment !== "ALL" || selectedLevel !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDepartment("ALL");
                  setSelectedLevel("ALL");
                }}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Courses Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={onSelectCourse}
                onApply={onApplyCourse}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No courses matched your search</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or reset the category filters to view all available programmes.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDepartment("ALL");
                setSelectedLevel("ALL");
              }}
              className="text-xs font-bold text-[#153b70] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  FileText,
  CalendarDays,
  Layers,
  Users,
  ClipboardCheck,
  Building,
  Cpu,
  Video,
  Award,
  HelpCircle,
  Menu,
  X,
  GraduationCap,
  LogOut,
  Search,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { PortalConfirmDialog } from "../../components/ui/PortalUI";

import "./lecturer.css";

// Individual Pages
import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerProfile from "./pages/LecturerProfile";
import MyCourses from "./pages/MyCourses";
import MyClasses from "./pages/MyClasses";
import ClassStudents from "./pages/ClassStudents";
import StudentAcademicProfile from "./pages/StudentAcademicProfile";
import LessonPlans from "./pages/LessonPlans";
import SchemesOfWork from "./pages/SchemesOfWork";
import LearningMaterials from "./pages/LearningMaterials";
import LecturerTimetable from "./pages/LecturerTimetable";
import TimetableRequests from "./pages/TimetableRequests";
import ClassroomManagement from "./pages/ClassroomManagement";
import LaboratoryManagement from "./pages/LaboratoryManagement";
import OnlineClasses from "./pages/OnlineClasses";
import Attendance from "./pages/Attendance";
import MyAssessments from "./pages/MyAssessments";
import CreateAssessment from "./pages/CreateAssessment";
import AssessmentDetails from "./pages/AssessmentDetails";
import QuestionBank from "./pages/QuestionBank";
import QuestionEditor from "./pages/QuestionEditor";
import TeachingDocumentsHub from "./components/TeachingDocumentsHub";
import RecordLessonDeliveryPage from "./components/RecordLessonDeliveryPage";
import AbsenceCasesReviewPage from "./components/AbsenceCasesReviewPage";
import SchemeCoveragePage from "./components/SchemeCoveragePage";
import TeachingReportsPage from "./components/TeachingReportsPage";
import { teachingModuleApi } from "../../services/teachingModuleApi";

export type LecturerTab =
  | "dashboard"
  | "profile"
  | "courses"
  | "classes"
  | "class_students"
  | "student_profile"
  | "lessons"
  | "record_lesson"
  | "teaching_documents"
  | "absence_review"
  | "scheme_coverage"
  | "teaching_reports"
  | "schemes"
  | "materials"
  | "timetable"
  | "timetable_requests"
  | "classrooms"
  | "laboratories"
  | "online_classes"
  | "attendance"
  | "assessments"
  | "create_assessment"
  | "assessment_details"
  | "questions"
  | "create_question";

interface LecturerPortalProps {
  onLogout?: () => void;
}

const LECTURER_SEARCH_ITEMS: { id: LecturerTab; label: string; group: string }[] = [
  { id: "dashboard", label: "My Teaching & Documents", group: "Overview" },
  { id: "record_lesson", label: "Record Today's Lesson & History", group: "Teaching Operations" },
  { id: "teaching_documents", label: "Upload Teaching Documents (17 Categories)", group: "Teaching Operations" },
  { id: "absence_review", label: "Student Absence Reasons & Explanations", group: "Classroom & Academic" },
  { id: "scheme_coverage", label: "Schemes Coverage & Catch-Ups", group: "Teaching Operations" },
  { id: "teaching_reports", label: "Teaching & Attendance Reports (14)", group: "Teaching Operations" },
  { id: "profile", label: "Faculty Profile & HR", group: "Overview" },
  { id: "courses", label: "My Courses & Units", group: "Teaching Operations" },
  { id: "lessons", label: "Lesson Plans", group: "Teaching Operations" },
  { id: "schemes", label: "Schemes of Work", group: "Teaching Operations" },
  { id: "materials", label: "Learning Materials", group: "Teaching Operations" },
  { id: "classes", label: "Classes & Students", group: "Classroom & Academic" },
  { id: "attendance", label: "Attendance Register", group: "Classroom & Academic" },
  { id: "timetable", label: "Weekly Timetable", group: "Classroom & Academic" },
  { id: "assessments", label: "Assessments & CATs", group: "Assessment & Exams" },
  { id: "create_assessment", label: "Create CAT / Assessment", group: "Assessment & Exams" },
  { id: "questions", label: "Question Bank (63 Types)", group: "Assessment & Exams" },
  { id: "classrooms", label: "Classroom Venues", group: "Facilities & Labs" },
  { id: "laboratories", label: "Lab Equipment & Faults", group: "Facilities & Labs" },
  { id: "online_classes", label: "Online Classes", group: "Facilities & Labs" },
];

export default function LecturerPortal({ onLogout }: LecturerPortalProps) {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<LecturerTab>("dashboard");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("asg-csc301");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("stu-001");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("ass-001");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    void teachingModuleApi.ensureLecturerSession();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return LECTURER_SEARCH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  // Navigation helpers
  const handleNavigate = (tab: string) => {
    setActiveTab(tab as LecturerTab);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery("");
  };

  const handleSelectAssignmentFromCourses = (asgId: string, action: string) => {
    setSelectedAssignmentId(asgId);
    if (action === "students") {
      setActiveTab("class_students");
    } else if (action === "lessons") {
      setActiveTab("lessons");
    } else if (action === "attendance") {
      setActiveTab("attendance");
    }
  };

  const handleViewClassStudents = (asgId: string) => {
    setSelectedAssignmentId(asgId);
    setActiveTab("class_students");
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab("student_profile");
  };

  const handleSelectAssessment = (assId: string) => {
    setSelectedAssessmentId(assId);
    setActiveTab("assessment_details");
  };

  const classesActive =
    activeTab === "classes" || activeTab === "class_students" || activeTab === "student_profile";
  const timetableActive = activeTab === "timetable" || activeTab === "timetable_requests";
  const assessmentsActive =
    activeTab === "assessments" ||
    activeTab === "create_assessment" ||
    activeTab === "assessment_details";
  const questionsActive = activeTab === "questions" || activeTab === "create_question";

  return (
    <div className="lecturer-shell">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close lecturer navigation drawer"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`lecturer-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="lecturer-brand">
          <div className="brand-logo">HCA</div>
          <div className="min-w-0 flex-1">
            <strong>HI-TECH COLLEGE</strong>
            <small>Lecturer &amp; Trainer Portal</small>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="md:hidden p-1.5 rounded-lg text-blue-100 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <nav aria-label="Lecturer portal navigation" className="lecturer-navigation">
          <div className="nav-section">Overview</div>
          <button
            type="button"
            onClick={() => handleNavigate("dashboard")}
            aria-current={activeTab === "dashboard" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("profile")}
            aria-current={activeTab === "profile" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "profile" ? "active" : ""}`}
          >
            <UserCheck size={16} />
            <span>Faculty Profile &amp; HR</span>
          </button>

          <div className="nav-section">Teaching Operations</div>
          <button
            type="button"
            onClick={() => handleNavigate("record_lesson")}
            aria-current={activeTab === "record_lesson" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "record_lesson" ? "active" : ""}`}
          >
            <FileText size={16} />
            <span>Record Today&apos;s Lesson</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("teaching_documents")}
            aria-current={activeTab === "teaching_documents" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "teaching_documents" ? "active" : ""}`}
          >
            <BookOpen size={16} />
            <span>Teaching Documents (17)</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("scheme_coverage")}
            aria-current={activeTab === "scheme_coverage" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "scheme_coverage" ? "active" : ""}`}
          >
            <Layers size={16} />
            <span>Schemes &amp; Catch-Ups</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("teaching_reports")}
            aria-current={activeTab === "teaching_reports" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "teaching_reports" ? "active" : ""}`}
          >
            <Award size={16} />
            <span>Reports &amp; Exports (14)</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("courses")}
            aria-current={activeTab === "courses" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "courses" ? "active" : ""}`}
          >
            <BookOpen size={16} />
            <span>My Courses &amp; Units</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("lessons")}
            aria-current={activeTab === "lessons" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "lessons" ? "active" : ""}`}
          >
            <FileText size={16} />
            <span>Lesson Plans</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("schemes")}
            aria-current={activeTab === "schemes" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "schemes" ? "active" : ""}`}
          >
            <Layers size={16} />
            <span>Schemes of Work</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("materials")}
            aria-current={activeTab === "materials" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "materials" ? "active" : ""}`}
          >
            <GraduationCap size={16} />
            <span>Learning Materials</span>
          </button>

          <div className="nav-section">Classroom &amp; Academic</div>
          <button
            type="button"
            onClick={() => handleNavigate("absence_review")}
            aria-current={activeTab === "absence_review" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "absence_review" ? "active" : ""}`}
          >
            <Users size={16} />
            <span>Student Absence Reasons</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("classes")}
            aria-current={classesActive ? "page" : undefined}
            className={`lecturer-nav-link ${classesActive ? "active" : ""}`}
          >
            <Users size={16} />
            <span>Classes &amp; Students</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("attendance")}
            aria-current={activeTab === "attendance" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "attendance" ? "active" : ""}`}
          >
            <ClipboardCheck size={16} />
            <span>Attendance Register</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("timetable")}
            aria-current={timetableActive ? "page" : undefined}
            className={`lecturer-nav-link ${timetableActive ? "active" : ""}`}
          >
            <CalendarDays size={16} />
            <span>Weekly Timetable</span>
          </button>

          <div className="nav-section">Assessment &amp; Exams</div>
          <button
            type="button"
            onClick={() => handleNavigate("assessments")}
            aria-current={assessmentsActive ? "page" : undefined}
            className={`lecturer-nav-link ${assessmentsActive ? "active" : ""}`}
          >
            <Award size={16} />
            <span>Assessments &amp; CATs</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("questions")}
            aria-current={questionsActive ? "page" : undefined}
            className={`lecturer-nav-link ${questionsActive ? "active" : ""}`}
          >
            <HelpCircle size={16} />
            <span>Question Bank (63 Types)</span>
          </button>

          <div className="nav-section">Facilities &amp; Labs</div>
          <button
            type="button"
            onClick={() => handleNavigate("classrooms")}
            aria-current={activeTab === "classrooms" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "classrooms" ? "active" : ""}`}
          >
            <Building size={16} />
            <span>Classroom Venues</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("laboratories")}
            aria-current={activeTab === "laboratories" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "laboratories" ? "active" : ""}`}
          >
            <Cpu size={16} />
            <span>Lab Equipment &amp; Faults</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("online_classes")}
            aria-current={activeTab === "online_classes" ? "page" : undefined}
            className={`lecturer-nav-link ${activeTab === "online_classes" ? "active" : ""}`}
          >
            <Video size={16} />
            <span>Online Classes</span>
          </button>
        </nav>

        {/* LECTURER PROFILE FOOTER */}
        <div className="lecturer-footer-profile">
          <div className="profile-avatar-sm">PO</div>
          <div className="min-w-0 flex-1">
            <strong className="text-white text-xs block truncate">Dr. Peter Otieno</strong>
            <small className="text-amber-300 font-mono text-[10px] block truncate">
              HCA/LECT/2026/001
            </small>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              aria-label="Sign out to college website"
              title="Sign Out to Website"
              className="p-1.5 rounded-lg text-blue-100 hover:text-red-200 hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lecturer-main">
        {/* TOP HEADER */}
        <header className="lecturer-header">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="md:hidden text-slate-700 dark:text-slate-200 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="min-w-0">
              <strong className="truncate">HI-TECH College Faculty Workspace</strong>
              <small className="truncate">
                Senior Lecturer &amp; Computing Director · Staff Reg:{" "}
                <code className="font-mono text-[#102e57] dark:text-amber-300 font-bold">
                  HCA/STAFF/2026/001
                </code>
              </small>
            </div>
          </div>

          <div className="header-actions">
            {/* Desktop quick search */}
            <div className="relative hidden lg:block w-60">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-[#1769aa] focus-within:ring-2 focus-within:ring-[#1769aa]/20">
                <Search size={14} className="text-slate-500 dark:text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchMatches.length > 0) {
                      handleNavigate(searchMatches[0].id);
                    }
                  }}
                  placeholder="Jump to teaching tool..."
                  aria-label="Search lecturer workspace"
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear workspace search"
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-10 z-40 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl">
                  {searchMatches.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                      No teaching modules match &ldquo;{searchQuery}&rdquo;.
                    </p>
                  ) : (
                    searchMatches.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span className="truncate font-medium">{item.label}</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
                          {item.group}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((o) => !o)}
              aria-label="Toggle workspace search"
              aria-expanded={mobileSearchOpen}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileSearchOpen ? <X size={17} /> : <Search size={17} />}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <span className="hidden xl:inline-block text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
              Session 2025/2026
            </span>

            <button
              type="button"
              onClick={() => handleNavigate("attendance")}
              className="primary-button text-xs py-1.5 px-3 bg-[#c62828] hover:bg-[#b71c1c] whitespace-nowrap shrink-0"
            >
              <ClipboardCheck size={14} /> Quick Attendance
            </button>
          </div>
        </header>

        {mobileSearchOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <Search size={15} className="text-slate-500 dark:text-slate-300 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchMatches.length > 0) {
                    handleNavigate(searchMatches[0].id);
                  }
                }}
                placeholder="Jump to teaching tool..."
                aria-label="Search lecturer workspace"
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="text-slate-500 dark:text-slate-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {searchQuery.trim().length > 0 && (
              <div className="space-y-1">
                {searchMatches.length === 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 px-1">
                    No teaching modules match &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  searchMatches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={13} className="text-slate-500 dark:text-slate-300" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ROUTED CONTENT VIEW */}
        <div className="lecturer-content">
          {activeTab === "dashboard" && (
            <LecturerDashboard onNavigate={handleNavigate} />
          )}

          {activeTab === "profile" && <LecturerProfile />}

          {activeTab === "courses" && (
            <MyCourses onSelectAssignment={handleSelectAssignmentFromCourses} />
          )}

          {activeTab === "classes" && (
            <MyClasses onViewClassStudents={handleViewClassStudents} />
          )}

          {activeTab === "class_students" && (
            <ClassStudents
              assignmentId={selectedAssignmentId}
              onBack={() => setActiveTab("classes")}
              onSelectStudent={handleSelectStudent}
            />
          )}

          {activeTab === "student_profile" && (
            <StudentAcademicProfile
              studentId={selectedStudentId}
              onBack={() => setActiveTab("class_students")}
            />
          )}

          {activeTab === "lessons" && <LessonPlans />}

          {activeTab === "schemes" && <SchemesOfWork />}

          {activeTab === "materials" && <LearningMaterials />}

          {activeTab === "timetable" && (
            <LecturerTimetable
              onRequestChange={() => setActiveTab("timetable_requests")}
            />
          )}

          {activeTab === "timetable_requests" && (
            <TimetableRequests onBack={() => setActiveTab("timetable")} />
          )}

          {activeTab === "classrooms" && <ClassroomManagement />}

          {activeTab === "laboratories" && <LaboratoryManagement />}

          {activeTab === "online_classes" && <OnlineClasses />}

          {activeTab === "attendance" && <Attendance />}

          {activeTab === "record_lesson" && <RecordLessonDeliveryPage />}

          {activeTab === "teaching_documents" && <TeachingDocumentsHub />}

          {activeTab === "absence_review" && <AbsenceCasesReviewPage />}

          {activeTab === "scheme_coverage" && <SchemeCoveragePage />}

          {activeTab === "teaching_reports" && <TeachingReportsPage />}

          {activeTab === "assessments" && (
            <MyAssessments
              onCreateNew={() => setActiveTab("create_assessment")}
              onSelectAssessment={handleSelectAssessment}
            />
          )}

          {activeTab === "create_assessment" && (
            <CreateAssessment
              onBack={() => setActiveTab("assessments")}
              onAssessmentCreated={handleSelectAssessment}
            />
          )}

          {activeTab === "assessment_details" && (
            <AssessmentDetails
              assessmentId={selectedAssessmentId}
              onBack={() => setActiveTab("assessments")}
              onNavigateToQuestionBank={() => setActiveTab("questions")}
            />
          )}

          {activeTab === "questions" && (
            <QuestionBank
              onCreateQuestion={() => setActiveTab("create_question")}
            />
          )}

          {activeTab === "create_question" && (
            <QuestionEditor
              onBack={() => setActiveTab("questions")}
              onQuestionSaved={() => setActiveTab("questions")}
            />
          )}
        </div>
      </div>

      {onLogout && (
        <PortalConfirmDialog
          isOpen={logoutModalOpen}
          title="Sign out of Lecturer Portal"
          message="Return to the HI-TECH College public portal? Any saved lesson plans, registers, and draft questions remain stored."
          confirmLabel="Sign out"
          cancelLabel="Stay in workspace"
          tone="danger"
          onConfirm={() => {
            setLogoutModalOpen(false);
            onLogout();
          }}
          onCancel={() => setLogoutModalOpen(false)}
        />
      )}
    </div>
  );
}

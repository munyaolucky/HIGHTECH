import React, { useState } from "react";
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  FileText,
  CalendarDays,
  Layers,
  Users,
  ClipboardCheck,
  Calendar,
  Building,
  Cpu,
  Video,
  Award,
  PlusCircle,
  HelpCircle,
  Bell,
  Menu,
  X,
  GraduationCap,
  Sparkles,
} from "lucide-react";

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

export type LecturerTab =
  | "dashboard"
  | "profile"
  | "courses"
  | "classes"
  | "class_students"
  | "student_profile"
  | "lessons"
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

export default function LecturerPortal() {
  const [activeTab, setActiveTab] = useState<LecturerTab>("dashboard");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("asg-csc301");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("stu-001");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("ass-001");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation helpers
  const handleNavigate = (tab: string) => {
    setActiveTab(tab as LecturerTab);
    setMobileMenuOpen(false);
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

  return (
    <div className="lecturer-shell">
      {/* SIDEBAR */}
      <aside className={`lecturer-sidebar ${mobileMenuOpen ? "block" : ""}`}>
        <div className="lecturer-brand">
          <div className="brand-logo">HCA</div>
          <div>
            <strong>HI-TECH COLLEGE</strong>
            <small>Lecturer &amp; Trainer Portal</small>
          </div>
        </div>

        <nav className="lecturer-navigation">
          <div className="nav-section">Overview</div>
          <button
            onClick={() => handleNavigate("dashboard")}
            className={`lecturer-nav-link ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigate("profile")}
            className={`lecturer-nav-link ${activeTab === "profile" ? "active" : ""}`}
          >
            <UserCheck size={16} />
            <span>Faculty Profile &amp; HR</span>
          </button>

          <div className="nav-section">Teaching Operations</div>
          <button
            onClick={() => handleNavigate("courses")}
            className={`lecturer-nav-link ${activeTab === "courses" ? "active" : ""}`}
          >
            <BookOpen size={16} />
            <span>My Courses &amp; Units</span>
          </button>
          <button
            onClick={() => handleNavigate("lessons")}
            className={`lecturer-nav-link ${activeTab === "lessons" ? "active" : ""}`}
          >
            <FileText size={16} />
            <span>Lesson Plans</span>
          </button>
          <button
            onClick={() => handleNavigate("schemes")}
            className={`lecturer-nav-link ${activeTab === "schemes" ? "active" : ""}`}
          >
            <Layers size={16} />
            <span>Schemes of Work</span>
          </button>
          <button
            onClick={() => handleNavigate("materials")}
            className={`lecturer-nav-link ${activeTab === "materials" ? "active" : ""}`}
          >
            <GraduationCap size={16} />
            <span>Learning Materials</span>
          </button>

          <div className="nav-section">Classroom &amp; Academic</div>
          <button
            onClick={() => handleNavigate("classes")}
            className={`lecturer-nav-link ${activeTab === "classes" || activeTab === "class_students" || activeTab === "student_profile" ? "active" : ""}`}
          >
            <Users size={16} />
            <span>Classes &amp; Students</span>
          </button>
          <button
            onClick={() => handleNavigate("attendance")}
            className={`lecturer-nav-link ${activeTab === "attendance" ? "active" : ""}`}
          >
            <ClipboardCheck size={16} />
            <span>Attendance Register</span>
          </button>
          <button
            onClick={() => handleNavigate("timetable")}
            className={`lecturer-nav-link ${activeTab === "timetable" || activeTab === "timetable_requests" ? "active" : ""}`}
          >
            <CalendarDays size={16} />
            <span>Weekly Timetable</span>
          </button>

          <div className="nav-section">Assessment &amp; Exams</div>
          <button
            onClick={() => handleNavigate("assessments")}
            className={`lecturer-nav-link ${activeTab === "assessments" || activeTab === "create_assessment" || activeTab === "assessment_details" ? "active" : ""}`}
          >
            <Award size={16} />
            <span>Assessments &amp; CATs</span>
          </button>
          <button
            onClick={() => handleNavigate("questions")}
            className={`lecturer-nav-link ${activeTab === "questions" || activeTab === "create_question" ? "active" : ""}`}
          >
            <HelpCircle size={16} />
            <span>Question Bank (63 Types)</span>
          </button>

          <div className="nav-section">Facilities &amp; Labs</div>
          <button
            onClick={() => handleNavigate("classrooms")}
            className={`lecturer-nav-link ${activeTab === "classrooms" ? "active" : ""}`}
          >
            <Building size={16} />
            <span>Classroom Venues</span>
          </button>
          <button
            onClick={() => handleNavigate("laboratories")}
            className={`lecturer-nav-link ${activeTab === "laboratories" ? "active" : ""}`}
          >
            <Cpu size={16} />
            <span>Lab Equipment &amp; Faults</span>
          </button>
          <button
            onClick={() => handleNavigate("online_classes")}
            className={`lecturer-nav-link ${activeTab === "online_classes" ? "active" : ""}`}
          >
            <Video size={16} />
            <span>Online Classes</span>
          </button>
        </nav>

        {/* LECTURER PROFILE FOOTER */}
        <div className="lecturer-footer-profile">
          <div className="profile-avatar-sm">PO</div>
          <div className="min-w-0">
            <strong className="text-white text-xs block truncate">Dr. Peter Otieno</strong>
            <small className="text-amber-300 font-mono text-[10px] block truncate">
              HCA/LECT/2026/001
            </small>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lecturer-main">
        {/* TOP HEADER */}
        <header className="lecturer-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-600 p-1.5 rounded-lg border border-slate-200"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <strong>HI-TECH College Faculty Workspace</strong>
              <small>
                Senior Lecturer &amp; Computing Director · Staff Reg: <code className="font-mono text-blue-900 font-bold">HCA/STAFF/2026/001</code>
              </small>
            </div>
          </div>

          <div className="header-actions">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Academic Session 2025/2026
            </span>

            <button
              onClick={() => handleNavigate("attendance")}
              className="primary-button text-xs py-1.5 px-3 bg-[#c62828] hover:bg-[#b71c1c]"
            >
              <ClipboardCheck size={14} /> Quick Attendance
            </button>
          </div>
        </header>

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
    </div>
  );
}

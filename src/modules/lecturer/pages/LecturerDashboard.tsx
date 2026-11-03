import React, { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  Users,
  ClipboardCheck,
  CalendarDays,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { lecturerApi } from "../services/lecturerApi";

interface LecturerDashboardProps {
  onNavigate: (tab: string) => void;
}

export default function LecturerDashboard({ onNavigate }: LecturerDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lecturerApi.dashboard().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
        <p>Loading Lecturer / Trainer workspace...</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Assigned Units",
      value: data.statistics.assignedUnits,
      icon: BookOpen,
      color: "blue",
      tab: "courses",
    },
    {
      title: "Lesson Plans",
      value: data.statistics.pendingLessonPlans,
      icon: FileText,
      color: "purple",
      tab: "lessons",
    },
    {
      title: "Enrolled Students",
      value: "80 Active",
      icon: Users,
      color: "orange",
      tab: "classes",
    },
    {
      title: "Active Assessments",
      value: data.statistics.pendingAssessments,
      icon: ClipboardCheck,
      color: "green",
      tab: "assessments",
    },
    {
      title: "Pending Attendance",
      value: data.statistics.pendingAttendance,
      icon: CalendarDays,
      color: "red",
      tab: "attendance",
    },
  ];

  return (
    <div className="space-y-6">
      {/* PAGE HEADING */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">MODULE 18 · LECTURER &amp; TRAINER PORTAL</span>
          <h1>Good day, {data.lecturer.name}</h1>
          <p>Manage your teaching operations, student registers, assessments, and laboratory allocations.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="primary-button" onClick={() => onNavigate("lessons")}>
            <Plus size={16} />
            Create Lesson Plan
          </button>
          <button
            className="secondary-button"
            onClick={() => onNavigate("attendance")}
          >
            <ClipboardCheck size={16} />
            Take Attendance
          </button>
        </div>
      </div>

      {/* LECTURER WELCOME BANNER */}
      <section className="lecturer-welcome">
        <div>
          <span>AUTHORITATIVE STAFF IDENTITY</span>
          <h2>{data.lecturer.registrationNumber}</h2>
          <p>
            Linked Central Staff Identity: <strong className="text-amber-300 font-mono">{data.lecturer.staffRegistrationNumber}</strong> · {data.lecturer.department}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="status-label">{data.lecturer.employmentStatus}</span>
          <span className="text-xs text-blue-200">HI-TECH College Academic Year 2025/2026</span>
        </div>
      </section>

      {/* STAT GRID */}
      <section className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              className="stat-card cursor-pointer hover:border-blue-400 transition"
              key={stat.title}
              onClick={() => onNavigate(stat.tab)}
            >
              <div className={`stat-icon ${stat.color}`}>
                <Icon size={20} />
              </div>
              <p>{stat.title}</p>
              <h2>{stat.value}</h2>
            </article>
          );
        })}
      </section>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        {/* QUICK ACTIONS PANEL */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Teaching Workspace Quick Actions</h3>
              <p>Instant shortcuts to daily academic responsibilities</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">Semester 1</span>
          </div>

          <div className="quick-actions">
            {[
              { label: "Class Attendance Register", tab: "attendance" },
              { label: "Upload Learning Materials", tab: "materials" },
              { label: "Prepare Schemes of Work", tab: "schemes" },
              { label: "Create CAT / Assessment", tab: "create_assessment" },
              { label: "Manage Question Bank", tab: "questions" },
              { label: "Weekly Timetable & Venues", tab: "timetable" },
              { label: "Laboratory Equipment & Faults", tab: "laboratories" },
              { label: "Schedule Online Class", tab: "online_classes" },
            ].map((item) => (
              <button key={item.label} onClick={() => onNavigate(item.tab)}>
                <span>{item.label}</span>
                <ArrowRight size={15} className="text-slate-400" />
              </button>
            ))}
          </div>
        </section>

        {/* NOTIFICATIONS PANEL */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Institutional Notifications</h3>
              <p>Academic &amp; departmental announcements</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">3 Unread</span>
          </div>

          <div className="space-y-1">
            {data.notifications.map((item: any) => (
              <div className="notification-item" key={item.id}>
                <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

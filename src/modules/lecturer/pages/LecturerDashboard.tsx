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
      <div className="space-y-6" role="status" aria-label="Loading Lecturer and Trainer workspace">
        <div className="h-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-center gap-2">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-72 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-6 w-14 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
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

  const resolveNotificationTab = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes("timetable") || t.includes("schedule") || t.includes("venue")) return "timetable";
    if (t.includes("exam") || t.includes("cat") || t.includes("assessment") || t.includes("mark")) return "assessments";
    if (t.includes("attendance") || t.includes("register")) return "attendance";
    if (t.includes("lab") || t.includes("fault")) return "laboratories";
    return "courses";
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADING */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">Lecturer &amp; Trainer Portal</span>
          <h1>Good day, {data.lecturer.name}</h1>
          <p>Manage your teaching operations, student registers, assessments, and laboratory allocations.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("lessons")}
          >
            <Plus size={16} />
            Create Lesson Plan
          </button>
          <button
            type="button"
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
          <span>Authoritative Staff Identity</span>
          <h2>{data.lecturer.registrationNumber}</h2>
          <p>
            Linked Central Staff Identity:{" "}
            <strong className="text-amber-300 font-mono">{data.lecturer.staffRegistrationNumber}</strong>
            {" · "}
            {data.lecturer.department}
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <span className="status-label">{data.lecturer.employmentStatus}</span>
          <span className="text-xs text-blue-100">HI-TECH College · Academic Year 2025/2026</span>
        </div>
      </section>

      {/* STAT GRID */}
      <section className="stat-grid" aria-label="Teaching summary metrics">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              type="button"
              className="stat-card cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769aa]"
              key={stat.title}
              onClick={() => onNavigate(stat.tab)}
            >
              <div className={`stat-icon ${stat.color}`}>
                <Icon size={20} />
              </div>
              <p>{stat.title}</p>
              <h2>{stat.value}</h2>
            </button>
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
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Semester 1
            </span>
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
              <button
                type="button"
                key={item.label}
                onClick={() => onNavigate(item.tab)}
              >
                <span>{item.label}</span>
                <ArrowRight size={15} className="text-slate-500 dark:text-slate-300 shrink-0" />
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
            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums whitespace-nowrap">
              {data.notifications.length} Notices
            </span>
          </div>

          <div className="space-y-1">
            {data.notifications.map((item: any) => (
              <button
                type="button"
                className="notification-item"
                key={item.id}
                onClick={() => onNavigate(resolveNotificationTab(item.title ?? ""))}
              >
                <Clock size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

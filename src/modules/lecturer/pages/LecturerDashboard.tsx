import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  Users,
  ClipboardCheck,
  CalendarDays,
  Plus,
  ArrowRight,
  Clock,
  FolderUp,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';
import { lecturerApi } from '../services/lecturerApi';
import { teachingModuleApi } from '../../../services/teachingModuleApi';

interface LecturerDashboardProps {
  onNavigate: (tab: string) => void;
}

export default function LecturerDashboard({ onNavigate }: LecturerDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [teachingSummary, setTeachingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadAll() {
      const legacy = await lecturerApi.dashboard();
      let teach = null;
      try {
        await teachingModuleApi.ensureLecturerSession();
        teach = await teachingModuleApi.getSummary();
      } catch {
        // Fallback gracefully if backend offline
      }
      if (!active) return;
      setData(legacy);
      setTeachingSummary(teach);
      setLoading(false);
    }
    void loadAll();
    return () => {
      active = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading Lecturer and Trainer workspace">
        <div className="h-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-center gap-2">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-72 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between"
            >
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-7 w-14 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const teachingKpis = teachingSummary?.kpis ?? {
    todaysClassesCount: 5,
    lessonsRecordedCount: 4,
    documentsUploadedCount: 3,
    absenceCasesToReviewCount: 6,
  };

  const myTeachingCards = [
    {
      label: "Today's classes",
      value: teachingKpis.todaysClassesCount,
      icon: CalendarDays,
      tab: 'timetable',
      sub: 'Scheduled today',
    },
    {
      label: 'Lessons recorded',
      value: teachingKpis.lessonsRecordedCount,
      icon: FileText,
      tab: 'record_lesson',
      sub: 'Delivery log entries',
    },
    {
      label: 'Documents uploaded',
      value: teachingKpis.documentsUploadedCount,
      icon: FolderUp,
      tab: 'teaching_documents',
      sub: '17 academic categories',
    },
    {
      label: 'Absence cases to review',
      value: teachingKpis.absenceCasesToReviewCount,
      icon: UserX,
      tab: 'absence_review',
      sub: 'Pending student explanations',
    },
  ];

  const stats = [
    { title: 'Assigned Units', value: data.statistics.assignedUnits, icon: BookOpen, color: 'blue', tab: 'courses' },
    { title: 'Enrolled Students', value: '80 Active', icon: Users, color: 'orange', tab: 'classes' },
    { title: 'Active Assessments', value: data.statistics.pendingAssessments, icon: ClipboardCheck, color: 'green', tab: 'assessments' },
    { title: '14 Standard Reports', value: 'CSV / PDF', icon: FileSpreadsheet, color: 'purple', tab: 'teaching_reports' },
  ];

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Lecturer &amp; Trainer Portal</span>
          <h1>Good day, {data.lecturer.name}</h1>
          <p>Manage your teaching documents, daily lesson delivery records, class attendance, and student absence explanations.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="primary-button" onClick={() => onNavigate('record_lesson')}>
            <Plus size={16} />
            Record Today&apos;s Lesson
          </button>
          <button type="button" className="secondary-button" onClick={() => onNavigate('attendance')}>
            <ClipboardCheck size={16} />
            Take Attendance
          </button>
        </div>
      </div>

      {/* MY TEACHING & DOCUMENTS SECTION */}
      <section aria-labelledby="my-teaching-heading" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-400">
              LECTURER / TRAINER PORTAL
            </p>
            <h2 id="my-teaching-heading" className="text-lg font-bold text-[#102D50] dark:text-white">
              My Teaching &amp; Documents
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('teaching_documents')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-[#102D50] dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Upload Teaching Documents
            </button>
            <button
              type="button"
              onClick={() => onNavigate('absence_review')}
              className="px-3 py-1.5 rounded-lg bg-[#B83232] text-white font-semibold"
            >
              Review Absence Cases
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 tabular-nums">
          {myTeachingCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => onNavigate(card.tab)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/70 p-4 text-left hover:border-[#1769AA] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{card.label}</span>
                  <Icon size={16} className="text-[#1769AA] dark:text-blue-400" />
                </div>
                <strong className="block text-2xl font-bold text-[#102D50] dark:text-white mt-2">
                  {card.value}
                </strong>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{card.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* STAT GRID */}
      <section className="stat-grid" aria-label="Secondary faculty metrics">
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

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Teaching &amp; Attendance Quick Menu</h3>
              <p>Direct access to lesson logs, documents, and student absence management</p>
            </div>
          </div>

          <div className="quick-actions">
            {[
              { label: "Record Today's Lesson & Delivery History", tab: 'record_lesson' },
              { label: 'Upload Teaching Documents (17 Categories)', tab: 'teaching_documents' },
              { label: 'Class Attendance & QR Generator', tab: 'attendance' },
              { label: 'Student Absence Reasons & Option B Notes', tab: 'absence_review' },
              { label: 'Scheme of Work Coverage & Catch-Ups', tab: 'scheme_coverage' },
              { label: 'All 14 Teaching & Attendance Reports', tab: 'teaching_reports' },
              { label: 'Create CAT / Assessment', tab: 'create_assessment' },
              { label: 'Weekly Timetable & Venues', tab: 'timetable' },
            ].map((item) => (
              <button type="button" key={item.label} onClick={() => onNavigate(item.tab)}>
                <span>{item.label}</span>
                <ArrowRight size={15} className="text-slate-500 dark:text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Teaching &amp; Absence Alerts</h3>
              <p>HOD feedback, consecutive absence alerts &amp; pending explanations</p>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
              {(teachingSummary?.alerts?.length ?? data.notifications.length)} Alerts
            </span>
          </div>

          <div className="space-y-1">
            {(teachingSummary?.alerts?.length ? teachingSummary.alerts : data.notifications).map((item: any) => (
              <button
                type="button"
                className="notification-item"
                key={item.id}
                onClick={() =>
                  onNavigate(
                    String(item.category || '').includes('DOCUMENT')
                      ? 'teaching_documents'
                      : String(item.category || '').includes('ABSENCE') || String(item.category || '').includes('EXPLANATION')
                      ? 'absence_review'
                      : 'attendance'
                  )
                }
              >
                <Clock size={16} className="text-[#1769AA] dark:text-blue-400 shrink-0 mt-0.5" />
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

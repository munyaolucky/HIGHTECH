import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  List,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { publicEventsApi, type PublicEventSummary } from './eventsApi';

interface PublicEventCalendarPageProps {
  onSelectEvent: (slug: string) => void;
  onRegisterEvent: (eventId: string) => void;
  onBackToEvents: () => void;
  onOpenVerifyTicket?: () => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export default function PublicEventCalendarPage({
  onSelectEvent,
  onRegisterEvent,
  onBackToEvents,
  onOpenVerifyTicket,
}: PublicEventCalendarPageProps) {
  const [events, setEvents] = useState<PublicEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'MONTH' | 'AGENDA'>('MONTH');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    publicEventsApi
      .list()
      .then((rows) => {
        if (!cancelled) {
          setEvents(rows);
          const nextUpcoming = rows.find((r) => !r.isPast && r.status !== 'CANCELLED') ?? rows[0];
          if (nextUpcoming?.eventDate) {
            const parsed = new Date(`${nextUpcoming.eventDate}T00:00:00`);
            if (!Number.isNaN(parsed.getTime())) {
              setMonthCursor(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
            }
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (campusFilter !== 'ALL' && ev.campus !== campusFilter) return false;
      if (categoryFilter !== 'ALL' && ev.category !== categoryFilter) return false;
      return true;
    });
  }, [events, campusFilter, categoryFilter]);

  const campuses = useMemo(
    () => Array.from(new Set(events.map((e) => e.campus).filter(Boolean))),
    [events]
  );
  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean))),
    [events]
  );

  const currentYear = monthCursor.getFullYear();
  const currentMonth = monthCursor.getMonth();
  const activeMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const monthCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Monday-indexed offset (0 = Mon ... 6 = Sun)
    const offset = (firstDay.getDay() + 6) % 7;
    const cells: Array<{ day: number | null; dateStr: string | null; items: PublicEventSummary[] }> =
      [];

    for (let i = 0; i < offset; i++) {
      cells.push({ day: null, dateStr: null, items: [] });
    }
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${activeMonthKey}-${String(day).padStart(2, '0')}`;
      const items = filteredEvents.filter((e) => e.eventDate === dateStr);
      cells.push({ day, dateStr, items });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateStr: null, items: [] });
    }
    return cells;
  }, [currentYear, currentMonth, activeMonthKey, filteredEvents]);

  const monthEvents = useMemo(
    () =>
      filteredEvents
        .filter((e) => toMonthKey(e.eventDate) === activeMonthKey)
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
    [filteredEvents, activeMonthKey]
  );

  const shiftMonth = (delta: number) => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="bg-[#F4F7FB] min-h-screen pb-16">
      {/* Institutional Banner */}
      <section className="bg-[#102D50] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={onBackToEvents}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5EBDD] hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Events</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              HI-TECH College Interactive Events Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
              Browse scheduled summits, workshops, open days, webinars, and graduations by month or
              agenda list. Download any session to Outlook, Google, or Apple Calendar (.ics).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenVerifyTicket && (
              <button
                type="button"
                onClick={onOpenVerifyTicket}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#ffc928]" />
                <span>Verify Ticket / Certificate</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 space-y-6">
        {/* Controls Toolbar */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 text-[#102D50] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="min-w-[170px] text-center text-sm sm:text-base font-black text-[#102D50]">
              {monthCursor.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 text-[#102D50] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <select
              aria-label="Filter by campus"
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-[#102D50]"
            >
              <option value="ALL">All Campuses</option>
              {campuses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-[#102D50]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('MONTH')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold cursor-pointer ${
                  viewMode === 'MONTH' ? 'bg-[#102D50] text-white' : 'text-slate-600'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Month Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('AGENDA')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-bold cursor-pointer ${
                  viewMode === 'AGENDA' ? 'bg-[#102D50] text-white' : 'text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-600">
            Loading HI-TECH College monthly schedule...
          </div>
        ) : viewMode === 'MONTH' ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 bg-[#102D50] text-white text-center text-xs font-bold py-2.5">
              {WEEKDAYS.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {monthCells.map((cell, idx) => (
                <div
                  key={cell.dateStr || `empty-${idx}`}
                  className={`min-h-[112px] p-2.5 border-b border-slate-100 ${
                    cell.day ? 'bg-white' : 'bg-slate-50/60 hidden sm:block'
                  }`}
                >
                  {cell.day && (
                    <>
                      <div className="font-mono text-xs font-bold text-slate-500 tabular-nums mb-1.5">
                        {cell.day}
                      </div>
                      <div className="space-y-1.5">
                        {cell.items.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => onSelectEvent(ev.slug)}
                            className="w-full text-left rounded-lg bg-[#F5EBDD] hover:bg-[#1769AA] hover:text-white text-[#102D50] px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <div className="truncate">{ev.title}</div>
                            <div className="text-[10px] opacity-80 font-mono">{ev.startTime}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Agenda List (Shown directly in Agenda mode, and below Grid in Month mode) */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#102D50]">
              Events in {monthCursor.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })} (
              {monthEvents.length})
            </h3>
          </div>

          {monthEvents.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No published events scheduled for this month under the selected filters. Use the arrows
              above to browse other months.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {monthEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                      <span className="font-mono text-[#B83232]">{ev.eventDate}</span>
                      <span className="text-[#1769AA]">{ev.category}</span>
                      <span className="text-slate-500">{ev.campus}</span>
                    </div>
                    <h4 className="text-sm font-black text-[#102D50]">{ev.title}</h4>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#1769AA]" />
                        {ev.startTime} – {ev.endTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#B83232]" />
                        {ev.venue}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={`/api/public/events/${encodeURIComponent(ev.slug)}/ics`}
                      download={`${ev.slug}.ics`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 hover:border-[#102D50] px-3 py-2 text-xs font-bold text-[#102D50]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.ICS</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(ev.slug)}
                      className="rounded-xl border border-slate-300 hover:border-[#102D50] px-3 py-2 text-xs font-bold text-[#102D50] cursor-pointer"
                    >
                      Details
                    </button>
                    {ev.isRegistrationOpen && (
                      <button
                        type="button"
                        onClick={() => onRegisterEvent(ev.id)}
                        className="rounded-xl bg-[#B83232] hover:bg-[#952424] text-white px-3.5 py-2 text-xs font-bold cursor-pointer"
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

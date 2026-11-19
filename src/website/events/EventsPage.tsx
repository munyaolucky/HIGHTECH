import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Globe,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Video,
} from "lucide-react";
import { publicEventsApi, type PublicEventSummary } from "./eventsApi";
import { mapEventBannerPath } from "./eventBannerKeys";

interface EventsPageProps {
  initialFilter?: {
    dateFilter?: string;
    category?: string;
    mode?: string;
  };
  onSelectEvent: (slug: string) => void;
  onRegisterEvent: (eventId: string) => void;
  onLookupTicket?: (registrationId: string, token: string) => void;
  onOpenCalendar?: () => void;
  onOpenVerifyTicket?: () => void;
  resolveBannerUrl?: (url?: string | null, category?: string) => string | null;
}

const CATEGORIES = [
  "ALL",
  "Academic Summit",
  "Conference",
  "Workshop & Training",
  "Seminar",
  "Open Day",
  "Graduation",
  "Career Fair",
  "Competition",
  "Hackathon",
  "Webinar",
  "Alumni Event",
];

function formatDateReadable(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateBadgeParts(dateStr: string): { month: string; day: string } {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return { month: "EVT", day: "--" };
  return {
    month: parsed.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(parsed.getDate()).padStart(2, "0"),
  };
}

export default function EventsPage({
  initialFilter,
  onSelectEvent,
  onRegisterEvent,
  onLookupTicket,
  onOpenCalendar,
  onOpenVerifyTicket,
  resolveBannerUrl,
}: EventsPageProps) {
  const resolveBanner = (url?: string | null, category?: string) =>
    resolveBannerUrl ? resolveBannerUrl(url, category) : mapEventBannerPath(url, category);
  const [events, setEvents] = useState<PublicEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialFilter?.category || "ALL");
  const [dateFilter, setDateFilter] = useState(initialFilter?.dateFilter || "ALL");
  const [modeFilter, setModeFilter] = useState(initialFilter?.mode || "ALL");
  const [feeFilter, setFeeFilter] = useState("ALL");

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupRegId, setLookupRegId] = useState("");
  const [lookupToken, setLookupToken] = useState("");

  useEffect(() => {
    if (initialFilter?.category) setCategory(initialFilter.category);
    if (initialFilter?.dateFilter) setDateFilter(initialFilter.dateFilter);
    if (initialFilter?.mode) setModeFilter(initialFilter.mode);
  }, [initialFilter?.category, initialFilter?.dateFilter, initialFilter?.mode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    publicEventsApi
      .list()
      .then((rows) => {
        if (!cancelled) {
          setEvents(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load college events.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredEvent = useMemo(
    () => events.find((e) => e.featured && !e.isPast && e.status !== "CANCELLED") ?? events[0],
    [events]
  );

  const todayEvents = useMemo(
    () => events.filter((e) => e.isToday && e.status !== "CANCELLED"),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (q) {
        const hay = `${ev.title} ${ev.shortDescription} ${ev.venue} ${ev.organisingDepartmentName} ${ev.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category !== "ALL" && ev.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      if (modeFilter !== "ALL" && ev.mode !== modeFilter) {
        return false;
      }
      if (dateFilter === "TODAY" && !ev.isToday) return false;
      if (dateFilter === "UPCOMING" && (ev.isPast || ev.status === "COMPLETED")) return false;
      if (dateFilter === "PAST" && !ev.isPast && ev.status !== "COMPLETED") return false;
      if (feeFilter === "FREE" && ev.isPaid) return false;
      if (feeFilter === "PAID" && !ev.isPaid) return false;
      return true;
    });
  }, [events, search, category, modeFilter, dateFilter, feeFilter]);

  const clearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setDateFilter("ALL");
    setModeFilter("ALL");
    setFeeFilter("ALL");
  };

  const featuredBannerSrc = featuredEvent
    ? resolveBanner(featuredEvent.bannerImageUrl, featuredEvent.category)
    : null;

  return (
    <div className="bg-[#F4F7FB] min-h-screen pb-16">
      {/* Institutional Hero Header */}
      <section className="relative bg-gradient-to-br from-[#102D50] via-[#153e6f] to-[#0b203a] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-bold tracking-wide text-[#F5EBDD]">
                <Calendar className="w-4 h-4 text-[#ffc928]" />
                <span>HI-TECH College Academic &amp; Public Calendar</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                College Events, Summits &amp; Online Registration
              </h1>
              <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
                Explore upcoming technology summits, hands-on engineering workshops, open days,
                career clinics, and live KNEC/CDACC webinars. Reserve your seat online and receive an
                instant QR digital pass.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDateFilter("UPCOMING")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#B83232] hover:bg-[#9c2525] text-white px-5 py-3 text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <span>Browse Upcoming Events</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {onOpenCalendar && (
                  <button
                    type="button"
                    onClick={onOpenCalendar}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white px-4 py-3 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <CalendarDays className="w-4 h-4 text-[#ffc928]" />
                    <span>Events Calendar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLookupOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white px-4 py-3 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-[#ffc928]" />
                  <span>Retrieve My Ticket</span>
                </button>
                {onOpenVerifyTicket && (
                  <button
                    type="button"
                    onClick={onOpenVerifyTicket}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white px-4 py-3 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Verify Ticket / Certificate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Featured Event Spotlight Card */}
            {featuredEvent && (
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-white text-[#102D50] shadow-xl border border-slate-200 overflow-hidden">
                  <div className="relative h-44 bg-[#102D50]">
                    {featuredBannerSrc ? (
                      <img
                        src={featuredBannerSrc}
                        alt={featuredEvent.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#102D50]/90 via-[#102D50]/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#B83232] text-white px-2.5 py-1 text-[11px] font-bold">
                        <Sparkles className="w-3 h-3" />
                        Featured Event
                      </span>
                      <span className="rounded-lg bg-white/95 text-[#102D50] px-2.5 py-1 text-[11px] font-bold">
                        {featuredEvent.isPaid
                          ? `${featuredEvent.feeCurrency} ${featuredEvent.feeAmount.toLocaleString()}`
                          : "Free Entry"}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#ffc928]">
                        {featuredEvent.category}
                      </p>
                      <h2 className="text-lg font-black leading-snug line-clamp-2">
                        {featuredEvent.title}
                      </h2>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#1769AA] shrink-0" />
                        <span>{formatDateReadable(featuredEvent.eventDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <Users className="w-3.5 h-3.5 text-[#1769AA] shrink-0" />
                        <span>{featuredEvent.availableSeats} seats left</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#B83232] shrink-0" />
                        <span className="truncate">{featuredEvent.venue}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectEvent(featuredEvent.slug)}
                        className="flex-1 rounded-xl border border-slate-200 hover:border-[#1769AA] px-3 py-2 text-xs font-bold text-[#102D50] transition-colors cursor-pointer"
                      >
                        Event Details
                      </button>
                      {featuredEvent.isRegistrationOpen && (
                        <button
                          type="button"
                          onClick={() => onRegisterEvent(featuredEvent.id)}
                          className="flex-1 rounded-xl bg-[#1769AA] hover:bg-[#102D50] text-white px-3 py-2 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Register Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 space-y-8">
        {/* Optional Ticket Retrieval Bar */}
        {lookupOpen && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-black text-[#102D50] mb-2 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#B83232]" />
              <span>Retrieve Saved Event Registration &amp; QR Pass</span>
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              Enter your Registration Number (e.g. <span className="font-mono">HTE-EVT-2026-0001</span>)
              and your Ticket Access Token to view or cancel your pass.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (lookupRegId.trim() && lookupToken.trim()) {
                  onLookupTicket?.(lookupRegId.trim(), lookupToken.trim());
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                required
                value={lookupRegId}
                onChange={(e) => setLookupRegId(e.target.value)}
                placeholder="Registration No (e.g. HTE-EVT-2026-0001)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              />
              <input
                type="text"
                required
                value={lookupToken}
                onChange={(e) => setLookupToken(e.target.value)}
                placeholder="Ticket Access Token (HTE-TKT-...)"
                className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer"
              >
                Open My Digital Ticket
              </button>
            </form>
          </section>
        )}

        {/* Search & Filter Panel */}
        <section
          aria-label="Filter college events"
          className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, department, venue..."
                aria-label="Search events"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-[#102D50] focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Event Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by delivery mode"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              >
                <option value="ALL">All Attendance Modes</option>
                <option value="PHYSICAL">On-Campus (Physical)</option>
                <option value="ONLINE">Online / Webinar</option>
                <option value="HYBRID">Hybrid (Campus + Live Stream)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by entry fee"
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              >
                <option value="ALL">Free &amp; Paid</option>
                <option value="FREE">Free Only</option>
                <option value="PAID">Paid Workshops</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Timeframe:
              </span>
              {[
                { key: "ALL", label: "All Dates" },
                { key: "TODAY", label: `Happening Today (${todayEvents.length})` },
                { key: "UPCOMING", label: "Upcoming" },
                { key: "PAST", label: "Past Archive" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDateFilter(tab.key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    dateFilter === tab.key
                      ? "bg-[#102D50] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
              <span>
                Showing <strong className="text-[#102D50]">{filteredEvents.length}</strong> event
                {filteredEvents.length === 1 ? "" : "s"}
              </span>
              {(search ||
                category !== "ALL" ||
                modeFilter !== "ALL" ||
                dateFilter !== "ALL" ||
                feeFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[#B83232] font-bold hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Happening Today Strip */}
        {todayEvents.length > 0 && dateFilter === "ALL" && (
          <section className="rounded-2xl bg-[#F5EBDD] border border-[#e3d2bc] p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B83232]" />
                <h2 className="text-base font-black text-[#102D50]">
                  Happening Today on Campus &amp; Online
                </h2>
              </div>
              <span className="text-xs font-bold text-[#102D50] tabular-nums">
                {todayEvents.length} Live Session{todayEvents.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="inline-block rounded-lg bg-red-50 text-[#B83232] px-2 py-0.5 text-[11px] font-extrabold">
                      LIVE TODAY · {ev.startTime} – {ev.endTime}
                    </span>
                    <h3 className="text-sm font-black text-[#102D50]">{ev.title}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1769AA] shrink-0" />
                      <span>{ev.venue}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectEvent(ev.slug)}
                      className="rounded-xl border border-slate-200 hover:border-[#1769AA] px-3 py-2 text-xs font-bold text-[#102D50] cursor-pointer"
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
          </section>
        )}

        {/* Loading / Error / Grid */}
        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-600">
            Loading HI-TECH College events calendar...
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center text-sm text-red-800">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="text-lg font-bold text-[#102D50]">No Matching Events Found</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Try clearing your search term or selecting another category or date filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl bg-[#102D50] text-white px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Show All Published Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const badge = getDateBadgeParts(ev.eventDate);
              return (
                <article
                  key={ev.id}
                  className="group rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                >
                  {/* Card Visual Banner */}
                  <div className="relative h-44 bg-[#102D50] overflow-hidden">
                    {(() => {
                      const cardBanner = resolveBanner(ev.bannerImageUrl, ev.category);
                      return cardBanner ? (
                        <img
                          src={cardBanner}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#102D50] to-[#1769AA] flex items-center justify-center text-white/30">
                          <Calendar className="w-16 h-16" />
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                    {/* Date Box */}
                    <div className="absolute top-3 left-3 w-12 rounded-xl bg-white text-center shadow-md overflow-hidden">
                      <div className="bg-[#B83232] text-white text-[10px] font-black py-0.5 tracking-wider">
                        {badge.month}
                      </div>
                      <div className="text-base font-black text-[#102D50] py-1 tabular-nums">
                        {badge.day}
                      </div>
                    </div>

                    {/* Top Right Mode & Fee Badges */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#102D50]/90 text-white px-2.5 py-1 text-[11px] font-bold">
                        {ev.mode === "ONLINE" ? (
                          <Video className="w-3 h-3 text-[#ffc928]" />
                        ) : ev.mode === "HYBRID" ? (
                          <Globe className="w-3 h-3 text-[#ffc928]" />
                        ) : (
                          <MapPin className="w-3 h-3 text-[#ffc928]" />
                        )}
                        {ev.mode}
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                          ev.isPaid
                            ? "bg-amber-400 text-[#102D50]"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {ev.isPaid ? `${ev.feeCurrency} ${ev.feeAmount.toLocaleString()}` : "Free"}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white font-semibold">
                      <span className="rounded-lg bg-black/45 px-2 py-0.5">{ev.category}</span>
                      {ev.status === "COMPLETED" || ev.isPast ? (
                        <span className="rounded-lg bg-slate-800/90 px-2 py-0.5">Completed</span>
                      ) : ev.isToday ? (
                        <span className="rounded-lg bg-[#B83232] px-2 py-0.5">Today</span>
                      ) : ev.availableSeats === 0 ? (
                        <span className="rounded-lg bg-amber-600 px-2 py-0.5">
                          {ev.allowWaitlist ? "Waitlist Open" : "Full"}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-emerald-700/90 px-2 py-0.5 tabular-nums">
                          {ev.availableSeats} seats left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="text-[11px] font-bold text-[#1769AA] uppercase tracking-wide">
                        {ev.organisingDepartmentName}
                      </div>
                      <h3 className="text-base font-black text-[#102D50] leading-snug line-clamp-2">
                        <a
                          href={`/events/${ev.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectEvent(ev.slug);
                          }}
                          className="hover:text-[#1769AA] transition-colors"
                        >
                          {ev.title}
                        </a>
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {ev.shortDescription}
                      </p>

                      <div className="pt-1 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#1769AA] shrink-0" />
                          <span>
                            {formatDateReadable(ev.eventDate)} · {ev.startTime} – {ev.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#B83232] shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {ev.registeredCount} / {ev.capacity} registered
                            {ev.requiresApproval ? " · Approval required" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectEvent(ev.slug)}
                        className="flex-1 rounded-xl border border-slate-300 hover:border-[#102D50] px-3 py-2.5 text-xs font-bold text-[#102D50] transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                      {ev.isRegistrationOpen ? (
                        <button
                          type="button"
                          onClick={() => onRegisterEvent(ev.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#B83232] text-white px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <span>
                            {ev.availableSeats === 0 && ev.allowWaitlist
                              ? "Join Waitlist"
                              : "Register Now"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 text-slate-500 px-3 py-2.5 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {ev.status === "COMPLETED" || ev.isPast ? "Past Event" : "Closed"}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

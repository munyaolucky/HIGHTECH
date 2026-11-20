import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Ticket,
  Users,
  Video,
} from "lucide-react";
import {
  publicEventsApi,
  type EventScheduleItemRecord,
  type EventSpeakerRecord,
  type PublicEventSummary,
} from "./eventsApi";
import { mapEventBannerPath } from "./eventBannerKeys";

export interface GraduationPageProps {
  onBackToEvents: () => void;
  onRegisterEvent: (eventId: string) => void;
  onOpenCalendar: () => void;
  onOpenVerifyTicket: () => void;
  onOpenNews: () => void;
  resolveBannerUrl?: (url?: string | null, category?: string) => string | null;
}

const CLEARANCE_STEPS = [
  {
    step: "01",
    title: "Academic Registry Clearance",
    detail:
      "Verify that all core units, KNEC/CDACC/KASNEB modules, and industrial attachment logbooks are signed off.",
  },
  {
    step: "02",
    title: "Finance & Gown Clearance",
    detail:
      "Confirm zero semester fee balance and complete graduation & refundable academic regalia deposit in Student Portal.",
  },
  {
    step: "03",
    title: "Library & Labs Sign-Off",
    detail:
      "Return all borrowed textbooks, workshop tools, and access badges ahead of the graduation rehearsal week.",
  },
  {
    step: "04",
    title: "Graduand RSVP & Guest Gate Passes",
    detail:
      "Submit your official attendance RSVP to generate QR entry passes for yourself and two invited guests.",
  },
];

export default function GraduationPage({
  onBackToEvents,
  onRegisterEvent,
  onOpenCalendar,
  onOpenVerifyTicket,
  onOpenNews,
  resolveBannerUrl,
}: GraduationPageProps) {
  const [event, setEvent] = useState<PublicEventSummary | null>(null);
  const [schedules, setSchedules] = useState<EventScheduleItemRecord[]>([]);
  const [speakers, setSpeakers] = useState<EventSpeakerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    publicEventsApi
      .getDetail("annual-graduation-ceremony-2026")
      .then((detail) => {
        if (!active) return;
        setEvent(detail);
        setSchedules(detail.schedules);
        setSpeakers(detail.speakers);
      })
      .catch(() => {
        // Fallback to searching Graduation category if slug changed in CMS
        publicEventsApi
          .list({ category: "Graduation" })
          .then((rows) => {
            if (active && rows.length > 0) {
              setEvent(rows[0]);
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const heroBanner = resolveBannerUrl
    ? resolveBannerUrl(event?.bannerImageUrl || "local:graduation", "Graduation")
    : mapEventBannerPath(event?.bannerImageUrl || "local:graduation", "Graduation");
  const ceremonyTitle =
    event?.title || "14th Annual Diploma & Certificate Graduation Ceremony";
  const ceremonyDate = event?.eventDate || "Upcoming Academic Congregation";
  const ceremonyVenue =
    event?.venue || "Nairobi Main Campus — Convocation Pavilion";

  return (
    <div className="min-h-screen bg-[#F7F3ED] text-slate-800 pb-16">
      {/* Top Institutional Convocation Hero */}
      <section className="relative bg-[#102D50] text-white border-b-4 border-[#B83232] overflow-hidden">
        {heroBanner && (
          <img
            src={heroBanner}
            alt="HI-TECH College Convocation & Graduation Campus"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToEvents}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>All News &amp; Events</span>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenNews}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
              >
                <span>News &amp; Bulletins</span>
              </button>
              <button
                type="button"
                onClick={onOpenCalendar}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
              >
                <Calendar size={14} />
                <span>Events Calendar</span>
              </button>
              <button
                type="button"
                onClick={onOpenVerifyTicket}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8B44A] hover:bg-[#f2c361] text-[#102D50] px-3.5 py-1.5 text-xs font-extrabold cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>Verify Certificate / Pass</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-lg bg-[#B83232] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                <GraduationCap size={14} />
                <span>Official Academic Congregation</span>
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {ceremonyTitle}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
                {event?.fullDescription ||
                  "Celebrating graduating cohorts across ICT & Computing, Artificial Intelligence, Business Management, and Engineering & Technical Studies. Cleared graduands must confirm attendance to reserve academic regalia and guest gate passes."}
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-xs sm:text-sm font-medium text-blue-100">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={15} className="text-[#E8B44A]" />
                  <span className="font-mono">{ceremonyDate}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} className="text-[#E8B44A]" />
                  <span>
                    {event?.startTime || "08:00 AM"} – {event?.endTime || "01:30 PM"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-[#E8B44A]" />
                  <span>{ceremonyVenue}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {event && (
                  <>
                    <button
                      type="button"
                      onClick={() => onRegisterEvent(event.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#B83232] hover:bg-red-700 text-white px-5 py-3 text-sm font-extrabold shadow-lg transition cursor-pointer"
                    >
                      <Ticket size={16} />
                      <span>Graduand RSVP &amp; Regalia Pass</span>
                      <ArrowRight size={15} />
                    </button>
                    <a
                      href={`/api/public/events/${encodeURIComponent(event.slug)}/ics`}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-3 text-xs font-bold transition"
                    >
                      <Download size={15} />
                      <span>Add Ceremony (.ICS)</span>
                    </a>
                    {event.meetingUrl && (
                      <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/25 hover:bg-white/10 text-white px-4 py-3 text-xs font-bold transition"
                      >
                        <Video size={15} />
                        <span>Ceremony Livestream</span>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 space-y-3 text-xs">
              <h2 className="text-sm font-extrabold text-[#E8B44A] uppercase tracking-wider">
                Convocation Logistics
              </h2>
              <div className="space-y-2 text-slate-100">
                <p>
                  <strong className="block text-white">Eligibility</strong>
                  {event?.targetAudience ||
                    "Cleared Graduands, Parents & Invited Stakeholders"}
                </p>
                <p>
                  <strong className="block text-white">Verification Requirement</strong>
                  {event?.requirements ||
                    "Cleared graduands must enter their HCA/STU registration number for regalia allocation."}
                </p>
                <p>
                  <strong className="block text-white">Capacity &amp; Passes</strong>
                  {loading
                    ? "Loading live capacity..."
                    : event
                    ? `${event.registeredCount} / ${event.capacity} seats confirmed (${event.availableSeats} remaining)`
                    : "500 Convocation Pavilion seats"}
                </p>
                <p>
                  <strong className="block text-white">Registry Contact</strong>
                  {event?.contactEmail || "graduation@hitech.ac.ke"} ·{" "}
                  {event?.contactPhone || "+254 700 100 205"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        {/* 4-Step Graduation Clearance & Regalia Checklist */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-[#102D50]">
                Graduation Clearance &amp; Regalia Checklist
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                All candidates must complete departmental clearance prior to gown collection and rehearsal.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CLEARANCE_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-[#B83232]">
                    STEP {item.step}
                  </span>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-extrabold text-[#102D50]">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Order of Ceremony & Academic Speakers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-[#102D50] flex items-center gap-2">
              <Clock size={18} className="text-[#1769AA]" />
              <span>Order of Ceremony &amp; Academic Procession</span>
            </h2>
            {schedules.length === 0 ? (
              <div className="space-y-2.5 text-xs">
                {[
                  {
                    time: "08:00 AM – 09:00 AM",
                    title: "Graduands Robing, Guest Arrival & Gate Pass Check-In",
                    loc: "Convocation Pavilion",
                  },
                  {
                    time: "09:15 AM – 10:15 AM",
                    title: "Academic Procession & Principal's Convocation Address",
                    loc: "Main Dais",
                  },
                  {
                    time: "10:15 AM – 12:30 PM",
                    title: "Conferment of Diplomas, Certificates & Excellence Awards",
                    loc: "Convocation Pavilion",
                  },
                  {
                    time: "12:30 PM – 01:30 PM",
                    title: "Alumni Induction, Photography & Light Refreshments",
                    loc: "Central Quadrangle",
                  },
                ].map((slot) => (
                  <div
                    key={slot.time}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-mono font-bold text-[#1769AA]">{slot.time}</p>
                      <p className="font-bold text-[#102D50] text-sm">{slot.title}</p>
                    </div>
                    <span className="text-slate-500 font-semibold">{slot.loc}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {schedules.map((sc) => (
                  <div
                    key={sc.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-mono font-bold text-[#1769AA]">{sc.timeRange}</p>
                      <p className="font-bold text-[#102D50] text-sm">{sc.title}</p>
                      {sc.speakerName && (
                        <p className="text-slate-600 mt-0.5">{sc.speakerName}</p>
                      )}
                    </div>
                    <span className="text-slate-500 font-semibold">{sc.location}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-[#102D50] flex items-center gap-2">
              <Award size={18} className="text-[#B83232]" />
              <span>Presiding Officers &amp; Speakers</span>
            </h2>
            {speakers.length === 0 ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-bold text-sm text-[#102D50]">Dr. Samuel Karanja</p>
                  <p className="text-[#1769AA] font-semibold">
                    College Principal · Presiding Officer
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-bold text-sm text-[#102D50]">H. Oduor</p>
                  <p className="text-[#1769AA] font-semibold">
                    Academic Registrar · Presentation of Graduands
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {speakers.map((sp) => (
                  <div
                    key={sp.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm text-[#102D50]">{sp.name}</p>
                      <span className="rounded-lg bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold">
                        {sp.speakerRole}
                      </span>
                    </div>
                    <p className="text-[#1769AA] font-semibold">
                      {sp.roleTitle} · {sp.organization}
                    </p>
                    {sp.bio && <p className="text-slate-600">{sp.bio}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2 text-xs">
              <p className="font-bold text-[#102D50] flex items-center gap-1.5">
                <Users size={15} className="text-[#1769AA]" />
                <span>Need Transcripts or Certificate Verification?</span>
              </p>
              <p className="text-slate-600">
                Employers and graduates can verify issued graduation passes and certificates in real time.
              </p>
              <button
                type="button"
                onClick={onOpenVerifyTicket}
                className="inline-flex items-center gap-1 font-extrabold text-[#1769AA] hover:underline cursor-pointer"
              >
                <span>Open Public Verification Desk</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

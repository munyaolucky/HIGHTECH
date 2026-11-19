import React, { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Globe,
  Info,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  Star,
  UserCheck,
  Video,
} from "lucide-react";
import { publicEventsApi, type PublicEventDetail } from "./eventsApi";
import { mapEventBannerPath } from "./eventBannerKeys";

interface EventDetailPageProps {
  slug: string;
  onBackToEvents: () => void;
  onRegisterEvent: (eventId: string) => void;
  resolveBannerUrl?: (url?: string | null, category?: string) => string | null;
}

function formatReadableDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDeadline(isoStr: string): string {
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return isoStr;
  return parsed.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetailPage({
  slug,
  onBackToEvents,
  onRegisterEvent,
  resolveBannerUrl,
}: EventDetailPageProps) {
  const resolveBanner = (url?: string | null, category?: string) =>
    resolveBannerUrl ? resolveBannerUrl(url, category) : mapEventBannerPath(url, category);

  const [event, setEvent] = useState<PublicEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Feedback form state
  const [fbName, setFbName] = useState("");
  const [fbRegNo, setFbRegNo] = useState("");
  const [fbAnonymous, setFbAnonymous] = useState(false);
  const [fbOverall, setFbOverall] = useState(5);
  const [fbSpeaker, setFbSpeaker] = useState(5);
  const [fbOrg, setFbOrg] = useState(5);
  const [fbVenue, setFbVenue] = useState(5);
  const [fbNps, setFbNps] = useState(9);
  const [fbComments, setFbComments] = useState("");
  const [fbTopic, setFbTopic] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbMessage, setFbMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    publicEventsApi
      .getDetail(slug)
      .then((detail) => {
        if (!cancelled) setEvent(detail);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load event details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleCopyShareLink = async () => {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setFbSubmitting(true);
    setFbMessage(null);
    try {
      await publicEventsApi.submitFeedback(event.slug, {
        respondentName: fbAnonymous ? undefined : fbName,
        registrationNumber: fbRegNo || undefined,
        isAnonymous: fbAnonymous,
        overallRating: fbOverall,
        speakerRating: fbSpeaker,
        organisationRating: fbOrg,
        venueRating: fbVenue,
        recommendNps: fbNps,
        comments: fbComments,
        futureTopicInterest: fbTopic,
      });
      setFbMessage({
        ok: true,
        text: "Thank you for rating this event! Your evaluation has been recorded.",
      });
      setFbComments("");
      setFbTopic("");
      const updated = await publicEventsApi.getDetail(event.slug);
      setEvent(updated);
    } catch (err) {
      setFbMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Unable to submit feedback.",
      });
    } finally {
      setFbSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Loading event details...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-black text-[#102D50]">Event Unavailable</h1>
        <p className="text-sm text-slate-600">{error || "The requested event could not be found."}</p>
        <button
          type="button"
          onClick={onBackToEvents}
          className="inline-flex items-center gap-2 rounded-xl bg-[#102D50] text-white px-5 py-2.5 text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Events
        </button>
      </div>
    );
  }

  const occupancyPct = Math.min(100, Math.round((event.registeredCount / Math.max(1, event.capacity)) * 100));
  const bannerSrc = resolveBanner(event.bannerImageUrl, event.category);

  return (
    <div className="bg-[#F4F7FB] min-h-screen pb-16">
      {/* Top Breadcrumb + Hero Banner */}
      <div className="bg-[#102D50] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={onBackToEvents}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events Calendar</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/public/events/${encodeURIComponent(event.slug)}/ics`}
                download={`${event.slug}.ics`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#ffc928]" />
                <span>Add to Calendar (.ics)</span>
              </a>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Link Copied" : "Share Event Link"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#B83232] px-3 py-1 text-xs font-bold">
                  {event.category}
                </span>
                <span className="rounded-lg bg-white/15 px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5">
                  {event.mode === "ONLINE" ? (
                    <Video className="w-3.5 h-3.5 text-[#ffc928]" />
                  ) : event.mode === "HYBRID" ? (
                    <Globe className="w-3.5 h-3.5 text-[#ffc928]" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-[#ffc928]" />
                  )}
                  {event.mode}
                </span>
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    event.isPaid ? "bg-amber-400 text-[#102D50]" : "bg-emerald-600 text-white"
                  }`}
                >
                  {event.isPaid
                    ? `Registration Fee: ${event.feeCurrency} ${event.feeAmount.toLocaleString()}`
                    : "Free Admission"}
                </span>
                {event.status === "CANCELLED" && (
                  <span className="rounded-lg bg-red-600 text-white px-3 py-1 text-xs font-black">
                    CANCELLED
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                {event.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {event.shortDescription}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-100">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#ffc928] shrink-0" />
                  <span>{formatReadableDate(event.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#ffc928] shrink-0" />
                  <span>
                    {event.startTime} – {event.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#ffc928] shrink-0" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#ffc928] shrink-0" />
                  <span>{event.organisingDepartmentName}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-white/20 bg-slate-900 shadow-lg aspect-[16/10]">
                {bannerSrc ? (
                  <img
                    src={bannerSrc}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1769AA] to-[#102D50]">
                    <Calendar className="w-16 h-16 text-white/40" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Main Detail Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Overview */}
          <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-[#102D50]">About This Event</h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {event.fullDescription}
            </div>
            {(event.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-[#F4F7FB] border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-[#102D50]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Programme / Schedule */}
          {event.schedules.length > 0 && (
            <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-[#102D50]">Programme &amp; Schedule</h2>
              <div className="divide-y divide-slate-100">
                {event.schedules.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-3 sm:gap-5">
                    <div className="sm:w-44 shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5EBDD] text-[#102D50] px-2.5 py-1 text-xs font-bold tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-[#B83232]" />
                        {item.timeRange}
                      </span>
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-sm font-bold text-[#102D50]">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500 pt-0.5">
                        {item.speakerName && <span>Lead: {item.speakerName}</span>}
                        {item.location && <span>Room: {item.location}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Speakers & Guests */}
          {event.speakers.length > 0 && (
            <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-[#102D50]">Featured Speakers &amp; Facilitators</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-start gap-3.5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#102D50] text-white flex items-center justify-center font-black text-sm shrink-0">
                      {speaker.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#102D50]">{speaker.name}</h3>
                      <p className="text-xs font-semibold text-[#1769AA]">
                        {speaker.roleTitle} · {speaker.organization}
                      </p>
                      {speaker.bio && <p className="text-xs text-slate-600 leading-relaxed">{speaker.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Media Showcase (Consent Verified Public Assets) */}
          {(event.publicMedia || []).length > 0 && (
            <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-[#102D50]">Event Media &amp; Brochures</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.publicMedia.map((m) => {
                  const mediaSrc = resolveBanner(m.url, event.category);
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50"
                    >
                      {mediaSrc && m.mediaType === "PHOTO" && (
                        <img
                          src={mediaSrc}
                          alt={m.altText || m.title}
                          className="w-full h-36 object-cover"
                        />
                      )}
                      <div className="p-3.5 space-y-1 text-xs">
                        <span className="text-[10px] font-extrabold uppercase text-[#1769AA]">
                          {m.mediaType}
                        </span>
                        <h3 className="font-bold text-[#102D50]">{m.title}</h3>
                        {m.caption && <p className="text-slate-600">{m.caption}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Target Audience, Requirements, Accessibility & Parking */}
          <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-[#102D50] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1769AA]" />
                <span>Target Audience</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{event.targetAudience}</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-[#102D50] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#B83232]" />
                <span>Entry &amp; Preparation Requirements</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {event.requirements || "Standard HI-TECH College visitor or student identification."}
              </p>
            </div>
            {event.accessibilityInfo && (
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#102D50]">Accessibility</h3>
                <p className="text-xs text-slate-600">{event.accessibilityInfo}</p>
              </div>
            )}
            {event.parkingInfo && (
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#102D50] flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[#1769AA]" />
                  <span>Parking &amp; Arrivals</span>
                </h3>
                <p className="text-xs text-slate-600">{event.parkingInfo}</p>
              </div>
            )}
          </section>

          {/* Post-Event Feedback & Participant Rating Survey */}
          {event.feedbackEnabled && (
            <section
              id="event-feedback-section"
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-[#102D50] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#1769AA]" />
                    <span>Event Evaluation &amp; Participant Feedback</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Share feedback after attending to help HI-TECH College improve sessions.
                  </p>
                </div>
                {event.feedbackSummary && (
                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-[#F5EBDD] text-[#102D50] px-3 py-1.5 font-bold">
                      <Star className="w-3.5 h-3.5 text-[#B83232]" />
                      {event.feedbackSummary.averageRating || "—"} / 5
                    </span>
                    <span className="rounded-xl bg-slate-100 text-slate-700 px-3 py-1.5 font-bold">
                      NPS {event.feedbackSummary.npsScore} ({event.feedbackSummary.responseCount})
                    </span>
                  </div>
                )}
              </div>

              {fbMessage && (
                <div
                  role="status"
                  className={`rounded-xl border p-3.5 text-xs font-semibold ${
                    fbMessage.ok
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  {fbMessage.text}
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#102D50] mb-1">Your Name</label>
                    <input
                      type="text"
                      disabled={fbAnonymous}
                      value={fbName}
                      onChange={(e) => setFbName(e.target.value)}
                      placeholder={fbAnonymous ? "Anonymous submission" : "e.g. Amina Wanjiku"}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-[#102D50] disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#102D50] mb-1">
                      Registration Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={fbRegNo}
                      onChange={(e) => setFbRegNo(e.target.value)}
                      placeholder="HTE-EVT-2026-..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-[#102D50]"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fbAnonymous}
                    onChange={(e) => setFbAnonymous(e.target.checked)}
                  />
                  <span>Submit anonymously</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Overall (1-5)", val: fbOverall, set: setFbOverall, max: 5, min: 1 },
                    { label: "Speakers (1-5)", val: fbSpeaker, set: setFbSpeaker, max: 5, min: 1 },
                    { label: "Organisation", val: fbOrg, set: setFbOrg, max: 5, min: 1 },
                    { label: "Venue / Audio", val: fbVenue, set: setFbVenue, max: 5, min: 1 },
                    { label: "Recommend NPS (0-10)", val: fbNps, set: setFbNps, max: 10, min: 0 },
                  ].map((r) => (
                    <div key={r.label}>
                      <label className="block font-bold text-[#102D50] mb-1">{r.label}</label>
                      <input
                        type="number"
                        min={r.min}
                        max={r.max}
                        value={r.val}
                        onChange={(e) => r.set(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono tabular-nums"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <textarea
                    rows={2}
                    value={fbComments}
                    onChange={(e) => setFbComments(e.target.value)}
                    placeholder="Key highlights or suggestions for improvement..."
                    className="rounded-xl border border-slate-300 p-3 text-[#102D50]"
                  />
                  <input
                    type="text"
                    value={fbTopic}
                    onChange={(e) => setFbTopic(e.target.value)}
                    placeholder="Future workshop/seminar topic you'd love next"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-[#102D50]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={fbSubmitting}
                    className="rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-5 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    {fbSubmitting ? "Submitting..." : "Submit Event Feedback"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Right Sticky Registration & Contact Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#102D50]">Seat Availability &amp; RSVP</h2>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  event.isRegistrationOpen
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {event.isRegistrationOpen ? "Registration Open" : "Closed"}
              </span>
            </div>

            <div className="space-y-2 tabular-nums">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Registered: {event.registeredCount}</span>
                <span>Capacity: {event.capacity} ({occupancyPct}%)</span>
              </div>
              <progress
                aria-label="Event seat occupancy"
                value={event.registeredCount}
                max={Math.max(1, event.capacity)}
                className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 accent-[#1769AA]"
              />
              <p className="text-xs text-slate-600">
                {event.availableSeats > 0 ? (
                  <>
                    <strong className="text-[#102D50]">{event.availableSeats}</strong> seats remaining
                  </>
                ) : event.allowWaitlist ? (
                  <span className="text-amber-700 font-semibold">
                    Capacity filled — Waitlist registrations open ({event.waitlistCount} waiting)
                  </span>
                ) : (
                  <span className="text-red-700 font-semibold">Event capacity is full</span>
                )}
              </p>
            </div>

            <div className="rounded-xl bg-[#F4F7FB] border border-slate-200 p-3.5 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Registration Deadline:</span>
                <span className="font-bold text-[#102D50] text-right">
                  {formatDeadline(event.registrationDeadline)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Fee:</span>
                <span className="font-bold text-[#102D50]">
                  {event.isPaid
                    ? `${event.feeCurrency} ${event.feeAmount.toLocaleString()}`
                    : "Free"}
                </span>
              </div>
              {event.isPaid && event.studentFeeAmount > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Student Rate:</span>
                  <span className="font-bold text-[#1769AA]">
                    {event.feeCurrency} {event.studentFeeAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Organizer Approval:</span>
                <span className="font-bold text-[#102D50]">
                  {event.requiresApproval ? "Required" : "Instant Ticket"}
                </span>
              </div>
              {event.certificateEnabled && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Certificate:</span>
                  <span className="font-bold text-emerald-700">{event.certificateType}</span>
                </div>
              )}
              {event.audienceRestriction !== "PUBLIC" && (
                <div className="flex items-start gap-2 pt-1 text-amber-800 bg-amber-50 rounded-lg p-2 border border-amber-200">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Restricted Access:{" "}
                    <strong>{event.audienceRestriction.replace("_", " ")}</strong>
                  </span>
                </div>
              )}
            </div>

            {event.isRegistrationOpen ? (
              <button
                type="button"
                onClick={() => onRegisterEvent(event.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#B83232] hover:bg-[#952424] text-white px-5 py-3.5 text-sm font-black shadow-sm transition-colors cursor-pointer"
              >
                <span>
                  {event.availableSeats === 0 && event.allowWaitlist
                    ? "Join Event Waitlist"
                    : "Register for This Event"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-3.5 text-xs text-slate-600 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  {event.registrationClosedReason || "Registration is no longer open for this event."}
                </span>
              </div>
            )}
          </div>

          {/* Organizer Contact Card */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-black text-[#102D50]">Official Event Contact</h3>
            <p className="text-xs text-slate-600">
              Coordinated by <strong className="text-[#102D50]">{event.organizerName}</strong> (
              {event.organisingDepartmentName}).
            </p>
            <div className="space-y-2 text-xs">
              <a
                href={`mailto:${event.contactEmail}`}
                className="flex items-center gap-2 text-[#1769AA] hover:underline"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{event.contactEmail}</span>
              </a>
              {event.showContactPhonePublicly && (
                <a
                  href={`tel:${event.contactPhone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-2 text-[#102D50] hover:underline tabular-nums"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B83232] shrink-0" />
                  <span>{event.contactPhone}</span>
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

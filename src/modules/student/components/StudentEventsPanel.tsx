import React, { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  MessageSquare,
  QrCode,
  RefreshCw,
  Star,
  Ticket,
} from 'lucide-react';
import {
  publicEventsApi,
  type PublicEventSummary,
  type StudentPortalPassItem,
} from '../../../website/events/eventsApi';

interface StudentEventsPanelProps {
  studentName: string;
  registrationNumber: string;
  email?: string;
  phone?: string;
  compact?: boolean;
  onNotify?: (type: 'ok' | 'err', msg: string) => void;
}

export default function StudentEventsPanel({
  studentName,
  registrationNumber,
  email = 'amina.wanjiku@student.hitech.ac.ke',
  phone = '+254712345001',
  compact = false,
  onNotify,
}: StudentEventsPanelProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<PublicEventSummary[]>([]);
  const [myPasses, setMyPasses] = useState<StudentPortalPassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [feedbackEventSlug, setFeedbackEventSlug] = useState<string | null>(null);
  const [fbRating, setFbRating] = useState(5);
  const [fbNps, setFbNps] = useState(9);
  const [fbComment, setFbComment] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicEventsApi.getStudentEventsAndPasses(registrationNumber || email);
      setUpcomingEvents(data.upcomingEvents);
      setMyPasses(data.myRegistrations);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load campus events.';
      setStatusMsg({ type: 'err', text: msg });
    } finally {
      setLoading(false);
    }
  }, [registrationNumber, email]);

  useEffect(() => {
    load();
  }, [load]);

  const handleQuickRegister = async (ev: PublicEventSummary) => {
    setRegisteringId(ev.id);
    setStatusMsg(null);
    try {
      const res = await publicEventsApi.register(ev.id, {
        fullName: studentName,
        email,
        phone,
        participantCategory: 'Student',
        organizationOrInstitution: 'HI-TECH College',
        studentOrStaffNumber: registrationNumber,
        attendanceMode: ev.mode === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
        ticketType: 'Student Ticket',
        consentAccepted: true,
      });
      const msg = `Registered! Pass ${res.registration.registrationNumber} (${res.registration.qrToken})`;
      setStatusMsg({ type: 'ok', text: msg });
      onNotify?.('ok', msg);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setStatusMsg({ type: 'err', text: msg });
      onNotify?.('err', msg);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!feedbackEventSlug) return;
    try {
      await publicEventsApi.submitFeedback(feedbackEventSlug, {
        respondentName: studentName,
        registrationNumber,
        overallRating: fbRating,
        speakerRating: fbRating,
        organisationRating: fbRating,
        venueRating: fbRating,
        recommendNps: fbNps,
        comments: fbComment,
      });
      setStatusMsg({ type: 'ok', text: 'Submitted your event feedback. Thank you!' });
      onNotify?.('ok', 'Submitted your event feedback.');
      setFeedbackEventSlug(null);
      setFbComment('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit feedback.';
      setStatusMsg({ type: 'err', text: msg });
      onNotify?.('err', msg);
    }
  };

  const registeredEventIds = new Set(
    myPasses.filter((p) => p.status !== 'CANCELLED').map((p) => p.eventId)
  );
  const earnedCertCount = myPasses.filter(
    (p) => p.certificateCode && p.certificateStatus === 'ISSUED'
  ).length;
  const checkedInCount = myPasses.filter((p) => p.checkedIn).length;

  return (
    <div className="space-y-5">
      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="font-sans text-[11px] font-semibold text-slate-500 block">
              Upcoming Campus Events
            </span>
            <strong className="text-2xl font-black text-[#102D50] dark:text-white">
              {upcomingEvents.length}
            </strong>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="font-sans text-[11px] font-semibold text-slate-500 block">
              My Active Passes
            </span>
            <strong className="text-2xl font-black text-[#1769AA] dark:text-blue-400">
              {myPasses.filter((p) => p.status !== 'CANCELLED').length}
            </strong>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="font-sans text-[11px] font-semibold text-slate-500 block">
              Sessions Attended
            </span>
            <strong className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {checkedInCount}
            </strong>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <span className="font-sans text-[11px] font-semibold text-slate-500 block">
              Event Certificates
            </span>
            <strong className="text-2xl font-black text-[#B83232] dark:text-red-400">
              {earnedCertCount}
            </strong>
          </div>
        </div>
      )}

      {statusMsg && (
        <div
          role="status"
          className={`rounded-xl border p-3.5 text-xs font-semibold ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* My Digital Event Passes & Earned Certificates */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#1769AA]" />
            <h3 className="text-sm font-black text-[#102D50] dark:text-white">
              My Digital Event Passes &amp; Certificates ({myPasses.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-xs text-slate-500">Loading your event passes...</p>
        ) : myPasses.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            You have not registered for any upcoming college events yet. Reserve a seat below!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {myPasses.map((pass) => (
              <div
                key={pass.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-[#1769AA]">
                      {pass.registrationNumber}
                    </span>
                    <h4 className="text-sm font-black text-[#102D50] dark:text-white">
                      {pass.eventTitle}
                    </h4>
                  </div>
                  <span className="rounded-lg bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                    {pass.status}
                  </span>
                </div>

                <div className="text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1769AA]" />
                    <span>
                      {pass.eventDate} · {pass.startTime} – {pass.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B83232]" />
                    <span>{pass.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[#102D50] dark:text-blue-300">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Token: {pass.qrToken}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {pass.checkedIn && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Checked In
                    </span>
                  )}
                  {pass.certificateCode && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#F5EBDD] text-[#102D50] px-2 py-1 font-mono text-[11px] font-bold">
                      <Award className="w-3.5 h-3.5 text-[#B83232]" />
                      {pass.certificateCode}
                    </span>
                  )}
                  <a
                    href={`/api/public/events/${encodeURIComponent(pass.eventSlug)}/ics`}
                    download={`${pass.eventSlug}.ics`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold"
                  >
                    <Download className="w-3 h-3" />
                    .ICS
                  </a>
                  {pass.feedbackEnabled && (
                    <button
                      type="button"
                      onClick={() => setFeedbackEventSlug(pass.eventSlug)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#102D50] text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Rate Event</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Inline Feedback Modal */}
      {feedbackEventSlug && (
        <form
          onSubmit={handleFeedbackSubmit}
          className="rounded-2xl border border-blue-200 bg-blue-50/70 dark:bg-slate-900 dark:border-slate-700 p-5 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <strong className="text-sm font-black text-[#102D50] dark:text-white flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#B83232]" />
              <span>Submit Event Evaluation</span>
            </strong>
            <button
              type="button"
              onClick={() => setFeedbackEventSlug(null)}
              className="underline text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Overall Rating (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={fbRating}
                onChange={(e) => setFbRating(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Recommend NPS (0-10)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={fbNps}
                onChange={(e) => setFbNps(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono"
              />
            </div>
          </div>
          <textarea
            rows={2}
            value={fbComment}
            onChange={(e) => setFbComment(e.target.value)}
            placeholder="Share your thoughts on this session..."
            className="w-full rounded-xl border border-slate-300 bg-white p-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-[#102D50] text-white px-4 py-2 font-bold cursor-pointer"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      )}

      {/* Discover & Register for Upcoming Events */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#B83232]" />
          <h3 className="text-sm font-black text-[#102D50] dark:text-white">
            Open College Summits, Clinics &amp; Student Workshops
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {upcomingEvents.map((ev) => {
            const alreadyReg = registeredEventIds.has(ev.id);
            return (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#1769AA]">{ev.category}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-500 tabular-nums">
                      {ev.availableSeats} seats left
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-[#102D50] dark:text-white">{ev.title}</h4>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                    {ev.shortDescription}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {ev.eventDate} · {ev.startTime} · {ev.venue}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold text-[#102D50] dark:text-white">
                    {ev.isPaid
                      ? `KES ${(ev.studentFeeAmount || ev.feeAmount).toLocaleString()}`
                      : 'Free Student Entry'}
                  </span>
                  {alreadyReg ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 text-emerald-800 px-3 py-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pass Issued
                    </span>
                  ) : ev.isRegistrationOpen ? (
                    <button
                      type="button"
                      disabled={registeringId === ev.id}
                      onClick={() => handleQuickRegister(ev)}
                      className="rounded-xl bg-[#B83232] hover:bg-[#952424] disabled:opacity-60 text-white px-3.5 py-1.5 font-bold cursor-pointer"
                    >
                      {registeringId === ev.id ? 'Issuing Pass...' : 'One-Click RSVP'}
                    </button>
                  ) : (
                    <span className="text-slate-400 font-semibold">Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

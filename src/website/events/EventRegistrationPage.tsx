import React, { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  publicEventsApi,
  saveEventTicketToken,
  type PublicEventDetail,
} from "./eventsApi";

interface EventRegistrationPageProps {
  eventId: string;
  onBackToEvent: (slug: string) => void;
  onBackToEvents: () => void;
  onRegistrationSuccess: (registrationId: string, lookupToken: string) => void;
}

const PARTICIPANT_CATEGORIES = [
  "Student",
  "Prospective Student",
  "Parent / Guardian",
  "Staff Member",
  "Alumni",
  "Industry Partner",
  "General Public",
];

export default function EventRegistrationPage({
  eventId,
  onBackToEvent,
  onBackToEvents,
  onRegistrationSuccess,
}: EventRegistrationPageProps) {
  const [event, setEvent] = useState<PublicEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [participantCategory, setParticipantCategory] = useState("Student");
  const [organizationOrInstitution, setOrganizationOrInstitution] = useState("");
  const [studentOrStaffNumber, setStudentOrStaffNumber] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<"PHYSICAL" | "ONLINE">("PHYSICAL");
  const [ticketType, setTicketType] = useState("General Admission");
  const [paymentMethod, setPaymentMethod] = useState("MPESA");
  const [paymentRef, setPaymentRef] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    publicEventsApi
      .getDetail(eventId)
      .then((detail) => {
        if (!cancelled) {
          setEvent(detail);
          if (detail.mode === "ONLINE") {
            setAttendanceMode("ONLINE");
          } else {
            setAttendanceMode("PHYSICAL");
          }
          if (detail.audienceRestriction === "STAFF_ONLY") {
            setParticipantCategory("Staff Member");
            setTicketType("Staff Ticket");
          } else if (detail.audienceRestriction === "STUDENTS_ONLY") {
            setParticipantCategory("Student");
            setTicketType("Student Ticket");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load event registration form.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmitError(null);

    try {
      setSubmitting(true);
      const res = await publicEventsApi.register(event.id, {
        fullName,
        email,
        phone,
        participantCategory,
        organizationOrInstitution,
        studentOrStaffNumber,
        attendanceMode,
        ticketType,
        paymentMethod: event.isPaid ? paymentMethod : undefined,
        paymentRef: event.isPaid ? paymentRef : undefined,
        specialRequirements,
        consentAccepted,
        invitationCode,
      });
      saveEventTicketToken(res.registration.id, res.lookupToken);
      saveEventTicketToken(res.registration.registrationNumber, res.lookupToken);
      onRegistrationSuccess(res.registration.id, res.lookupToken);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed. Please review your details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Loading event registration form...
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-black text-[#102D50]">Registration Unavailable</h1>
        <p className="text-sm text-slate-600">{loadError || "Event could not be located."}</p>
        <button
          type="button"
          onClick={onBackToEvents}
          className="rounded-xl bg-[#102D50] text-white px-5 py-2.5 text-sm font-bold cursor-pointer"
        >
          Return to Events
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7FB] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => onBackToEvent(event.slug)}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#102D50] hover:text-[#1769AA] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Details</span>
        </button>

        {/* Event Summary Strip */}
        <div className="rounded-2xl bg-[#102D50] text-white p-6 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-lg bg-[#B83232] px-2.5 py-1 text-xs font-bold">
              {event.category}
            </span>
            <span className="text-xs font-semibold text-[#F5EBDD] tabular-nums">
              {event.availableSeats > 0
                ? `${event.availableSeats} of ${event.capacity} seats available`
                : event.allowWaitlist
                ? "Event Full — Waitlist Registration Active"
                : "Capacity Full"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-slate-200">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#ffc928]" />
              {event.eventDate} · {event.startTime} – {event.endTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#ffc928]" />
              {event.venue}
            </span>
          </div>
        </div>

        {/* Form Card */}
        {!event.isRegistrationOpen ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-[#B83232] mx-auto" />
            <h2 className="text-lg font-black text-[#102D50]">Registration Closed</h2>
            <p className="text-sm text-slate-600">
              {event.registrationClosedReason || "Online registration for this event is currently closed."}
            </p>
            <button
              type="button"
              onClick={onBackToEvents}
              className="rounded-xl bg-[#102D50] text-white px-5 py-2.5 text-xs font-bold cursor-pointer"
            >
              Browse Open Events
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
          >
            <div>
              <h2 className="text-lg font-black text-[#102D50]">Participant Registration Form</h2>
              <p className="text-xs text-slate-600 mt-1">
                Complete your details below to receive your unique HI-TECH College registration number
                and digital QR event pass.
              </p>
            </div>

            {event.requiresApproval && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900">
                <strong>Approval Notice:</strong> Registrations for this event undergo organizer review.
                You will receive a provisional confirmation now and final confirmation once approved.
              </div>
            )}

            {event.availableSeats === 0 && event.allowWaitlist && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start gap-2">
                <Users className="w-4 h-4 shrink-0 mt-0.5 text-[#1769AA]" />
                <span>
                  All seats are currently reserved. Submitting this form will place you on the{" "}
                  <strong>Waitlist</strong>, and you will be notified automatically if a slot opens.
                </span>
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-800 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Full Name <span className="text-[#B83232]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Samuel Mwangi"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Email Address <span className="text-[#B83232]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Phone Number <span className="text-[#B83232]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Participant Category <span className="text-[#B83232]">*</span>
                </label>
                <select
                  value={participantCategory}
                  onChange={(e) => setParticipantCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  {PARTICIPANT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  School / Organization / Company
                </label>
                <input
                  type="text"
                  value={organizationOrInstitution}
                  onChange={(e) => setOrganizationOrInstitution(e.target.value)}
                  placeholder="e.g. HI-TECH College or Safaricom PLC"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Student or Staff Number{" "}
                  {(event.audienceRestriction === "STUDENTS_ONLY" ||
                    event.audienceRestriction === "STAFF_ONLY") && (
                    <span className="text-[#B83232]">* (Required)</span>
                  )}
                </label>
                <input
                  type="text"
                  required={
                    event.audienceRestriction === "STUDENTS_ONLY" ||
                    event.audienceRestriction === "STAFF_ONLY"
                  }
                  value={studentOrStaffNumber}
                  onChange={(e) => setStudentOrStaffNumber(e.target.value)}
                  placeholder="e.g. HCA/STU/2026/001 or HCA/STAFF/2026/001"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                />
              </div>

              {event.audienceRestriction === "INVITED_ONLY" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                    Invitation Code <span className="text-[#B83232]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder="HTE-INV-XXXX"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Preferred Attendance Mode
                </label>
                <select
                  value={attendanceMode}
                  disabled={event.mode !== "HYBRID"}
                  onChange={(e) => setAttendanceMode(e.target.value as "PHYSICAL" | "ONLINE")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#102D50] disabled:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  {event.mode !== "ONLINE" && (
                    <option value="PHYSICAL">In-Person / On-Campus Attendance</option>
                  )}
                  {event.mode !== "PHYSICAL" && (
                    <option value="ONLINE">Online / Virtual Live Attendance</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Ticket Category
                </label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  <option value="General Admission">General Admission</option>
                  <option value="Student Ticket">Student Ticket</option>
                  <option value="Staff Ticket">Staff Ticket</option>
                  <option value="Exhibitor">Exhibitor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102D50] mb-1.5">
                  Special Requirements / Accessibility Needs
                </label>
                <input
                  type="text"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Optional accessibility, seating or dietary note"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                />
              </div>

              {event.isPaid && (
                <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-xs font-black text-[#102D50]">
                      Paid Event Fee Details
                    </strong>
                    <span className="font-mono text-xs font-extrabold text-[#B83232] tabular-nums">
                      Fee Due: {event.feeCurrency}{" "}
                      {(ticketType === "Student Ticket" && event.studentFeeAmount > 0
                        ? event.studentFeeAmount
                        : event.feeAmount
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#102D50] mb-1">
                        Payment Channel
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#102D50]"
                      >
                        <option value="MPESA">Lipa na M-Pesa Paybill</option>
                        <option value="BANK_TRANSFER">College Bank Deposit / EFT</option>
                        <option value="CASH_BURSAR">Pay at Finance Bursar Desk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#102D50] mb-1">
                        Transaction Code / Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. MPESA-QJK82X or Pay at Bursar"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-[#102D50]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#F4F7FB] border border-slate-200 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1769AA]"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I confirm that the details submitted above are accurate and consent to HI-TECH
                  College processing this registration for event coordination, badge issuance, and
                  official event updates under institutional data protection standards.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected digital pass with unique QR verification</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#B83232] hover:bg-[#952424] disabled:opacity-60 text-white px-6 py-3 text-sm font-black shadow-sm transition-colors cursor-pointer"
              >
                <span>{submitting ? "Submitting Registration..." : "Confirm Registration"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

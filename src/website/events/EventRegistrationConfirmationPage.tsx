import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  KeyRound,
  MapPin,
  Printer,
  Ticket,
  XCircle,
} from "lucide-react";
import {
  getSavedEventTicketToken,
  publicEventsApi,
  saveEventTicketToken,
  type PublicRegistrationTicketView,
} from "./eventsApi";

interface EventRegistrationConfirmationPageProps {
  registrationId: string;
  initialToken?: string;
  onBackToEvents: () => void;
  onSelectEvent: (slug: string) => void;
}

export default function EventRegistrationConfirmationPage({
  registrationId,
  initialToken,
  onBackToEvents,
  onSelectEvent,
}: EventRegistrationConfirmationPageProps) {
  const [token, setToken] = useState<string>(
    () => initialToken || getSavedEventTicketToken(registrationId) || ""
  );
  const [tokenInput, setTokenInput] = useState(token);
  const [ticket, setTicket] = useState<PublicRegistrationTicketView | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  const [cancelling, setCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    publicEventsApi
      .getTicket(registrationId, token)
      .then((res) => {
        if (!cancelled) {
          setTicket(res);
          saveEventTicketToken(res.id, token);
          saveEventTicketToken(res.registrationNumber, token);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your registration pass.");
          setTicket(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [registrationId, token]);

  useEffect(() => {
    if (!ticket?.qrToken) return;
    let active = true;
    QRCode.toDataURL(ticket.qrToken, {
      width: 240,
      margin: 1,
      color: { dark: "#102D50", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // ignore QR canvas error
      });
    return () => {
      active = false;
    };
  }, [ticket?.qrToken]);

  const handleConfirmCancel = async () => {
    if (!ticket || !token) return;
    try {
      setCancelling(true);
      setError(null);
      const res = await publicEventsApi.cancelTicket(
        ticket.id,
        token,
        "Participant cancelled via digital ticket portal."
      );
      setTicket(res.ticket);
      setConfirmCancelOpen(false);
      setCancelNotice("Your event registration has been cancelled successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel registration.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Verifying your HI-TECH College event ticket...
      </div>
    );
  }

  if (!token || (!ticket && error)) {
    return (
      <div className="bg-[#F4F7FB] min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102D50] text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#102D50]">Verify Ticket Access</h1>
              <p className="text-xs text-slate-600">
                Enter the secure access token provided when you registered.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tokenInput.trim()) {
                setToken(tokenInput.trim());
              }
            }}
            className="space-y-3"
          >
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Ticket Access Token (HTE-TKT-...)"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-4 py-2.5 text-sm font-bold cursor-pointer"
              >
                Unlock Event Ticket
              </button>
              <button
                type="button"
                onClick={onBackToEvents}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 cursor-pointer"
              >
                Events
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const statusStyles: Record<string, string> = {
    CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    WAITLISTED: "bg-blue-100 text-blue-800 border-blue-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };

  const canSelfCancel =
    ticket.event.allowSelfCancel &&
    !ticket.checkedIn &&
    ["CONFIRMED", "PENDING", "WAITLISTED"].includes(ticket.status);

  return (
    <div className="bg-[#F4F7FB] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onBackToEvents}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#102D50] hover:text-[#1769AA] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All College Events</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#102D50] px-3.5 py-2 text-xs font-bold text-[#102D50] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ticket</span>
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${ticket.registrationNumber}-qr-pass.png`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-3.5 py-2 text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Pass</span>
              </a>
            )}
          </div>
        </div>

        {cancelNotice && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
            {cancelNotice}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        {/* Official Digital Ticket Card */}
        <article className="rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#102D50] to-[#1769AA] text-white p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-[#ffc928]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5EBDD]">
                  HI-TECH College Official Event Pass
                </p>
                <h1 className="text-lg sm:text-xl font-black">{ticket.event.title}</h1>
              </div>
            </div>

            <span
              className={`rounded-xl border px-3 py-1.5 text-xs font-black tracking-wide ${
                statusStyles[ticket.status] || "bg-slate-100 text-slate-800"
              }`}
            >
              {ticket.status}
            </span>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Registration Details */}
            <div className="md:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Registration Number</span>
                  <strong className="text-base font-black text-[#102D50] font-mono">
                    {ticket.registrationNumber}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Participant Name</span>
                  <strong className="text-sm font-bold text-[#102D50]">{ticket.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Email &amp; Phone</span>
                  <span className="font-semibold text-slate-700 block">{ticket.email}</span>
                  <span className="text-slate-600 tabular-nums">{ticket.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category &amp; Mode</span>
                  <span className="font-semibold text-[#102D50] block">
                    {ticket.participantCategory}
                  </span>
                  <span className="text-[#1769AA] font-bold">{ticket.attendanceMode}</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#F4F7FB] border border-slate-200 p-4 space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1769AA] shrink-0" />
                  <span className="font-semibold">{ticket.event.eventDate}</span>
                  <Clock className="w-4 h-4 text-[#1769AA] ml-2 shrink-0" />
                  <span>
                    {ticket.event.startTime} – {ticket.event.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B83232] shrink-0" />
                  <span>{ticket.event.venue}</span>
                </div>
                {ticket.event.meetingUrl && ticket.attendanceMode === "ONLINE" && (
                  <div className="flex items-center gap-2 pt-1">
                    <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
                    <a
                      href={ticket.event.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1769AA] font-bold hover:underline"
                    >
                      Join Online Event Session ({ticket.event.meetingUrl})
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {ticket.checkedIn ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Checked In ({ticket.checkedInAt?.slice(0, 16).replace("T", " ")})
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Present this QR ticket at the registration desk on arrival.
                  </span>
                )}
              </div>
            </div>

            {/* QR Code Block */}
            <div className="md:col-span-4 flex flex-col items-center justify-center rounded-2xl bg-[#F5EBDD]/50 border border-[#e5d5bf] p-4 text-center space-y-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${ticket.registrationNumber}`}
                  className="w-44 h-44 rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-44 h-44 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
              <span className="font-mono text-[11px] font-bold text-[#102D50]">
                {ticket.qrToken}
              </span>
              <span className="text-[11px] text-slate-600">
                Save Ticket Access Token: <strong className="font-mono">{token}</strong>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={() => onSelectEvent(ticket.event.slug)}
              className="text-xs font-bold text-[#1769AA] hover:underline cursor-pointer"
            >
              View Event Programme &amp; Details
            </button>

            {canSelfCancel && !confirmCancelOpen && (
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B83232] hover:underline cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel My Registration</span>
              </button>
            )}
          </div>

          {confirmCancelOpen && (
            <div className="bg-red-50 border-t border-red-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <p className="text-xs font-semibold text-red-900">
                Are you sure you want to cancel your seat for {ticket.event.title}?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancelOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Keep Seat
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="rounded-xl bg-[#B83232] hover:bg-[#952424] text-white px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

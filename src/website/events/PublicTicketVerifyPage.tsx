import React, { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  XCircle,
} from 'lucide-react';
import {
  publicEventsApi,
  type TicketOrCertVerificationResult,
} from './eventsApi';

interface PublicTicketVerifyPageProps {
  initialCode?: string;
  onBackToEvents: () => void;
  onOpenCalendar?: () => void;
}

const SAMPLE_CODES = [
  { label: 'Ticket QR', code: 'HTE-QR-SUMMIT01' },
  { label: 'Registration No', code: 'HTE-EVT-2026-0001' },
  { label: 'Certificate No', code: 'HTE-CERT-2026-0001' },
  { label: 'Cert Verify Code', code: 'VRF-9142-CYBER' },
];

export default function PublicTicketVerifyPage({
  initialCode = '',
  onBackToEvents,
  onOpenCalendar,
}: PublicTicketVerifyPageProps) {
  const [codeInput, setCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TicketOrCertVerificationResult | null>(null);

  const runVerification = async (targetCode: string) => {
    const clean = targetCode.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await publicEventsApi.verifyTicketOrCertificate(clean);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No matching HI-TECH College event ticket or certificate was found.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runVerification(codeInput);
  };

  return (
    <div className="bg-[#F4F7FB] min-h-screen pb-16">
      <section className="bg-[#102D50] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToEvents}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5EBDD] hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Events</span>
            </button>
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="text-xs font-bold text-[#ffc928] hover:underline cursor-pointer"
              >
                Open Events Calendar
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Public Event Ticket &amp; Certificate Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
            Verify authenticity of HI-TECH College QR event passes, registration numbers, and issued
            attendance or completion certificates.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-5 space-y-6">
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter HTE-QR-..., HTE-EVT-..., HTE-CERT-... or VRF-..."
                aria-label="Ticket or certificate verification code"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm font-mono text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B83232] hover:bg-[#952424] disabled:opacity-60 text-white px-6 py-3 text-sm font-black whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify Record'}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">Try verified sample code:</span>
            {SAMPLE_CODES.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => {
                  setCodeInput(s.code);
                  runVerification(s.code);
                }}
                className="rounded-lg bg-slate-100 hover:bg-[#F5EBDD] text-[#102D50] px-2.5 py-1 font-mono text-[11px] font-bold cursor-pointer"
              >
                {s.label}: {s.code}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 border border-red-200 p-5 flex items-start gap-3 text-sm text-red-900"
          >
            <XCircle className="w-5 h-5 text-[#B83232] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-black">Verification Failed</h2>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <article className="rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden">
            <div
              className={`px-6 py-5 text-white flex flex-wrap items-center justify-between gap-3 ${
                result.valid ? 'bg-emerald-700' : 'bg-[#B83232]'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.kind === 'CERTIFICATE' ? (
                  <Award className="w-7 h-7 text-[#ffc928]" />
                ) : (
                  <Ticket className="w-7 h-7 text-[#ffc928]" />
                )}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                    HI-TECH College Official {result.kind} Check
                  </p>
                  <h2 className="text-lg font-black">
                    {result.valid ? 'Authentic & Valid Record' : `Not Active (${result.status})`}
                  </h2>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-extrabold">
                {result.valid ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                {result.status}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <span className="text-slate-500 block">Holder / Recipient Name</span>
                <strong className="text-base font-black text-[#102D50]">{result.holderName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Event Title</span>
                <strong className="text-sm font-bold text-[#102D50]">{result.eventTitle}</strong>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-[#1769AA] shrink-0" />
                <span>
                  {result.eventDate} {result.eventTime ? `· ${result.eventTime}` : ''}
                </span>
              </div>
              {result.eventVenue && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-[#B83232] shrink-0" />
                  <span>{result.eventVenue}</span>
                </div>
              )}

              {result.kind === 'TICKET' ? (
                <>
                  <div className="rounded-xl bg-[#F4F7FB] border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-500 block">Registration &amp; QR Token</span>
                    <div className="font-mono font-bold text-[#102D50]">
                      {result.registrationNumber}
                    </div>
                    <div className="font-mono text-[#1769AA]">{result.qrToken}</div>
                  </div>
                  <div className="rounded-xl bg-[#F4F7FB] border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-500 block">Attendance &amp; Ticket Class</span>
                    <div className="font-bold text-[#102D50]">
                      {result.ticketType} · {result.attendanceMode}
                    </div>
                    <div className="text-slate-600">
                      {result.checkedIn
                        ? `Checked In (${result.checkedInAt?.slice(0, 16).replace('T', ' ')})`
                        : 'Pending Desk Check-In'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-[#F4F7FB] border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-500 block">Certificate Number &amp; Code</span>
                    <div className="font-mono font-bold text-[#102D50]">
                      {result.certificateNumber}
                    </div>
                    <div className="font-mono text-[#1769AA]">{result.verificationCode}</div>
                  </div>
                  <div className="rounded-xl bg-[#F4F7FB] border border-slate-200 p-3.5 space-y-1">
                    <span className="text-slate-500 block">Award Category &amp; Authority</span>
                    <div className="font-bold text-[#102D50]">{result.certificateType}</div>
                    <div className="text-slate-600">
                      Issued {result.issuedAt?.slice(0, 10)} by {result.issuedByName}
                    </div>
                    {result.revokedReason && (
                      <div className="text-[#B83232] font-bold">Reason: {result.revokedReason}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

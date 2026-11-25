import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  LogOut,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchAuthSecurityStatus,
  resendEmailVerificationRequest,
  sendEmailVerificationRequest,
  verifyEmailOtpRequest,
} from '../../auth/auth-api';
import { getUserDashboardPath } from '../../auth/auth-utils';
import { useAuth } from '../../auth/useAuth';

export function VerifyEmailPage({
  onNavigate,
  onNavigateHome,
}: {
  onNavigate: (destination: string) => void;
  onNavigateHome: () => void;
}) {
  const { user, refreshSession, signOut } = useAuth();

  const [code, setCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState(user?.email ?? '');
  const [maskedEmail, setMaskedEmail] = useState(user?.email ?? '');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function loadStatus() {
      try {
        const status = await fetchAuthSecurityStatus();
        if (!active) return;

        setRegisteredEmail(status.email);
        setMaskedEmail(status.maskedEmail || status.email);
        setCooldownSeconds(status.cooldownRemainingSeconds || 0);
        setExpiresAt(status.otpExpiresAt);

        if (status.mustChangePassword) {
          onNavigate('/portal/change-password');
          return;
        }
        if (status.emailVerified || !status.emailVerificationRequired) {
          const updatedUser = await refreshSession();
          onNavigate(getUserDashboardPath(updatedUser));
          return;
        }

        if (!status.otpExpiresAt) {
          const dispatched = await sendEmailVerificationRequest();
          if (!active) return;
          setCooldownSeconds(dispatched.cooldownSeconds ?? 60);
          setExpiresAt(dispatched.expiresAt ?? null);
          setStatusMessage(dispatched.message);
        }
      } catch {
        // Fallback cleanly to signed-in user email if status poll is skipped (e.g., SSR/tests)
      }
    }
    if (typeof window !== 'undefined' && user) {
      void loadStatus();
    }
    return () => {
      active = false;
    };
  }, [user, onNavigate, refreshSession]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    const normalized = code.replace(/\D/g, '');
    if (normalized.length !== 6) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifyEmailOtpRequest(normalized);
      setStatusMessage(result.message);
      const updatedUser = await refreshSession();
      const target =
        result.destination && result.destination.startsWith('/portal/')
          ? result.destination
          : getUserDashboardPath(updatedUser);
      onNavigate(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify email code.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldownSeconds > 0 || resending) return;
    setError('');
    setStatusMessage('');
    setResending(true);
    try {
      const result = await resendEmailVerificationRequest();
      setCooldownSeconds(result.cooldownSeconds ?? 60);
      setExpiresAt(result.expiresAt ?? null);
      setStatusMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend verification code.');
    } finally {
      setResending(false);
    }
  }

  const displayEmail = maskedEmail || registeredEmail || user?.email || 'your registered email';

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#102D50] dark:hover:text-white"
          >
            <ArrowLeft size={14} aria-hidden="true" /> College Website
          </button>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              onNavigate('/portal/login');
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-[#B83232] dark:text-red-400 hover:underline"
          >
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        </div>

        <section
          className="rounded-2xl border border-[#dce4ef] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          aria-labelledby="verify-email-heading"
        >
          <div className="bg-[#102D50] px-6 py-5 text-white border-b-4 border-[#1769AA]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5EBDD] text-[#102D50] font-black text-lg shrink-0">
                <MailCheck size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5EBDD]">
                  HI-TECH COLLEGE · Required for account activation
                </p>
                <h1 id="verify-email-heading" className="text-lg font-extrabold tracking-tight">
                  Verify your email address
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              We have sent a verification code to your registered email address. Enter the 6-digit code below to activate full portal access.
            </p>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/70 px-4 py-3 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registered email
              </p>
              <p className="text-sm font-bold text-[#102D50] dark:text-white break-all">
                {displayEmail}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
              >
                {error}
              </div>
            )}

            {statusMessage && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-start gap-2"
              >
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span>{statusMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="ve-otp-code"
                  className="block text-xs font-semibold text-[#102D50] dark:text-slate-200"
                >
                  6-digit verification code
                </label>
                <input
                  id="ve-otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={submitting}
                  required
                  placeholder="000000"
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-center font-mono text-lg font-bold tracking-[0.35em] text-[#102D50] dark:text-white focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} aria-hidden="true" />
                  {expiresAt
                    ? 'Code expires 10 minutes after issue.'
                    : 'Codes are single-use and valid for 10 minutes.'}
                </span>
                <span>Max 5 attempts</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span>{submitting ? 'Verifying email...' : 'Verify email'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Did not receive the code?
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || resending}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw size={13} aria-hidden="true" />
                <span>
                  {resending
                    ? 'Sending...'
                    : cooldownSeconds > 0
                    ? `Resend verification (${cooldownSeconds}s)`
                    : 'Resend verification'}
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default VerifyEmailPage;

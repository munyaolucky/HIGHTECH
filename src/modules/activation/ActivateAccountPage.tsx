import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';

interface ActivateAccountPageProps {
  initialToken?: string;
  onNavigateToLogin: () => void;
  onNavigateHome: () => void;
}

type ValidationState =
  | { status: 'NO_TOKEN' }
  | { status: 'CHECKING' }
  | { status: 'VALID'; expiresAt: string }
  | { status: 'INVALID' | 'EXPIRED' | 'USED' | 'REVOKED'; message: string }
  | {
      status: 'ACTIVATED';
      registrationNumber: string | null;
      assignedRole: string;
    };

export default function ActivateAccountPage({
  initialToken,
  onNavigateToLogin,
  onNavigateHome,
}: ActivateAccountPageProps) {
  const getInitialToken = () => {
    if (initialToken && initialToken.trim()) return initialToken.trim();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (params.get('token') ?? '').trim();
    }
    return '';
  };

  const [token, setToken] = useState<string>(getInitialToken);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [state, setState] = useState<ValidationState>(() =>
    getInitialToken() ? { status: 'CHECKING' } : { status: 'NO_TOKEN' }
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const verifyToken = useCallback(async (rawToken: string) => {
    const clean = rawToken.trim();
    if (!clean) {
      setState({ status: 'NO_TOKEN' });
      return;
    }
    setState({ status: 'CHECKING' });
    setSubmitError(null);
    try {
      const res = await fetch('/api/registrations/activation/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: clean }),
      });
      const json = await res.json().catch(() => null);
      if (json?.valid) {
        setState({ status: 'VALID', expiresAt: json.expiresAt });
      } else {
        setState({
          status: (json?.status as 'INVALID' | 'EXPIRED' | 'USED' | 'REVOKED') || 'INVALID',
          message:
            json?.message ||
            'Activation link is invalid, expired, or has already been consumed.',
        });
      }
    } catch {
      setState({
        status: 'INVALID',
        message: 'Unable to reach the HI-TECH College verification server. Please retry shortly.',
      });
    }
  }, []);

  useEffect(() => {
    if (token) {
      verifyToken(token).catch(() => {});
    }
  }, [token, verifyToken]);

  const rules = [
    { label: 'At least 12 characters', ok: password.length >= 12 },
    { label: 'One uppercase letter (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', ok: /[a-z]/.test(password) },
    { label: 'One numeric digit (0-9)', ok: /[0-9]/.test(password) },
    {
      label: 'Confirmation matches password',
      ok: confirmPassword.length > 0 && password === confirmPassword,
    },
  ];
  const allRulesValid = rules.every((r) => r.ok);

  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesValid) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await fetch('/api/registrations/activation/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          password,
          confirmPassword,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Could not complete portal account activation.');
      }

      setState({
        status: 'ACTIVATED',
        registrationNumber: json.registrationNumber ?? null,
        assignedRole: json.assignedRole ?? 'PORTAL_USER',
      });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Activation failed. Verify your link and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualTokenInput.trim();
    if (!cleaned) return;
    setToken(cleaned);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] text-[#102D50] dark:text-slate-100 flex flex-col font-sans">
      {/* Institutional Header */}
      <header className="bg-[#092c60] text-white border-b border-blue-900/60 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-[#092c60] flex items-center justify-center shadow-sm">
              <GraduationCap size={22} />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-base text-white block">
                HI-TECH COLLEGE
              </span>
              <span className="text-[11px] text-blue-200 block">
                Official Portal Account Activation
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Website</span>
          </button>
        </div>
      </header>

      {/* Main Activation Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#102D50] to-[#1769AA] px-6 py-5 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <KeyRound size={20} className="text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">
                Activate Portal Account
              </h1>
              <p className="text-xs text-blue-100">
                Set your personal password to activate single-sign portal access.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {state.status === 'CHECKING' && (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-[#1769AA] animate-spin" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Verifying single-use activation token...
                </p>
              </div>
            )}

            {state.status === 'NO_TOKEN' && (
              <form onSubmit={handleManualTokenSubmit} className="space-y-4">
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    No activation token was found in the URL query string. Paste the single-use
                    activation code dispatched by Admissions or HR below to proceed.
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Single-Use Activation Token
                  </label>
                  <input
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="e.g. HCA-ACT-..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#102D50] hover:bg-[#1769AA] py-2.5 text-xs font-bold text-white transition-colors"
                >
                  Verify Activation Token
                </button>
              </form>
            )}

            {(state.status === 'INVALID' ||
              state.status === 'EXPIRED' ||
              state.status === 'USED' ||
              state.status === 'REVOKED') && (
              <div className="space-y-4">
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 flex items-start gap-3 text-xs text-red-900 dark:text-red-200">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                  <div className="space-y-1">
                    <div className="font-bold">
                      {state.status === 'USED'
                        ? 'Invitation Already Activated'
                        : state.status === 'EXPIRED'
                        ? 'Activation Link Expired'
                        : state.status === 'REVOKED'
                        ? 'Activation Link Revoked'
                        : 'Invalid Activation Link'}
                    </div>
                    <p>{state.message}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {state.status === 'USED' && (
                    <button
                      type="button"
                      onClick={onNavigateToLogin}
                      className="flex-1 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-4 py-2.5 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Proceed to Portal Sign-In</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setToken('');
                      setManualTokenInput('');
                      setState({ status: 'NO_TOKEN' });
                    }}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Enter Another Token
                  </button>
                </div>
              </div>
            )}

            {state.status === 'VALID' && (
              <form onSubmit={handleCompleteActivation} className="space-y-4">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                  <span>
                    Valid invitation verified (expires{' '}
                    {state.expiresAt.slice(0, 16).replace('T', ' ')}). Set your private password
                    below.
                  </span>
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs text-red-800 dark:text-red-200">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Portal Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter at least 12 characters"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-3.5 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                    required
                  />
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Security Requirements
                  </div>
                  {rules.map((r) => (
                    <div
                      key={r.label}
                      className={`text-xs flex items-center gap-2 ${
                        r.ok
                          ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {r.ok ? <Check size={13} /> : <X size={13} />}
                      <span>{r.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!allRulesValid || submitting}
                  className="w-full rounded-xl bg-[#102D50] hover:bg-[#1769AA] py-3 text-xs font-bold text-white transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock size={14} />
                  <span>{submitting ? 'Activating Account...' : 'Activate Account'}</span>
                </button>
              </form>
            )}

            {state.status === 'ACTIVATED' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={26} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-[#102D50] dark:text-white">
                    Portal Account Activated
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Your institutional access is now active under role{' '}
                    <strong>{state.assignedRole}</strong>
                    {state.registrationNumber ? (
                      <>
                        {' '}
                        with registration number{' '}
                        <span className="font-mono font-bold text-[#1769AA] dark:text-blue-300">
                          {state.registrationNumber}
                        </span>
                      </>
                    ) : null}
                    . Your single-use activation link has been permanently retired.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="flex-1 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-4 py-2.5 text-xs font-bold text-white inline-flex items-center justify-center gap-2"
                  >
                    <span>Continue to Portal Sign-In</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Return to Home Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { changePasswordRequest } from '../../auth/auth-api';
import { getUserDashboardPath } from '../../auth/auth-utils';
import { useAuth } from '../../auth/useAuth';

export function ChangePasswordPage({
  onNavigate,
  onNavigateHome,
}: {
  onNavigate: (destination: string) => void;
  onNavigateHome: () => void;
}) {
  const { user, refreshSession, signOut } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const checks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    symbol: /[^A-Za-z0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!currentPassword.trim()) {
      setError('Enter your current temporary or existing password.');
      return;
    }
    if (!checks.length || !checks.upper || !checks.lower || !checks.digit || !checks.symbol) {
      setError(
        'Your new password must be at least 8 characters and include uppercase, lowercase, number, and symbol.'
      );
      return;
    }
    if (!checks.matches) {
      setError('New passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePasswordRequest({ currentPassword, newPassword });
      setSuccessMessage(res.message);
      const updatedUser = await refreshSession();
      onNavigate(getUserDashboardPath(updatedUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSubmitting(false);
    }
  }

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
          aria-labelledby="change-password-heading"
        >
          <div className="bg-[#102D50] px-6 py-5 text-white border-b-4 border-[#B83232]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5EBDD] text-[#102D50] font-black text-lg shrink-0">
                <KeyRound size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5EBDD]">
                  HI-TECH College Security
                </p>
                <h1 id="change-password-heading" className="text-lg font-extrabold tracking-tight">
                  Update Portal Password
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {user?.mustChangePassword
                ? `Welcome, ${user.fullName}. For security, please replace your temporary password before opening your ${user.portalType} workspace.`
                : 'Choose a strong password that you do not reuse on external services.'}
            </p>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200"
              >
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="cp-current-password"
                  className="block text-xs font-semibold text-[#102D50] dark:text-slate-200"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="cp-current-password"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={submitting}
                    required
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3.5 pr-11 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-[#102D50] dark:text-slate-300"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="cp-new-password"
                  className="block text-xs font-semibold text-[#102D50] dark:text-slate-200"
                >
                  New Strong Password
                </label>
                <div className="relative">
                  <input
                    id="cp-new-password"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={submitting}
                    required
                    placeholder="8+ chars, upper, lower, number, symbol"
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3.5 pr-11 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-[#102D50] dark:text-slate-300"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="cp-confirm-password"
                  className="block text-xs font-semibold text-[#102D50] dark:text-slate-200"
                >
                  Confirm New Password
                </label>
                <input
                  id="cp-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <ul
                aria-label="Password strength requirements"
                className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/70 p-3 text-[11px]"
              >
                {[
                  { label: '8+ characters', met: checks.length },
                  { label: 'Uppercase letter', met: checks.upper },
                  { label: 'Lowercase letter', met: checks.lower },
                  { label: 'Number (0-9)', met: checks.digit },
                  { label: 'Symbol (!@#$)', met: checks.symbol },
                  { label: 'Passwords match', met: checks.matches },
                ].map((rule) => (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 font-medium ${
                      rule.met
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CheckCircle2 size={12} aria-hidden="true" />
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span>{submitting ? 'Updating Password...' : 'Save Password & Continue'}</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ChangePasswordPage;

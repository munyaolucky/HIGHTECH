import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react';

export default function ResetPasswordPage({
  initialToken = '',
  onBackToLogin,
}: {
  initialToken?: string;
  onBackToLogin: () => void;
}) {
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedMessage, setCompletedMessage] = useState('');
  const [error, setError] = useState('');

  const checks = {
    length: newPassword.length >= 12,
    upperAndLower: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    symbol: /[^A-Za-z0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!checks.length || !checks.upperAndLower || !checks.digit || !checks.symbol) {
      setError(
        'Password must be at least 12 characters and include uppercase and lowercase letters, a number, and a special character.'
      );
      return;
    }
    if (!checks.matches) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Unable to reset password.');
        return;
      }
      setCompletedMessage(json.data.message);
    } catch {
      setError('Network error while resetting password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-7 space-y-5">
        <div className="space-y-1.5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1769AA] dark:text-blue-400">
            <KeyRound size={20} />
          </div>
          <h1 className="text-xl font-bold text-[#102D50] dark:text-white">Set a new password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use at least 12 characters including uppercase and lowercase letters, a number, and a special character. All active sessions will be signed out.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {completedMessage ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-3 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={16} />
              <span>Password updated</span>
            </div>
            <p>{completedMessage}</p>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full rounded-xl bg-[#102D50] text-white py-2 text-xs font-semibold"
            >
              Continue to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!initialToken && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Recovery Token
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste single-use recovery token"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={12}
                  required
                  placeholder="At least 12 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((v) => !v)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Confirm Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={12}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#102D50]"
              />
              <span>Show passwords</span>
            </label>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3 text-[11px]">
              {[
                { label: 'At least 12 characters', met: checks.length },
                { label: 'Upper & lowercase letter', met: checks.upperAndLower },
                { label: 'At least one number', met: checks.digit },
                { label: 'Special character', met: checks.symbol },
                { label: 'Passwords match', met: checks.matches },
              ].map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 font-medium ${
                    rule.met
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={12} aria-hidden="true" className="shrink-0" />
                  <span>{rule.label}</span>
                </li>
              ))}
            </ul>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white py-2.5 text-sm font-semibold transition disabled:opacity-60"
            >
              {submitting ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
          >
            <ArrowLeft size={13} /> Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

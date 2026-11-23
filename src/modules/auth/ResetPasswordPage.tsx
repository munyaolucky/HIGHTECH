import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [completedMessage, setCompletedMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/password-recovery/complete', {
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
            Use at least 8 characters including uppercase, lowercase, a number, and a special character. All active sessions will be signed out.
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
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

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

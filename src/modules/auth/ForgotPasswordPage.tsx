import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export default function ForgotPasswordPage({
  onBackToLogin,
}: {
  onBackToLogin: () => void;
}) {
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/password-recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Could not process recovery request.');
        return;
      }
      setSubmittedMessage(json.data.message);
    } catch {
      setError('Unable to reach HI-TECH College recovery service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-7 space-y-5">
        <div className="space-y-1.5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1769AA] dark:text-blue-400">
            <Mail size={20} />
          </div>
          <h1 className="text-xl font-bold text-[#102D50] dark:text-white">Reset your password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your HI-TECH College email or registration number to request a short-lived password recovery link.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {submittedMessage ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={16} />
              <span>Recovery request processed</span>
            </div>
            <p className="leading-relaxed">{submittedMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="recovery-identifier"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Email or Registration Number
              </label>
              <input
                id="recovery-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@hitech.ac.ke or HCA/STU/2026/0001"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white py-2.5 text-sm font-semibold transition disabled:opacity-60"
            >
              {submitting ? 'Sending recovery link...' : 'Send recovery link'}
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

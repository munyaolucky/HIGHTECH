import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, LogOut, UserCheck } from 'lucide-react';
import { completeProfileRequest } from '../../auth/auth-api';
import { getUserDashboardPath } from '../../auth/auth-utils';
import { useAuth } from '../../auth/useAuth';

export function CompleteProfilePage({
  onNavigate,
  onNavigateHome,
}: {
  onNavigate: (destination: string) => void;
  onNavigateHome: () => void;
}) {
  const { user, refreshSession, signOut } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Enter your official full name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Enter an active mobile phone number.');
      return;
    }

    setSubmitting(true);
    try {
      await completeProfileRequest({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim() || undefined,
      });
      const updatedUser = await refreshSession();
      onNavigate(getUserDashboardPath(updatedUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile details.');
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
          aria-labelledby="complete-profile-heading"
        >
          <div className="bg-[#102D50] px-6 py-5 text-white border-b-4 border-[#1769AA]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5EBDD] text-[#102D50] font-black text-lg shrink-0">
                <UserCheck size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5EBDD]">
                  HI-TECH College Onboarding
                </p>
                <h1 id="complete-profile-heading" className="text-lg font-extrabold tracking-tight">
                  Complete Your Profile
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Confirm your contact details so HI-TECH College can issue verified academic notices, MFA recovery alerts, and portal services.
            </p>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="prof-fullname"
                  className="block text-xs font-semibold text-[#102D50] dark:text-slate-200"
                >
                  Official Full Name
                </label>
                <input
                  id="prof-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                  required
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="prof-phone"
                  className="block text-xs font-semibold text-[#102D50] dark:text-slate-200"
                >
                  Verified Mobile Phone
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={submitting}
                  required
                  placeholder="+254 7XX XXX XXX"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="prof-address"
                  className="block text-xs font-semibold text-[#102D50] dark:text-slate-200"
                >
                  Residential / Postal Address
                </label>
                <input
                  id="prof-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={submitting}
                  required
                  placeholder="Town / City / P.O. Box"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>{submitting ? 'Saving Profile...' : 'Save & Continue to Portal'}</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CompleteProfilePage;

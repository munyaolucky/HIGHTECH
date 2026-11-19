import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { normalizeServerUser } from '../../auth/auth-api';
import { getUserDashboardPath } from '../../auth/auth-utils';
import { useAuth } from '../../auth/useAuth';
import { auth, googleAuthProvider } from '../../lib/firebase';

interface LoginResponseData {
  mfaRequired?: boolean;
  challengeToken?: string;
  methods?: ('TOTP' | 'EMAIL_OTP' | 'BACKUP_CODE')[];
  maskedEmail?: string;
  destination?: string;
  user?: {
    uid: string;
    email: string;
    registrationNumber: string | null;
    fullName: string;
    primaryRole: string;
    mustChangePassword: boolean;
    requiresProfileCompletion: boolean;
    mfaEnabled: boolean;
  };
}

export default function PortalLoginPage({
  onSuccessRedirect,
  onNavigateForgotPassword,
  onNavigateActivate,
  onNavigateHome,
}: {
  onSuccessRedirect: (destination: string, userRole: string) => void;
  onNavigateForgotPassword: () => void;
  onNavigateActivate: () => void;
  onNavigateHome: () => void;
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // MFA challenge state
  const [mfaChallenge, setMfaChallenge] = useState<{
    challengeToken: string;
    maskedEmail?: string;
  } | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'TOTP' | 'BACKUP_CODE' | 'EMAIL_OTP'>('TOTP');
  const [mfaCode, setMfaCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [otpNotice, setOtpNotice] = useState('');

  // Post-login forced password / profile completion state
  const [onboardingStep, setOnboardingStep] = useState<{
    destination: string;
    primaryRole: string;
    mustChangePassword: boolean;
    requiresProfileCompletion: boolean;
    fullName: string;
  } | null>(null);
  const { refreshSession, setAuthenticatedUser } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const completeNavigation = async (data: LoginResponseData) => {
    const normalized = data.user
      ? normalizeServerUser({
          ...data.user,
          destination: data.destination,
        })
      : null;

    if (normalized) {
      setAuthenticatedUser(normalized);
    }

    const refreshed = await refreshSession();
    const resolvedUser = refreshed ?? normalized;
    const role = resolvedUser?.primaryRole || data.user?.primaryRole || 'STUDENT';
    const dest = resolvedUser
      ? getUserDashboardPath(resolvedUser)
      : data.destination || '/portal/staff';

    if (
      (resolvedUser?.mustChangePassword || resolvedUser?.requiresProfileCompletion) &&
      !dest.startsWith('/portal/change-password') &&
      !dest.startsWith('/portal/complete-profile')
    ) {
      setOnboardingStep({
        destination: data.destination || '/portal/staff',
        primaryRole: role,
        mustChangePassword: resolvedUser.mustChangePassword,
        requiresProfileCompletion: resolvedUser.requiresProfileCompletion,
        fullName: resolvedUser.fullName,
      });
      return;
    }

    onSuccessRedirect(dest, role);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Unable to sign in.');
        return;
      }

      const data = json.data as LoginResponseData;
      if (data.mfaRequired && data.challengeToken) {
        setMfaChallenge({
          challengeToken: data.challengeToken,
          maskedEmail: data.maskedEmail,
        });
        setMfaCode('');
        return;
      }

      completeNavigation(data);
    } catch {
      setError('Network error while connecting to HI-TECH College authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Google Sign-In verification failed.');
        return;
      }
      completeNavigation(json.data as LoginResponseData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In was cancelled or could not be completed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: mfaChallenge.challengeToken,
          code: mfaCode,
          method: mfaMethod,
          trustDevice,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Verification failed.');
        return;
      }
      completeNavigation(json.data as LoginResponseData);
    } catch {
      setError('Failed to verify MFA challenge.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEmailOtp = async () => {
    if (!mfaChallenge) return;
    setOtpNotice('');
    setError('');
    const res = await fetch('/api/mfa/email-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken: mfaChallenge.challengeToken }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setOtpNotice(json.data.message);
    } else {
      setError(json.error || 'Could not dispatch email OTP.');
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingStep) return;
    setError('');
    setLoading(true);
    try {
      if (onboardingStep.mustChangePassword) {
        if (newPassword !== confirmNewPassword) {
          setError('New passwords do not match.');
          return;
        }
        const passRes = await fetch('/api/auth/password/change', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: password, newPassword }),
        });
        const passJson = await passRes.json();
        if (!passRes.ok || !passJson.success) {
          setError(passJson.error || 'Password update failed.');
          return;
        }
      }

      if (onboardingStep.requiresProfileCompletion) {
        const profRes = await fetch('/api/auth/complete-profile', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, address }),
        });
        const profJson = await profRes.json();
        if (!profRes.ok || !profJson.success) {
          setError(profJson.error || 'Profile update failed.');
          return;
        }
      }

      onSuccessRedirect(onboardingStep.destination, onboardingStep.primaryRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#102D50] dark:hover:text-white"
          >
            <ArrowLeft size={14} /> Back to College Website
          </button>
          <button
            type="button"
            onClick={onNavigateActivate}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
          >
            <KeyRound size={13} /> Activate Invited Account
          </button>
        </div>

        <div className="rounded-2xl border border-[#dce4ef] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Unified HI-TECH Navy/Red/Cream Brand Banner */}
          <div className="bg-[#102D50] px-7 py-6 text-white border-b-4 border-[#B83232] text-center space-y-2.5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EBDD] text-[#102D50] font-black text-xl shadow-sm">
              H
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5EBDD]">
              HI-TECH College
            </p>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Integrated Digital Portal
            </h1>
            <p className="text-xs text-blue-100">
              {mfaChallenge
                ? 'Two-step verification required before opening your workspace.'
                : onboardingStep
                ? 'Complete your first-login security & profile setup.'
                : 'One unified sign-in for students, lecturers, and staff.'}
            </p>
          </div>

          <div className="p-7 space-y-6">

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:text-red-200"
            >
              {error}
            </div>
          )}

          {otpNotice && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
              {otpNotice}
            </div>
          )}

          {/* Onboarding First Login Step */}
          {onboardingStep ? (
            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              {onboardingStep.mustChangePassword && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      New Strong Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Minimum 8 chars, mixed case, number & symbol"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                </>
              )}

              {onboardingStep.requiresProfileCompletion && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Verified Mobile Phone
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      placeholder="+254 7XX XXX XXX"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Residential / Correspondence Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      placeholder="City / Postal Address"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white py-2.5 text-sm font-semibold transition disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                <span>{loading ? 'Saving...' : 'Complete Setup & Enter Portal'}</span>
              </button>
            </form>
          ) : mfaChallenge ? (
            /* MFA Verification Step */
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMfaMethod('TOTP')}
                  className={`rounded-lg py-1.5 transition ${
                    mfaMethod === 'TOTP'
                      ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Authenticator
                </button>
                <button
                  type="button"
                  onClick={() => setMfaMethod('BACKUP_CODE')}
                  className={`rounded-lg py-1.5 transition ${
                    mfaMethod === 'BACKUP_CODE'
                      ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Backup Code
                </button>
                <button
                  type="button"
                  onClick={() => setMfaMethod('EMAIL_OTP')}
                  className={`rounded-lg py-1.5 transition ${
                    mfaMethod === 'EMAIL_OTP'
                      ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Email OTP
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {mfaMethod === 'TOTP'
                    ? '6-Digit Authenticator App Code'
                    : mfaMethod === 'BACKUP_CODE'
                    ? 'Single-Use Backup Recovery Code'
                    : `Email Verification Code (${mfaChallenge.maskedEmail ?? 'college email'})`}
                </label>
                <div className="relative">
                  <Smartphone
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder={mfaMethod === 'BACKUP_CODE' ? 'XXXX-XXXX' : '000000'}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                  />
                </div>
              </div>

              {mfaMethod === 'EMAIL_OTP' && (
                <button
                  type="button"
                  onClick={handleRequestEmailOtp}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                >
                  <Mail size={13} /> Send 6-digit code to my college email
                </button>
              )}

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="accent-[#1769AA]"
                />
                <span>Trust this device for 30 days</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMfaChallenge(null);
                    setError('');
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white py-2.5 text-sm font-semibold transition disabled:opacity-60"
                >
                  <ShieldCheck size={16} />
                  <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Single Unified Login Form (No Role Buttons) */
            <>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="portal-identifier"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Email or Registration Number
                  </label>
                  <input
                    id="portal-identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@hitech.ac.ke or HCA/STU/2026/0001"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="portal-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="portal-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#1769AA]"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white py-2.5 text-sm font-semibold transition shadow-sm disabled:opacity-60"
                >
                  <Lock size={15} aria-hidden="true" />
                  <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2.5 text-slate-600 dark:text-slate-300 font-semibold">
                    Or Institutional SSO
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 transition disabled:opacity-60"
              >
                <ShieldCheck size={15} className="text-[#1769AA] dark:text-blue-400" aria-hidden="true" />
                <span>Sign in with Google Workspace</span>
              </button>
            </>
          )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 dark:text-slate-300">
          Authorised HI-TECH College users only. Your role and portal workspace are assigned automatically after verification.
        </p>
      </div>
    </div>
  );
}

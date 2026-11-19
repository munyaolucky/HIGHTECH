import React, { useContext, useState, type FormEvent } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  CircleHelp,
  Eye,
  EyeOff,
  GraduationCap,
  Headphones,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserRound,
} from 'lucide-react';
import { normalizeServerUser } from '../../auth/auth-api';
import { getUserDashboardPath } from '../../auth/auth-utils';
import { AuthContext } from '../../auth/AuthProvider';
import { auth, googleAuthProvider } from '../../lib/firebase';

const CAMPUS_BG_URL = new URL(
  '../../assets/images/hitech_innovation_campus_1794981896251.jpg',
  import.meta.url
).href;

const STUDENT_PROMO_URL = new URL(
  '../../assets/images/student_library_promo_1794587291004.jpg',
  import.meta.url
).href;

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

export interface StudentLoginPageProps {
  onSuccessRedirect?: (destination: string, userRole: string) => void;
  onNavigateForgotPassword?: () => void;
  onNavigateActivate?: () => void;
  onNavigateApply?: () => void;
  onNavigateHome?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  onNavigateContact?: () => void;
  onNavigateUnifiedLogin?: () => void;
}

export default function StudentLoginPage({
  onSuccessRedirect,
  onNavigateForgotPassword,
  onNavigateActivate,
  onNavigateApply,
  onNavigateHome,
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateContact,
  onNavigateUnifiedLogin,
}: StudentLoginPageProps) {
  const authCtx = useContext(AuthContext);

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // MFA challenge step
  const [mfaChallenge, setMfaChallenge] = useState<{
    challengeToken: string;
    maskedEmail?: string;
  } | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'TOTP' | 'BACKUP_CODE' | 'EMAIL_OTP'>('TOTP');
  const [mfaCode, setMfaCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [otpNotice, setOtpNotice] = useState('');

  // Post-login forced password / profile onboarding step
  const [onboardingStep, setOnboardingStep] = useState<{
    destination: string;
    primaryRole: string;
    mustChangePassword: boolean;
    requiresProfileCompletion: boolean;
    fullName: string;
  } | null>(null);
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

    if (normalized && authCtx?.setAuthenticatedUser) {
      authCtx.setAuthenticatedUser(normalized);
    }

    const refreshed = authCtx?.refreshSession ? await authCtx.refreshSession() : null;
    const resolvedUser = refreshed ?? normalized;
    const role = resolvedUser?.primaryRole || data.user?.primaryRole || 'STUDENT';
    const dest = resolvedUser
      ? getUserDashboardPath(resolvedUser)
      : data.destination || '/portal/student';

    if (
      (resolvedUser?.mustChangePassword || resolvedUser?.requiresProfileCompletion) &&
      !dest.startsWith('/portal/change-password') &&
      !dest.startsWith('/portal/complete-profile')
    ) {
      setOnboardingStep({
        destination: data.destination || '/portal/student',
        primaryRole: role,
        mustChangePassword: resolvedUser.mustChangePassword,
        requiresProfileCompletion: resolvedUser.requiresProfileCompletion,
        fullName: resolvedUser.fullName,
      });
      return;
    }

    onSuccessRedirect?.(dest, role);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const cleanReg = registrationNumber.trim().toUpperCase();
    if (!cleanReg || !password) {
      setError('Please enter your registration number and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanReg,
          password,
          rememberMe: false,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Invalid registration number or password.');
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

      await completeNavigation(data);
    } catch {
      setError('Network error while connecting to the HI-TECH College authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      setLoading(true);
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
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Google Sign-In verification failed.');
        return;
      }
      await completeNavigation(json.data as LoginResponseData);
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

  const handleMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfaChallenge) return;
    setError('');
    try {
      setLoading(true);
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
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Verification failed.');
        return;
      }
      await completeNavigation(json.data as LoginResponseData);
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
    try {
      const res = await fetch('/api/mfa/email-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken: mfaChallenge.challengeToken }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setOtpNotice(json.data.message);
      } else {
        setError(json?.error || 'Could not dispatch email OTP.');
      }
    } catch {
      setError('Unable to send email verification code right now.');
    }
  };

  const handleCompleteOnboarding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onboardingStep) return;
    setError('');
    try {
      setLoading(true);
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
        const passJson = await passRes.json().catch(() => null);
        if (!passRes.ok || !passJson?.success) {
          setError(passJson?.error || 'Password update failed.');
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
        const profJson = await profRes.json().catch(() => null);
        if (!profRes.ok || !profJson?.success) {
          setError(profJson?.error || 'Profile update failed.');
          return;
        }
      }

      onSuccessRedirect?.(onboardingStep.destination, onboardingStep.primaryRole);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-[#0a2346]">
      {/* Campus Backdrop Photo + Deep Navy Scrim */}
      <img
        src={CAMPUS_BG_URL}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#071934]/80 via-[#0d274b]/68 to-[#102D50]/78 backdrop-blur-[1px]"
      />

      {/* Slim Top Utility Strip */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1040px] items-center justify-between px-4 pt-4 sm:px-6">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Website</span>
        </button>

        {onNavigateUnifiedLogin && (
          <button
            type="button"
            onClick={onNavigateUnifiedLogin}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#0d2f66]/80 px-3 py-1.5 text-xs font-semibold text-[#F5EBDD] backdrop-blur transition hover:bg-[#1769AA] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Staff &amp; Unified Portal</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </header>

      {/* Main Split Login Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:py-8">
        <section
          aria-label="Student Portal Login"
          className="grid w-full max-w-[980px] overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_24px_64px_rgba(4,16,38,0.48)] lg:grid-cols-[1.06fr_1fr]"
        >
          {/* Left Panel: HI-TECH Welcome, Features & Student Visual */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#f8fbff] via-[#f1f6fd] to-[#e4eef9]">
            <div className="relative z-10 px-6 pt-7 sm:px-9 sm:pt-8">
              {/* Institutional Crest & Wordmark */}
              <div className="flex items-center gap-3.5">
                <svg
                  width="64"
                  height="68"
                  viewBox="0 0 80 86"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="shrink-0 drop-shadow-sm"
                >
                  <path
                    d="M16 14C10 22 8 36 12 49C16 61 24 69 32 73"
                    stroke="#D99B26"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M64 14C70 22 72 36 68 49C64 61 56 69 48 73"
                    stroke="#D99B26"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 10H62V43C62 59 51 70 40 75C29 70 18 59 18 43V10Z"
                    fill="#FFFFFF"
                    stroke="#102D50"
                    strokeWidth="3.2"
                  />
                  <path d="M40 16L54 22L40 28L26 22L40 16Z" fill="#102D50" />
                  <path d="M31 25V31C31 33 35 35 40 35C45 35 49 33 49 31V25" fill="#102D50" />
                  <path
                    d="M27 38C31 36 36 37 40 40C44 37 49 36 53 38V53C49 51 44 52 40 54C36 52 31 51 27 53V38Z"
                    fill="#EBF2FC"
                    stroke="#102D50"
                    strokeWidth="2"
                  />
                  <path
                    d="M15 56H65L61 65H19L15 56Z"
                    fill="#B83232"
                    stroke="#102D50"
                    strokeWidth="1.5"
                  />
                  <text
                    x="40"
                    y="63"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="8"
                    fontWeight="800"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    HI-TECH
                  </text>
                </svg>

                <div>
                  <div className="text-[22px] font-black leading-none tracking-tight sm:text-2xl">
                    <span className="text-[#102D50]">HI-TECH </span>
                    <span className="text-[#B83232]">COLLEGE</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold italic text-[#102D50]">
                    Excellence in Technology, Skills &amp; Innovation
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-[1px] flex-1 bg-slate-300" />
                    <span className="text-[10px] font-black tracking-[0.22em] text-[#102D50]">
                      KENYA
                    </span>
                    <span className="h-[1px] flex-1 bg-slate-300" />
                  </div>
                </div>
              </div>

              {/* Welcome Headlines */}
              <div className="mt-6">
                <p className="text-lg font-extrabold tracking-tight text-[#102D50] sm:text-xl">
                  Welcome to the
                </p>
                <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-[#102D50] sm:text-[34px]">
                  HI-TECH College
                  <span className="block text-[#B83232]">Student Portal</span>
                </h1>
                <p className="mt-2.5 text-sm font-semibold italic text-[#102D50]/85">
                  Access your academic records, register units and more...
                </p>
              </div>

              {/* Three Academic Benefit Icons */}
              <div className="mt-6 grid grid-cols-3 border-t border-slate-200/80 pt-5">
                <div className="flex flex-col items-center border-r border-slate-300/75 px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d2f66] text-white shadow-sm">
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#102D50]">View Results</span>
                </div>

                <div className="flex flex-col items-center border-r border-slate-300/75 px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d2f66] text-white shadow-sm">
                    <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#102D50]">Register Units</span>
                </div>

                <div className="flex flex-col items-center px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d2f66] text-white shadow-sm">
                    <Headphones className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#102D50]">Get Support</span>
                </div>
              </div>
            </div>

            {/* Bottom Red + Navy Campus Wave with Authentic Student Photo */}
            <div className="relative mt-5 h-44 w-full overflow-hidden sm:h-48">
              <svg
                viewBox="0 0 600 180"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <path d="M0 18C185 72 375 110 600 92V180H0V18Z" fill="#B83232" />
                <path d="M0 36C185 88 375 122 600 108V180H0V36Z" fill="#0d2f66" />
              </svg>

              <div className="relative z-10 flex h-full items-end px-6 pb-4 pt-8 sm:px-9">
                <div className="flex w-full items-center gap-3.5 rounded-2xl border border-white/20 bg-white/95 p-2.5 shadow-lg backdrop-blur">
                  <img
                    src={STUDENT_PROMO_URL}
                    alt="HI-TECH College students collaborating on campus"
                    referrerPolicy="no-referrer"
                    className="h-20 w-28 shrink-0 rounded-xl object-cover object-top"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F5EBDD] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#102D50]">
                      <ShieldCheck className="h-3 w-3 text-[#B83232]" aria-hidden="true" />
                      TVETA · KNEC · CDACC
                    </span>
                    <p className="mt-1 text-xs font-extrabold text-[#102D50]">
                      24/7 Student Self-Service
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                      Exam timetables, verified transcripts &amp; M-Pesa fee ledger in one workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Student Login Form (plus MFA & Onboarding States) */}
          <div className="flex flex-col justify-center bg-white px-6 py-8 sm:px-10 sm:py-10">
            {/* Graduation Cap Header Badge */}
            <div className="flex items-center justify-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#0d2f66]/45" />
              <div
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0d2f66] text-white shadow-[0_8px_20px_rgba(13,47,102,0.28)]"
              >
                <GraduationCap className="h-8 w-8" />
              </div>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#0d2f66]/45" />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-black tracking-tight text-[#0d2f66] sm:text-[28px]">
                {mfaChallenge
                  ? 'Two-Step Verification'
                  : onboardingStep
                  ? 'Finish Student Setup'
                  : 'Student Login'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {mfaChallenge
                  ? `Confirm your identity${mfaChallenge.maskedEmail ? ` (${mfaChallenge.maskedEmail})` : ''}.`
                  : onboardingStep
                  ? `Welcome, ${onboardingStep.fullName}. Complete setup to continue.`
                  : 'Enter your credentials to continue'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-[#B83232]"
              >
                {error}
              </div>
            )}

            {otpNotice && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900"
              >
                {otpNotice}
              </div>
            )}

            {!mfaChallenge && !onboardingStep && (
              <>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Registration Number Input */}
                  <div>
                    <label
                      htmlFor="student-reg-number"
                      className="sr-only"
                    >
                      Registration Number
                    </label>
                    <div className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3.5 transition focus-within:border-[#1769AA] focus-within:ring-2 focus-within:ring-[#1769AA]/20">
                      <UserRound className="h-4 w-4 shrink-0 text-[#0d2f66]" aria-hidden="true" />
                      <input
                        id="student-reg-number"
                        type="text"
                        placeholder="Registration Number (e.g. HCA/STU/2026/001)"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        autoComplete="username"
                        disabled={loading}
                        className="w-full bg-transparent text-sm text-[#102D50] placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password / PIN Input */}
                  <div>
                    <label htmlFor="student-password" className="sr-only">
                      Password or PIN
                    </label>
                    <div className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3.5 transition focus-within:border-[#1769AA] focus-within:ring-2 focus-within:ring-[#1769AA]/20">
                      <LockKeyhole className="h-4 w-4 shrink-0 text-[#0d2f66]" aria-hidden="true" />
                      <input
                        id="student-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password / PIN"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={loading}
                        className="w-full bg-transparent text-sm text-[#102D50] placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#102D50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0d2f66] px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1769AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] focus-visible:ring-offset-2 disabled:opacity-65"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>OR</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#102D50] transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] disabled:opacity-65"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-2H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M3.2 7.3l3.2 2.3C7.2 7.4 9.4 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2 12 2 8.1 2 4.8 4.2 3.2 7.3z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 22c2.5 0 4.6-.8 6.2-2.3l-2.9-2.4c-.8.6-1.8 1-3.3 1-2.5 0-4.7-1.7-5.5-4.1l-3.2 2.5C4.9 19.8 8.2 22 12 22z"
                    />
                    <path
                      fill="#4285F4"
                      d="M21.6 12.2c0-.7-.1-1.2-.2-2H12v3.9h5.4c-.3 1.3-1.1 2.4-2.1 3.1l2.9 2.4c1.7-1.6 2.7-4 2.7-7.4z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {/* Secondary Action Links */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#1769AA]">
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="inline-flex items-center gap-1.5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                  >
                    <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Forgot Password?</span>
                  </button>

                  <span aria-hidden="true" className="text-slate-300">
                    |
                  </span>

                  <button
                    type="button"
                    onClick={onNavigateActivate}
                    className="inline-flex items-center gap-1.5 text-[#102D50] hover:text-[#1769AA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                  >
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Activate Account</span>
                  </button>
                </div>

                {/* Prospective Student Application Prompt */}
                {onNavigateApply && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-[#F4F7FB] px-4 py-2.5 text-center text-xs text-slate-600">
                    New or prospective student?{' '}
                    <button
                      type="button"
                      onClick={onNavigateApply}
                      className="font-extrabold text-[#B83232] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                    >
                      Apply Online →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* MFA Verification Step */}
            {mfaChallenge && (
              <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['TOTP', 'Authenticator'],
                      ['EMAIL_OTP', 'Email OTP'],
                      ['BACKUP_CODE', 'Backup Code'],
                    ] as const
                  ).map(([codeKey, label]) => (
                    <button
                      key={codeKey}
                      type="button"
                      onClick={() => setMfaMethod(codeKey)}
                      className={`min-h-[38px] rounded-xl border px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] ${
                        mfaMethod === codeKey
                          ? 'border-[#102D50] bg-[#102D50] text-white'
                          : 'border-slate-300 bg-white text-[#102D50] hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {mfaMethod === 'EMAIL_OTP' && (
                  <button
                    type="button"
                    onClick={handleRequestEmailOtp}
                    className="min-h-[38px] w-full rounded-xl border border-[#1769AA] bg-blue-50 text-xs font-bold text-[#1769AA] hover:bg-blue-100"
                  >
                    Send One-Time Code to My Email
                  </button>
                )}

                <div>
                  <label htmlFor="student-mfa-code" className="mb-1 block text-xs font-bold text-[#102D50]">
                    Verification Code
                  </label>
                  <div className="flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 px-3.5 focus-within:border-[#1769AA] focus-within:ring-2 focus-within:ring-[#1769AA]/20">
                    <Smartphone className="h-4 w-4 text-[#0d2f66]" aria-hidden="true" />
                    <input
                      id="student-mfa-code"
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full bg-transparent text-sm font-mono tracking-widest text-[#102D50] focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#0d2f66]"
                  />
                  <span>Trust this browser for 30 days</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMfaChallenge(null)}
                    className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-xs font-bold text-[#102D50]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[44px] flex-1 rounded-xl bg-[#0d2f66] px-4 text-sm font-extrabold text-white hover:bg-[#1769AA]"
                  >
                    {loading ? 'Verifying...' : 'Verify & Open Student Portal'}
                  </button>
                </div>
              </form>
            )}

            {/* Forced Onboarding Step */}
            {onboardingStep && (
              <form onSubmit={handleCompleteOnboarding} className="mt-6 space-y-4">
                {onboardingStep.mustChangePassword && (
                  <>
                    <div>
                      <label htmlFor="student-new-pass" className="mb-1 block text-xs font-bold text-[#102D50]">
                        New Portal Password
                      </label>
                      <input
                        id="student-new-pass"
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm text-[#102D50]"
                      />
                    </div>
                    <div>
                      <label htmlFor="student-confirm-pass" className="mb-1 block text-xs font-bold text-[#102D50]">
                        Confirm Password
                      </label>
                      <input
                        id="student-confirm-pass"
                        type="password"
                        required
                        minLength={8}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm text-[#102D50]"
                      />
                    </div>
                  </>
                )}

                {onboardingStep.requiresProfileCompletion && (
                  <>
                    <div>
                      <label htmlFor="student-phone" className="mb-1 block text-xs font-bold text-[#102D50]">
                        Mobile Phone
                      </label>
                      <input
                        id="student-phone"
                        type="tel"
                        required
                        placeholder="+254 7XX XXX XXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm text-[#102D50]"
                      />
                    </div>
                    <div>
                      <label htmlFor="student-address" className="mb-1 block text-xs font-bold text-[#102D50]">
                        Residential / Campus Address
                      </label>
                      <input
                        id="student-address"
                        type="text"
                        required
                        placeholder="Kitengela / Nairobi"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm text-[#102D50]"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0d2f66] px-4 text-sm font-extrabold text-white hover:bg-[#1769AA]"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>{loading ? 'Saving...' : 'Complete Setup & Enter Portal'}</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Legal & Secure Portal Bar */}
      <footer className="relative z-10 border-t border-white/15 bg-[#071d3f]/95 text-xs text-blue-100">
        <div className="mx-auto flex max-w-[1040px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="tabular-nums text-blue-100/90">
            © {currentYear} HI-TECH College of Technology &amp; Applied Sciences. All Rights Reserved.
          </div>

          <nav aria-label="Student portal legal links" className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigatePrivacy}
              className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true" className="text-white/30">
              |
            </span>
            <button
              type="button"
              onClick={onNavigateTerms}
              className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Terms &amp; Conditions
            </button>
            <span aria-hidden="true" className="text-white/30">
              |
            </span>
            <button
              type="button"
              onClick={onNavigateContact}
              className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Contact Us
            </button>
            <span className="ml-2 inline-flex items-center gap-1.5 font-bold text-[#F5EBDD]">
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>Secure Portal</span>
            </span>
          </nav>
        </div>
      </footer>
    </div>
  );
}

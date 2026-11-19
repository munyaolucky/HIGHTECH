import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cookie,
  FileText,
  Megaphone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  CONSENT_VERSION,
  ConsentNoticeReason,
  ConsentRecord,
  CookiePreferences,
  DEFAULT_COOKIE_PREFERENCES,
  STORAGE_INVENTORY,
  getConsentNoticeReason,
  getConsentRecord,
  getPreferencesFromRecord,
  initializeAnalytics,
  initializeMarketing,
  saveConsentPreferences,
  syncConsentGates,
  withdrawOptionalConsent,
} from '../../lib/consent';

interface CookieConsentBannerProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
  onNavigate?: (page: string) => void;
}

export default function CookieConsentBanner({
  externalOpen = false,
  onExternalClose,
  onNavigate,
}: CookieConsentBannerProps) {
  const [record, setRecord] = useState<ConsentRecord | null>(() => getConsentRecord());
  const [noticeReason, setNoticeReason] = useState<ConsentNoticeReason>(() =>
    getConsentNoticeReason()
  );
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() =>
    getPreferencesFromRecord(getConsentRecord())
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    syncConsentGates();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('cookies') === '1' || externalOpen) {
      setPreferences(getPreferencesFromRecord(getConsentRecord()));
      setShowSettingsModal(true);
    }
  }, [externalOpen]);

  useEffect(() => {
    if (!showSettingsModal) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettingsModal(false);
        onExternalClose?.();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showSettingsModal, onExternalClose]);

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    onExternalClose?.();
  };

  const applyConsent = (
    nextPrefs: Pick<CookiePreferences, 'functional' | 'analytics' | 'marketing'>,
    message: string,
    action?: 'accept_all' | 'reject_optional' | 'customize' | 'withdraw'
  ) => {
    const saved = saveConsentPreferences(nextPrefs, action);
    setRecord(saved);
    setNoticeReason(null);
    setPreferences(getPreferencesFromRecord(saved));
    if (saved.analytics) {
      initializeAnalytics();
    }
    if (saved.marketing) {
      initializeMarketing();
    }
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 4200);
    handleCloseSettings();
  };

  const handleAcceptAll = () => {
    applyConsent(
      { functional: true, analytics: true, marketing: true },
      'All cookie categories enabled. You can update or withdraw consent anytime via Cookie Settings.',
      'accept_all'
    );
  };

  const handleRejectOptional = () => {
    applyConsent(
      { functional: false, analytics: false, marketing: false },
      'Only strictly necessary cookies remain active. Optional trackers and preference keys were blocked.',
      'reject_optional'
    );
  };

  const handleWithdrawConsent = () => {
    const withdrawn = withdrawOptionalConsent();
    setRecord(withdrawn);
    setNoticeReason(null);
    setPreferences(getPreferencesFromRecord(withdrawn));
    setStatusMessage(
      'Optional consent withdrawn. Analytics/marketing scripts stopped and optional storage cleared.'
    );
    setTimeout(() => setStatusMessage(null), 4500);
    handleCloseSettings();
  };

  const handleSaveCustom = () => {
    applyConsent(
      {
        functional: preferences.functional,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      },
      'Your custom privacy preferences have been saved.',
      'customize'
    );
  };

  const openPolicyPage = (page: string) => {
    handleCloseSettings();
    if (onNavigate) {
      onNavigate(page);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/${page}`;
    }
  };

  const toggleCategory = (key: 'functional' | 'analytics' | 'marketing') => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hasAnyOptionalEnabled = Boolean(
    record && (record.functional || record.analytics || record.marketing)
  );

  return (
    <>
      {/* Permanent floating Cookie Settings button so withdrawal is effortless */}
      <button
        type="button"
        onClick={() => {
          setPreferences(getPreferencesFromRecord(record));
          setShowSettingsModal(true);
        }}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/95 px-3.5 py-2 text-xs font-extrabold text-[#102D50] shadow-lg backdrop-blur transition hover:border-[#1769AA] hover:bg-[#F5EBDD]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
        title="Manage Cookie & Privacy Preferences"
        aria-label="Cookie Settings"
      >
        <Cookie className="h-4 w-4 text-[#B83232]" aria-hidden="true" />
        <span className="hidden sm:inline">Cookie Settings</span>
      </button>

      {/* Accessible status confirmation toast */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 left-4 z-50 flex max-w-sm items-center gap-2.5 rounded-xl border border-blue-800 bg-[#102D50] px-4 py-3 text-xs text-white shadow-xl"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Initial Cookie Consent Banner (shown until visitor records valid current-version consent) */}
      {!record && !showSettingsModal && (
        <aside
          role="region"
          aria-label="Cookie consent notice"
          className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:left-6 md:right-auto md:max-w-2xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#F4F7FB] text-[#102D50]">
              <Cookie className="h-5 w-5 text-[#1769AA]" aria-hidden="true" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black tracking-tight text-[#102D50]">
                  Your Privacy Matters
                </h3>
                <span className="rounded-md bg-[#F5EBDD] px-2 py-0.5 font-mono text-[10px] font-bold text-[#102D50]">
                  Policy {CONSENT_VERSION}
                </span>
              </div>

              {noticeReason && (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
                  <span>
                    {noticeReason === 'policy_updated'
                      ? 'Our Cookie & Storage Policy version changed. Please confirm your preferences.'
                      : 'Your previous 12-month cookie consent expired. Please confirm your preferences.'}
                  </span>
                </div>
              )}

              <p className="text-xs leading-relaxed text-slate-600">
                HI-TECH College uses strictly necessary cookies to keep the portal secure, and
                blocks optional functional, analytics, and outreach scripts until you grant
                permission. Read our{' '}
                <button
                  type="button"
                  onClick={() => openPolicyPage('privacy-policy')}
                  className="font-bold text-[#1769AA] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  Privacy Policy
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => openPolicyPage('cookie-policy')}
                  className="font-bold text-[#1769AA] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  Cookie Policy
                </button>{' '}
                or open{' '}
                <button
                  type="button"
                  onClick={() => {
                    setPreferences(DEFAULT_COOKIE_PREFERENCES);
                    setShowSettingsModal(true);
                  }}
                  className="font-bold text-[#1769AA] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  Cookie Settings
                </button>
                .
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPreferences(getPreferencesFromRecord(record));
                    setShowSettingsModal(true);
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-[#102D50] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#1769AA]" aria-hidden="true" />
                  <span>Customize</span>
                </button>

                <button
                  type="button"
                  onClick={handleRejectOptional}
                  className="min-h-[38px] flex-1 rounded-xl border-2 border-[#102D50] bg-white px-4 py-2 text-center text-xs font-extrabold text-[#102D50] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] sm:flex-none"
                >
                  Reject Optional
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="min-h-[38px] flex-1 rounded-xl border-2 border-[#102D50] bg-[#102D50] px-4 py-2 text-center text-xs font-extrabold text-white transition hover:bg-[#1769AA] hover:border-[#1769AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] sm:flex-none"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Privacy Preferences & Script Blocking Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#071934]/65 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={handleCloseSettings}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-[#102D50] px-6 py-4 text-white">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F5EBDD]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="cookie-preferences-title" className="text-base font-black tracking-tight">
                    Privacy Preferences
                  </h2>
                  <p className="mt-0.5 text-xs text-blue-100">
                    Policy {CONSENT_VERSION} · Optional scripts are blocked unless explicitly enabled.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseSettings}
                className="rounded-lg p-1.5 text-blue-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close privacy preferences"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Category Toggles & Storage Inventory */}
            <div className="space-y-4 overflow-y-auto p-6 text-xs text-slate-700">
              {/* 1. Strictly Necessary */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    <strong className="text-sm font-extrabold text-[#102D50]">
                      Strictly Necessary Cookies
                    </strong>
                    <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Always On
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Essential for portal sign-in security, session renewal, and remembering your
                    consent status. These cannot be disabled.
                  </p>
                </div>
              </div>

              {/* 2. Functional Cookies */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#1769AA]" aria-hidden="true" />
                    <strong className="text-sm font-extrabold text-[#102D50]">
                      Functional Cookies
                    </strong>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        preferences.functional
                          ? 'bg-blue-100 text-[#102D50]'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {preferences.functional ? 'Allowed' : 'Blocked'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Remembers portal display theme, accessibility text scaling, and interactive
                    learning canvas preferences. Disabling deletes these browser keys.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.functional}
                  aria-label="Toggle Functional Cookies"
                  onClick={() => toggleCategory('functional')}
                  className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] focus-visible:ring-offset-2 ${
                    preferences.functional ? 'bg-[#1769AA]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      preferences.functional ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Analytics Cookies */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#1769AA]" aria-hidden="true" />
                    <strong className="text-sm font-extrabold text-[#102D50]">
                      Analytics Cookies
                    </strong>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        preferences.analytics
                          ? 'bg-blue-100 text-[#102D50]'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {preferences.analytics ? 'Allowed' : 'Blocked'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Helps improve campus website navigation and programme discoverability through
                    anonymized usage metrics only after approval.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.analytics}
                  aria-label="Toggle Analytics Cookies"
                  onClick={() => toggleCategory('analytics')}
                  className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] focus-visible:ring-offset-2 ${
                    preferences.analytics ? 'bg-[#1769AA]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Marketing Cookies */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Megaphone className="h-4 w-4 text-[#B83232]" aria-hidden="true" />
                    <strong className="text-sm font-extrabold text-[#102D50]">
                      Marketing Cookies
                    </strong>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        preferences.marketing
                          ? 'bg-blue-100 text-[#102D50]'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {preferences.marketing ? 'Allowed' : 'Blocked'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Blocked by default. Used only to measure public intake campaign referrals and
                    admission open-day announcements when explicitly consented.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.marketing}
                  aria-label="Toggle Marketing Cookies"
                  onClick={() => toggleCategory('marketing')}
                  className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA] focus-visible:ring-offset-2 ${
                    preferences.marketing ? 'bg-[#1769AA]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Expandable Single-Source Storage Inventory */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setShowInventory((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-extrabold text-[#102D50] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                  aria-expanded={showInventory}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#1769AA]" aria-hidden="true" />
                    <span>View Browser Storage Inventory &amp; ODPC Compliance</span>
                  </span>
                  {showInventory ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  )}
                </button>

                {showInventory && (
                  <div className="space-y-3 border-t border-slate-200 p-4">
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Kind</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">Purpose</th>
                            <th className="px-3 py-2">Lifetime</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {STORAGE_INVENTORY.map((item) => (
                            <tr key={item.name} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono font-bold text-[#102D50]">
                                {item.name}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{item.kind}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    item.category === 'strictly_necessary'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {item.category === 'strictly_necessary'
                                    ? 'Necessary'
                                    : 'Functional'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{item.purpose}</td>
                              <td className="px-3 py-2 text-slate-500">{item.lifetime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="rounded-lg border border-amber-200 bg-[#F5EBDD]/70 p-3 text-[11px] leading-relaxed text-[#102D50]">
                      <strong>Kenya Data Protection Act, 2019 Notice:</strong> Optional script gates
                      stay blocked unless consented, and consent expires after 12 months or any
                      policy update. Contact{' '}
                      <span className="font-mono font-bold">dpo@hitech.ac.ke</span> for institutional
                      privacy inquiries.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-600">
                <button
                  type="button"
                  onClick={() => openPolicyPage('privacy-policy')}
                  className="font-bold text-[#1769AA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  Privacy Policy
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => openPolicyPage('cookie-policy')}
                  className="font-bold text-[#1769AA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  Cookie Policy
                </button>
                {record && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-slate-500">
                      Expires {new Date(record.expiresAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasAnyOptionalEnabled ? (
                  <button
                    type="button"
                    onClick={handleWithdrawConsent}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-extrabold text-[#B83232] transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83232]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Withdraw Consent</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRejectOptional}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-extrabold text-[#102D50] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reject Optional</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="min-h-[38px] rounded-xl border border-[#1769AA] bg-white px-4 py-2 text-xs font-extrabold text-[#1769AA] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  Save My Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="min-h-[38px] rounded-xl bg-[#102D50] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#1769AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769AA]"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

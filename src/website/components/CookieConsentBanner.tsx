import React, { useEffect, useState } from 'react';
import { Cookie, ShieldCheck, SlidersHorizontal, X, CheckCircle2, Trash2, FileText } from 'lucide-react';
import {
  CONSENT_VERSION,
  ConsentRecord,
  STORAGE_INVENTORY,
  getConsentRecord,
  saveConsentChoice,
} from '../../lib/consent';

interface CookieConsentBannerProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

export default function CookieConsentBanner({
  externalOpen = false,
  onExternalClose,
}: CookieConsentBannerProps) {
  const [record, setRecord] = useState<ConsentRecord | null>(() => getConsentRecord());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [preferencesToggle, setPreferencesToggle] = useState<boolean>(
    () => getConsentRecord()?.preferences ?? false
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cookies') === '1' || externalOpen) {
      setShowSettingsModal(true);
    }
  }, [externalOpen]);

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    onExternalClose?.();
  };

  const handleChoose = (acceptPreferences: boolean) => {
    const next = saveConsentChoice(acceptPreferences);
    setRecord(next);
    setPreferencesToggle(next.preferences);
    setStatusMessage(
      acceptPreferences
        ? 'Preferences storage enabled. You can withdraw consent anytime via Cookie Settings.'
        : 'Necessary only selected. Optional preference keys cleared.'
    );
    setTimeout(() => setStatusMessage(null), 4000);
    handleCloseSettings();
  };

  return (
    <>
      {/* Permanent floating Cookie Settings button so withdrawal is as easy as consent */}
      <button
        type="button"
        onClick={() => {
          setPreferencesToggle(record?.preferences ?? false);
          setShowSettingsModal(true);
        }}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/95 backdrop-blur border border-slate-300 shadow-lg text-xs font-bold text-[#153b70] hover:bg-blue-50 transition"
        title="Manage Cookie & Browser Storage Preferences"
      >
        <Cookie className="w-4 h-4 text-[#d92332]" />
        <span className="hidden sm:inline">Cookie Settings</span>
      </button>

      {/* Toast confirmation */}
      {statusMessage && (
        <div className="fixed bottom-16 left-4 z-50 max-w-sm bg-[#0f274a] text-white px-4 py-3 rounded-xl shadow-xl border border-blue-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Initial Consent Banner (only shown if no valid consent record exists) */}
      {!record && !showSettingsModal && (
        <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#153b70] flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-[#153b70]">
                  Cookies &amp; Browser Storage Notice
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {CONSENT_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                HI-TECH College uses strictly necessary session storage and asks permission before
                saving optional display or learning-canvas preferences. Zero analytics or advertising
                trackers are used.
              </p>

              {/* Equal-prominence action buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleChoose(false)}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg border-2 border-[#153b70] bg-white hover:bg-slate-50 text-[#153b70] text-xs font-extrabold transition text-center"
                >
                  Necessary only
                </button>
                <button
                  type="button"
                  onClick={() => handleChoose(true)}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg border-2 border-[#153b70] bg-[#153b70] hover:bg-[#0f274a] text-white text-xs font-extrabold transition text-center"
                >
                  Accept preferences
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:text-[#153b70] hover:bg-slate-100 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Policy &amp; Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Settings & Public Cookie Policy Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-[#0f274a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cookie className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-extrabold">
                    HI-TECH College — Cookie &amp; Storage Policy
                  </h2>
                  <p className="text-[11px] text-blue-200">
                    Policy Version {CONSENT_VERSION} • Local-only consent (zero server tracking)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseSettings}
                className="p-1.5 rounded-lg hover:bg-white/10 text-blue-100"
                aria-label="Close cookie settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Toggle Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-950 text-sm">
                      Strictly Necessary
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                      ALWAYS ACTIVE
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1.5 leading-relaxed">
                    Essential authentication renewal, app shell caching, and remembering your
                    consent choice.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#153b70] text-sm">
                      Optional Preferences
                    </span>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesToggle}
                        onChange={(e) => setPreferencesToggle(e.target.checked)}
                        className="w-4 h-4 accent-[#153b70]"
                      />
                      <span className="font-bold text-xs text-[#153b70]">
                        {preferencesToggle ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                  <p className="text-slate-600 mt-1.5 leading-relaxed">
                    Stores theme, accessibility font sizes, and interactive diagram sketches in your
                    browser only. Disabling deletes these keys immediately.
                  </p>
                </div>
              </div>

              {/* Single-source-of-truth Inventory Table */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#153b70]" />
                  <span>Browser Storage Inventory</span>
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Kind</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Purpose</th>
                        <th className="py-2.5 px-3">Lifetime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {STORAGE_INVENTORY.map((item) => (
                        <tr key={item.name} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#153b70]">
                            {item.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{item.kind}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.category === 'strictly_necessary'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.category === 'strictly_necessary'
                                ? 'Strictly necessary'
                                : 'Preferences (consent)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{item.purpose}</td>
                          <td className="py-2.5 px-3 text-slate-500">{item.lifetime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Protection Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Data Protection Act, 2019 Notice:</strong> Zero third-party analytics or
                advertising cookies are active. Consent choices live solely in your browser and may
                be withdrawn at any time. Contact{' '}
                <span className="font-mono font-bold">dpo@hitech.ac.ke</span> for institutional
                privacy inquiries.
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                {record
                  ? `Saved: ${record.preferences ? 'Preferences Accepted' : 'Necessary Only'} (${new Date(record.updatedAt).toLocaleDateString()})`
                  : 'No choice saved yet'}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleChoose(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-[#153b70] bg-white hover:bg-slate-100 text-[#153b70] text-xs font-extrabold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Necessary only</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChoose(preferencesToggle)}
                  className="px-4 py-2 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition"
                >
                  Save Current Toggle
                </button>
                <button
                  type="button"
                  onClick={() => handleChoose(true)}
                  className="px-4 py-2 rounded-lg border-2 border-[#153b70] bg-[#153b70] hover:bg-[#0f274a] text-white text-xs font-extrabold transition"
                >
                  Accept preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { QrCode, ShieldCheck, Send, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { campusServicesService } from '../../services/campusServicesService';
import { COLLEGE_INFO, COURSES_CATALOGUE } from '../../data/college';

interface PublicVerifyEnquireModalsProps {
  verifyModalOpen: boolean;
  onCloseVerify: () => void;
  enquireModalOpen: boolean;
  onCloseEnquire: () => void;
}

export default function PublicVerifyEnquireModals({
  verifyModalOpen,
  onCloseVerify,
  enquireModalOpen,
  onCloseEnquire,
}: PublicVerifyEnquireModalsProps) {
  const [verifyOpenInternal, setVerifyOpenInternal] = useState(false);
  const [enquireOpenInternal, setEnquireOpenInternal] = useState(false);

  const [codeInput, setCodeInput] = useState(
    () => campusServicesService.getState().credentials[0]?.verificationCode ?? ''
  );
  const [verifyResult, setVerifyResult] = useState<ReturnType<
    typeof campusServicesService.verifyPublicCredential
  > | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [programme, setProgramme] = useState(COURSES_CATALOGUE[0].title);
  const [campus, setCampus] = useState(COLLEGE_INFO.campuses[0].name);
  const [intake, setIntake] = useState('January 2027 Intake');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [enqFeedback, setEnqFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vCode = params.get('verify');
    if (vCode) {
      setCodeInput(vCode);
      setVerifyResult(campusServicesService.verifyPublicCredential(vCode));
      setVerifyOpenInternal(true);
    }
    if (params.get('enquire') === '1') {
      setEnquireOpenInternal(true);
    }
  }, []);

  const showVerify = verifyModalOpen || verifyOpenInternal;
  const showEnquire = enquireModalOpen || enquireOpenInternal;

  const closeVerify = () => {
    setVerifyOpenInternal(false);
    onCloseVerify();
  };

  const closeEnquire = () => {
    setEnquireOpenInternal(false);
    onCloseEnquire();
  };

  return (
    <>
      {/* PUBLIC CREDENTIAL VERIFICATION MODAL (/?verify=CODE) */}
      {showVerify && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-[#0f274a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-extrabold">
                    HI-TECH Public Credential Verification
                  </h2>
                  <p className="text-[11px] text-blue-200">
                    Privacy-minimized check • First Name &amp; Last Initial only
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeVerify}
                className="p-1 rounded-lg hover:bg-white/10"
                aria-label="Close credential verification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Verification Code e.g. HTC-2026-8419-Y7"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() =>
                    setVerifyResult(campusServicesService.verifyPublicCredential(codeInput))
                  }
                  className="px-4 py-2 rounded-lg bg-[#153b70] hover:bg-[#0f274a] text-white font-extrabold"
                >
                  Verify
                </button>
              </div>

              {verifyResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    verifyResult.found
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {verifyResult.found ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>{verifyResult.maskedHolderName}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-black text-[10px]">
                          {verifyResult.status}
                        </span>
                      </div>
                      <div className="font-bold">{verifyResult.programme}</div>
                      <div className="text-[11px] text-emerald-800">
                        Award: {verifyResult.awardType} • Completed: {verifyResult.completionDate} •
                        Issued: {verifyResult.issueDate}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        Code: <span className="font-mono">{verifyResult.verificationCode}</span> •
                        Public Verification Count: {verifyResult.verificationCount}
                      </div>
                    </>
                  ) : (
                    <div className="font-bold">
                      No matching issued, replaced, or revoked credential found for "{codeInput}".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC ADMISSIONS CRM ENQUIRY MODAL (/?enquire=1) */}
      {showEnquire && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 bg-[#153b70] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-extrabold">Admissions Enquiry Desk (/?enquire=1)</h2>
                  <p className="text-[11px] text-blue-200">
                    Routes directly into the Admissions CRM Advisor Pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEnquire}
                className="p-1 rounded-lg hover:bg-white/10"
                aria-label="Close admissions enquiry"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              {enqFeedback && (
                <div
                  className={`p-3 rounded-xl border font-bold flex items-center gap-2 ${
                    enqFeedback.type === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {enqFeedback.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{enqFeedback.text}</span>
                </div>
              )}

              {/* Hidden Honeypot Anti-Spam Field */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <input
                type="text"
                placeholder="Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2"
                />
                <input
                  type="tel"
                  placeholder="Phone (+2547...)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                {COURSES_CATALOGUE.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  {COLLEGE_INFO.campuses.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={intake}
                  onChange={(e) => setIntake(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="January 2027 Intake">January 2027 Intake</option>
                  <option value="May 2027 Intake">May 2027 Intake</option>
                  <option value="September 2027 Intake">September 2027 Intake</option>
                </select>
              </div>
              <textarea
                placeholder="Questions about entry requirements, study mode, or fees..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <label className="flex items-start gap-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-[#153b70]"
                />
                <span>
                  I consent to HI-TECH College contacting me regarding programme admissions under
                  the Kenya Data Protection Act, 2019.
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (!fullName || !email || !phone) {
                    setEnqFeedback({ type: 'err', text: 'Enter name, email, and phone number.' });
                    return;
                  }
                  const res = campusServicesService.submitPublicEnquiry({
                    fullName,
                    email,
                    phone,
                    programmeInterest: programme,
                    preferredCampus: campus,
                    intake,
                    message: message || 'Requesting prospectus and intake guidance.',
                    consentGiven: consent,
                    honeypot,
                  });
                  if (res.ok) {
                    setEnqFeedback({
                      type: 'ok',
                      text: `Enquiry logged cleanly! Reference: ${res.reference}. Visible inside Campus Services -> Admissions CRM.`,
                    });
                    setFullName('');
                    setEmail('');
                    setPhone('');
                    setMessage('');
                  } else {
                    setEnqFeedback({ type: 'err', text: res.error || 'Failed to submit enquiry.' });
                  }
                }}
                className="w-full bg-[#d92332] hover:bg-[#b81d2a] text-white py-2.5 rounded-xl font-extrabold"
              >
                Submit Admissions Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

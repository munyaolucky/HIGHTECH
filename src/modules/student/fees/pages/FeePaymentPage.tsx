import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Landmark,
  Receipt,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { useToast } from '../../../../shared/components/toast/useToast';
import {
  formatKes,
  generateIdempotencyKey,
  normalizeKenyanPhoneClient,
  studentFeesApi,
} from '../feesApi';
import type { FinancePaymentRecord, StudentFeesOverviewDto } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function FeePaymentPage({
  onNavigate,
  onNotify,
  onRefresh,
}: StudentFeesPageProps) {
  const { toast } = useToast();
  const [overview, setOverview] = useState<StudentFeesOverviewDto>(() =>
    studentFeesApi.getSyncOverview()
  );
  const [channel, setChannel] = useState<'MPESA' | 'BANK'>('MPESA');

  // M-Pesa STK state
  const [phone, setPhone] = useState('0712345678');
  const [amount, setAmount] = useState('5000');
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());
  const [stkLoading, setStkLoading] = useState(false);
  const [stkError, setStkError] = useState<string | null>(null);
  const [activeStkPayment, setActiveStkPayment] = useState<FinancePaymentRecord | null>(null);
  const [stkFeedback, setStkFeedback] = useState<string | null>(null);
  const [lastReceiptNo, setLastReceiptNo] = useState<string | null>(null);

  // Bank deposit state
  const [bankName, setBankName] = useState('KCB Bank Kenya');
  const [bankRef, setBankRef] = useState('');
  const [bankAmount, setBankAmount] = useState('5000');
  const [depositedAt, setDepositedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [bankNotes, setBankNotes] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);

  const loadOverview = async () => {
    try {
      const next = await studentFeesApi.getOverview();
      setOverview(next);
      if (next.outstandingBalance > 0) {
        const suggested = String(Math.min(next.nextInstalment || next.outstandingBalance, next.outstandingBalance));
        setAmount((prev) => (Number(prev) > next.outstandingBalance ? suggested : prev));
      }
    } catch {
      // keep preview defaults
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const notifyUser = (type: 'ok' | 'err', msg: string) => {
    onNotify?.(type, msg);
    toast({
      type: type === 'ok' ? 'success' : 'error',
      title: type === 'ok' ? 'Fees & Payments' : 'Payment Notice',
      message: msg,
    });
  };

  const handleStkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStkError(null);
    setStkFeedback(null);
    setLastReceiptNo(null);

    try {
      normalizeKenyanPhoneClient(phone);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid Kenyan mobile number.';
      setStkError(msg);
      return;
    }

    const numericAmount = Math.round(Number(amount));
    if (!Number.isFinite(numericAmount) || numericAmount < 100) {
      setStkError('Minimum M-Pesa fee payment is KES 100.');
      return;
    }

    setStkLoading(true);
    try {
      const res = await studentFeesApi.initiateMpesaStkPush(
        { phoneNumber: phone, amount: numericAmount },
        idempotencyKey
      );
      setActiveStkPayment(res.payment);
      setStkFeedback(res.customerMessage);
      notifyUser('ok', 'M-Pesa STK Push sent to your phone.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to start M-Pesa STK Push.';
      setStkError(msg);
      notifyUser('err', msg);
    } finally {
      setStkLoading(false);
    }
  };

  const handleSandboxOutcome = async (outcome: 'SUCCESS' | 'CANCELLED' | 'FAILED') => {
    if (!activeStkPayment) return;
    setStkLoading(true);
    setStkError(null);
    try {
      const res = await studentFeesApi.completeSandboxStkPayment(activeStkPayment.id, outcome);
      if (res.status === 'CONFIRMED') {
        setLastReceiptNo(res.receipt?.receiptNumber ?? res.payment?.receiptNumber ?? 'RCT-2026');
        setStkFeedback(
          `Payment confirmed! Official receipt ${res.receipt?.receiptNumber ?? ''} issued.`
        );
        setActiveStkPayment(null);
        setIdempotencyKey(generateIdempotencyKey());
        await loadOverview();
        onRefresh?.();
        notifyUser(
          'ok',
          `M-Pesa payment confirmed. Receipt ${res.receipt?.receiptNumber ?? ''} issued.`
        );
      } else {
        setStkFeedback(`Transaction ended with status: ${res.status}.`);
        setActiveStkPayment(null);
        setIdempotencyKey(generateIdempotencyKey());
        notifyUser('err', `M-Pesa prompt ${res.status.toLowerCase()}.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to settle sandbox STK Push.';
      setStkError(msg);
      notifyUser('err', msg);
    } finally {
      setStkLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSubmitting(true);
    try {
      const res = await studentFeesApi.submitBankReference({
        bankName,
        referenceNumber: bankRef,
        amount: Number(bankAmount),
        depositedAt,
        notes: bankNotes,
      });
      setBankRef('');
      setBankNotes('');
      await loadOverview();
      onRefresh?.();
      notifyUser(
        'ok',
        `Bank deposit ${res.payment.referenceNumber} submitted for Finance Officer verification.`
      );
    } catch (err) {
      notifyUser(
        'err',
        err instanceof Error ? err.message : 'Could not submit bank deposit reference.'
      );
    } finally {
      setBankSubmitting(false);
    }
  };

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Lipa na M-Pesa &amp; Bank Channels
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Pay Fees
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Pay via Safaricom M-Pesa STK Push or submit an approved bank slip reference for reconciliation.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-right">
          <span className="text-slate-500 dark:text-slate-400 block">Outstanding Balance</span>
          <strong className="text-lg font-bold font-mono tabular-nums text-[#092c60] dark:text-blue-300">
            {formatKes(overview.outstandingBalance)}
          </strong>
        </div>
      </header>

      {/* Channel Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setChannel('MPESA')}
          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 border ${
            channel === 'MPESA'
              ? 'bg-[#092c60] text-white border-[#092c60]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
          }`}
        >
          <Smartphone size={15} aria-hidden="true" />
          <span>M-Pesa STK Push</span>
        </button>
        <button
          type="button"
          onClick={() => setChannel('BANK')}
          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 border ${
            channel === 'BANK'
              ? 'bg-[#092c60] text-white border-[#092c60]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
          }`}
        >
          <Landmark size={15} aria-hidden="true" />
          <span>Bank Deposit / EFT Reference</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          {channel === 'MPESA' ? (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 text-xs">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Smartphone size={16} className="text-emerald-600" aria-hidden="true" />
                    <span>Safaricom M-Pesa Express (STK Push)</span>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    Paybill <strong className="font-mono">890123</strong> · Account{' '}
                    <strong className="font-mono">{overview.account.studentRegNo}</strong>
                  </p>
                </div>
                <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Instant Receipt
                </span>
              </div>

              <form onSubmit={handleStkSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="mpesa-phone-input"
                    className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                  >
                    Safaricom Phone Number
                  </label>
                  <input
                    id="mpesa-phone-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712345678 or 254712345678"
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="mpesa-amount-input"
                      className="font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Amount to Pay (KES)
                    </label>
                    {overview.outstandingBalance > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAmount(String(overview.nextInstalment || overview.outstandingBalance))
                          }
                          className="text-[11px] font-semibold text-[#1769AA] hover:underline"
                        >
                          Next Instalment ({formatKes(overview.nextInstalment)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount(String(overview.outstandingBalance))}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          Full Balance
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    id="mpesa-amount-input"
                    type="number"
                    min={100}
                    max={Math.max(100, overview.outstandingBalance)}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                {stkError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 flex items-start gap-2"
                  >
                    <XCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{stkError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={stkLoading || overview.outstandingBalance <= 0}
                  className="w-full min-h-[42px] py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  {stkLoading ? 'Sending STK Push…' : 'Send M-Pesa Payment Prompt'}
                </button>
              </form>

              {stkFeedback && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 space-y-3">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    {stkFeedback}
                  </p>
                  {activeStkPayment && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Checkout ID:{' '}
                        <span className="font-mono font-semibold">
                          {activeStkPayment.referenceNumber}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={stkLoading}
                          onClick={() => void handleSandboxOutcome('SUCCESS')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                        >
                          Simulate M-Pesa PIN Confirmation
                        </button>
                        <button
                          type="button"
                          disabled={stkLoading}
                          onClick={() => void handleSandboxOutcome('CANCELLED')}
                          className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-lg"
                        >
                          Cancel on Handset
                        </button>
                      </div>
                    </div>
                  )}
                  {lastReceiptNo && (
                    <button
                      type="button"
                      onClick={() => onNavigate?.('fees-receipts')}
                      className="px-3.5 py-2 bg-[#092c60] text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Receipt size={14} aria-hidden="true" />
                      <span>Open Official Receipt ({lastReceiptNo})</span>
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 size={16} className="text-[#1769AA]" aria-hidden="true" />
                  <span>Submit Bank Deposit / EFT Slip</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Submitted references remain PENDING until verified by the Finance Officer.
                </p>
              </div>

              <form onSubmit={handleBankSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bank-name-select"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Collection Bank
                    </label>
                    <select
                      id="bank-name-select"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                    >
                      <option value="KCB Bank Kenya">KCB Bank Kenya (1104829103)</option>
                      <option value="Equity Bank Kenya">Equity Bank Kenya (01802994128)</option>
                      <option value="Co-operative Bank">Co-operative Bank (01129482710)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="bank-date-input"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Deposit Date
                    </label>
                    <input
                      id="bank-date-input"
                      type="date"
                      required
                      value={depositedAt}
                      onChange={(e) => setDepositedAt(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bank-ref-input"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Bank Reference / Slip No
                    </label>
                    <input
                      id="bank-ref-input"
                      type="text"
                      required
                      value={bankRef}
                      onChange={(e) => setBankRef(e.target.value)}
                      placeholder="e.g. KCB9948210"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bank-amt-input"
                      className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                    >
                      Amount Deposited (KES)
                    </label>
                    <input
                      id="bank-amt-input"
                      type="number"
                      min={100}
                      required
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bank-notes-input"
                    className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                  >
                    Branch / Teller Notes (Optional)
                  </label>
                  <input
                    id="bank-notes-input"
                    type="text"
                    value={bankNotes}
                    onChange={(e) => setBankNotes(e.target.value)}
                    placeholder="e.g. Moi Avenue Branch cash deposit"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bankSubmitting}
                  className="w-full min-h-[42px] py-2.5 bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold rounded-lg"
                >
                  {bankSubmitting ? 'Submitting Bank Reference…' : 'Submit Bank Reference for Verification'}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Approved Collection Accounts Guide */}
        <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" aria-hidden="true" />
            <span>Approved Fee Payment Channels</span>
          </h2>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block">
                M-Pesa Paybill (Automated)
              </strong>
              <p className="font-mono text-slate-700 dark:text-slate-300">
                Business No: 890123 · Account: {overview.account.studentRegNo}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block">
                KCB Bank Kenya · Nairobi Main
              </strong>
              <p className="font-mono text-slate-700 dark:text-slate-300">
                Account: 1104829103 · HI-TECH College Fees Collection
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 block">
                Equity Bank Kenya · Campus Branch
              </strong>
              <p className="font-mono text-slate-700 dark:text-slate-300">
                Account: 01802994128 · Quote Reg No on deposit slip
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-slate-700 dark:text-slate-200 flex items-start gap-2">
            <CheckCircle2 size={15} className="text-[#1769AA] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              All confirmed transactions automatically generate tamper-evident official receipts and update your examination clearance standing.
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useToast } from '../../../../shared/components/toast/useToast';
import { formatKes, studentFeesApi } from '../feesApi';
import type { FinanceRefundRequestRecord } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function RefundRequestsPage({ onNotify }: StudentFeesPageProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<FinanceRefundRequestRecord[]>(() =>
    studentFeesApi.getSyncRefunds()
  );
  const [amount, setAmount] = useState('');
  const [payoutChannel, setPayoutChannel] = useState<'MPESA' | 'BANK'>('MPESA');
  const [payoutAccount, setPayoutAccount] = useState('254712345678');
  const [supportingReference, setSupportingReference] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRefunds = async () => {
    try {
      const res = await studentFeesApi.listRefundRequests();
      setRequests(res.requests);
    } catch (err) {
      onNotify?.('err', err instanceof Error ? err.message : 'Unable to load refund requests.');
    }
  };

  useEffect(() => {
    void loadRefunds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await studentFeesApi.submitRefundRequest({
        amount: Number(amount),
        payoutChannel,
        payoutAccount,
        supportingReference,
        reason,
      });
      setAmount('');
      setSupportingReference('');
      setReason('');
      await loadRefunds();
      const msg = `Refund request ${res.request.id} submitted for Bursar review.`;
      onNotify?.('ok', msg);
      toast({ type: 'success', title: 'Refund Request Filed', message: msg });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Refund submission failed.';
      onNotify?.('err', msg);
      toast({ type: 'error', title: 'Refund Validation', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
          Overpayment &amp; Deposit Claims
        </span>
        <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
          Refund Requests
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          Claim verified fee overpayments, duplicate M-Pesa settlements, or refundable caution deposits.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <RotateCcw size={15} className="text-[#1769AA]" aria-hidden="true" />
            <span>New Refund Application</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="refund-amount-input"
                className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
              >
                Refund Amount (KES)
              </label>
              <input
                id="refund-amount-input"
                type="number"
                min={100}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="refund-channel-select"
                  className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  Payout Channel
                </label>
                <select
                  id="refund-channel-select"
                  value={payoutChannel}
                  onChange={(e) =>
                    setPayoutChannel(e.target.value === 'BANK' ? 'BANK' : 'MPESA')
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
                >
                  <option value="MPESA">M-Pesa Mobile Money</option>
                  <option value="BANK">Bank EFT Transfer</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="refund-account-input"
                  className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
                >
                  {payoutChannel === 'MPESA' ? 'M-Pesa Phone' : 'Bank Account No'}
                </label>
                <input
                  id="refund-account-input"
                  type="text"
                  required
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="refund-ref-input"
                className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
              >
                Supporting Receipt / M-Pesa Reference (Optional)
              </label>
              <input
                id="refund-ref-input"
                type="text"
                value={supportingReference}
                onChange={(e) => setSupportingReference(e.target.value)}
                placeholder="e.g. QWE82KLM"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg font-mono uppercase"
              />
            </div>

            <div>
              <label
                htmlFor="refund-reason-input"
                className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
              >
                Detailed Refund Justification
              </label>
              <textarea
                id="refund-reason-input"
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe overpayment, dropped unit credit, or caution deposit refund..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[40px] py-2 bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold rounded-lg"
            >
              {submitting ? 'Submitting Request…' : 'Submit Refund Request'}
            </button>
          </form>
        </section>

        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Refund Tracking Queue ({requests.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {requests.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No refund requests submitted yet.</p>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="font-mono text-[#092c60] dark:text-blue-300">
                      {req.id} · {formatKes(req.amount)}
                    </strong>
                    <span
                      className={`font-bold ${
                        req.status === 'APPROVED' || req.status === 'DISBURSED'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : req.status === 'REJECTED'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">{req.reason}</p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Payout: {req.payoutChannel} ({req.payoutAccount}) · Submitted{' '}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                  {req.reviewerNotes && (
                    <p className="text-slate-600 dark:text-slate-300">
                      Finance Review ({req.reviewedByName ?? 'Bursar'}):{' '}
                      <strong>{req.reviewerNotes}</strong>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

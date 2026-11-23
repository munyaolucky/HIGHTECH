import React, { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../../shared/components/toast/useToast';
import { formatKes, studentFeesApi } from '../feesApi';
import type { FinancePaymentPlanRecord } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function PaymentPlansPage({ onNavigate, onNotify }: StudentFeesPageProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<FinancePaymentPlanRecord[]>(() =>
    studentFeesApi.getSyncPlans()
  );
  const [instalmentCount, setInstalmentCount] = useState('3');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPlans = async () => {
    try {
      const res = await studentFeesApi.getPaymentPlans();
      setPlans(res.plans);
    } catch (err) {
      onNotify?.('err', err instanceof Error ? err.message : 'Unable to load payment plans.');
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const handleRequestPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await studentFeesApi.requestPaymentPlan({
        instalmentCount: Number(instalmentCount),
        requestedNotes: notes,
      });
      setNotes('');
      await loadPlans();
      const msg = `Payment plan ${res.plan.id} submitted for Finance review.`;
      onNotify?.('ok', msg);
      toast({ type: 'success', title: 'Payment Plan Submitted', message: msg });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to request payment plan.';
      onNotify?.('err', msg);
      toast({ type: 'error', title: 'Payment Plan Notice', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Instalment Arrangements
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Payment Plans
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Review approved term instalment schedules or apply to split remaining fees cleanly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.('fees-pay')}
          className="min-h-[40px] px-4 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white text-xs font-semibold rounded-lg shrink-0"
        >
          Pay Due Instalment
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">
          {plans.map((plan) => {
            const totalPaid = plan.instalments.reduce((s, i) => s + i.paidAmount, 0);
            const pct =
              plan.totalCoveredAmount > 0
                ? Math.min(100, Math.round((totalPaid / plan.totalCoveredAmount) * 100))
                : 0;
            return (
              <section
                key={plan.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <strong className="text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <CalendarClock size={16} className="text-[#1769AA]" aria-hidden="true" />
                      <span>
                        {plan.id} · {plan.termLabel}
                      </span>
                    </strong>
                    {plan.requestedNotes && (
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        {plan.requestedNotes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`font-bold uppercase ${
                      plan.status === 'ACTIVE' || plan.status === 'COMPLETED'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : plan.status === 'PENDING_APPROVAL'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {plan.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200">
                    <span>Schedule Progress ({formatKes(totalPaid)} of {formatKes(plan.totalCoveredAmount)})</span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                  <progress
                    value={pct}
                    max={100}
                    aria-label={`Payment plan progress ${pct} percent`}
                    className="w-full h-2.5 rounded-lg overflow-hidden accent-emerald-600 bg-slate-200 dark:bg-slate-800"
                  />
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {plan.instalments.map((inst) => (
                    <div
                      key={inst.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <strong className="text-slate-900 dark:text-slate-100 block">
                          {inst.label}
                        </strong>
                        <span className="text-slate-500">Due Date: {inst.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatKes(inst.amount)}
                        </span>
                        <span
                          className={`font-semibold inline-flex items-center gap-1 ${
                            inst.status === 'PAID'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : inst.status === 'DUE'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {inst.status === 'PAID' && <CheckCircle2 size={13} aria-hidden="true" />}
                          {inst.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Request Custom Plan Form */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-xs h-fit">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Request Balance Payment Plan
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Split your outstanding balance across 2 to 6 bi-weekly instalments subject to Finance approval.
          </p>

          <form onSubmit={handleRequestPlan} className="space-y-3.5">
            <div>
              <label
                htmlFor="plan-count-select"
                className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
              >
                Number of Instalments
              </label>
              <select
                id="plan-count-select"
                value={instalmentCount}
                onChange={(e) => setInstalmentCount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              >
                <option value="2">2 Instalments (1 Month)</option>
                <option value="3">3 Instalments (6 Weeks)</option>
                <option value="4">4 Instalments (8 Weeks)</option>
                <option value="6">6 Instalments (Full Term)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="plan-notes-input"
                className="block font-semibold text-slate-700 dark:text-slate-200 mb-1"
              >
                Reason / Sponsor Commitment
              </label>
              <textarea
                id="plan-notes-input"
                rows={4}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain expected disbursement dates or family commitment..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[40px] py-2 bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold rounded-lg"
            >
              {submitting ? 'Submitting Plan…' : 'Submit Payment Plan Request'}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}

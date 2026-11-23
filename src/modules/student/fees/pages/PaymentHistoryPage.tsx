import React, { useEffect, useMemo, useState } from 'react';
import { History, Receipt, Search } from 'lucide-react';
import { formatKes, studentFeesApi } from '../feesApi';
import type { StudentPaymentListItem } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function PaymentHistoryPage({ onNavigate, onNotify }: StudentFeesPageProps) {
  const [payments, setPayments] = useState<StudentPaymentListItem[]>(() =>
    studentFeesApi.getSyncPayments()
  );
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentPaymentListItem | null>(null);

  const loadPayments = async () => {
    try {
      const res = await studentFeesApi.listPayments();
      setPayments(res.payments);
    } catch (err) {
      onNotify?.('err', err instanceof Error ? err.message : 'Could not fetch payment history.');
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (methodFilter !== 'ALL' && p.method !== methodFilter) return false;
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q) ||
        (p.receiptNumber ?? '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [payments, statusFilter, methodFilter, search]);

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Transaction Records
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Payment History
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            All initiated, pending, confirmed, and cancelled fee payments across M-Pesa and banks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.('fees-pay')}
          className="min-h-[40px] px-4 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white text-xs font-semibold rounded-lg shrink-0"
        >
          Make New Payment
        </button>
      </header>

      {/* Filter Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter payments by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            aria-label="Filter payments by method"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
          >
            <option value="ALL">All Channels</option>
            <option value="MPESA">M-Pesa</option>
            <option value="BANK">Bank Deposit</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference or receipt..."
            aria-label="Search payment history"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Payment ID</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Method &amp; Ref</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-slate-500">
                      No transactions match your selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-[#092c60] dark:text-blue-300 whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(tx.paidAt || tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {tx.channelLabel}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {tx.referenceNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatKes(tx.amount)}
                      </td>
                      <td className="py-3 px-4 font-semibold whitespace-nowrap">
                        <span
                          className={
                            tx.status === 'CONFIRMED'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : tx.status === 'PENDING'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-red-700 dark:text-red-400'
                          }
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelected(tx)}
                          className="font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History size={15} className="text-[#1769AA]" aria-hidden="true" />
            <span>Transaction Inspector</span>
          </h2>
          {selected ? (
            <div className="space-y-3">
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-2 flex justify-between gap-2">
                  <dt className="text-slate-500">Transaction ID</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {selected.id}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <dt className="text-slate-500">Channel</dt>
                  <dd className="font-semibold">{selected.channelLabel}</dd>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <dt className="text-slate-500">Reference</dt>
                  <dd className="font-mono">{selected.referenceNumber}</dd>
                </div>
                {selected.checkoutRequestId && (
                  <div className="py-2 flex justify-between gap-2">
                    <dt className="text-slate-500">Checkout ID</dt>
                    <dd className="font-mono truncate max-w-[160px]">
                      {selected.checkoutRequestId}
                    </dd>
                  </div>
                )}
                <div className="py-2 flex justify-between gap-2">
                  <dt className="text-slate-500">Amount</dt>
                  <dd className="font-mono font-bold text-emerald-700">
                    {formatKes(selected.amount)}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold">{selected.status}</dd>
                </div>
              </dl>
              <p className="text-slate-600 dark:text-slate-300">{selected.description}</p>
              {selected.receiptNumber && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('fees-receipts')}
                  className="w-full py-2 bg-[#092c60] hover:bg-[#1769AA] text-white font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
                >
                  <Receipt size={14} aria-hidden="true" />
                  <span>View Receipt {selected.receiptNumber}</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              Select Inspect on any transaction row to view M-Pesa checkout telemetry and receipt status.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}

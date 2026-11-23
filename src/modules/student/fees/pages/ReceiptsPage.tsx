import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, Printer, Receipt } from 'lucide-react';
import { downloadStudentDocument } from '../../../../services/studentPortalService';
import { formatKes, studentFeesApi } from '../feesApi';
import type { FinanceReceiptRecord } from '../fees.types';
import type { StudentFeesPageProps } from './StudentFeesDashboard';

export default function ReceiptsPage({ onNotify }: StudentFeesPageProps) {
  const [receipts, setReceipts] = useState<FinanceReceiptRecord[]>(() =>
    studentFeesApi.getSyncReceipts()
  );
  const [selectedId, setSelectedId] = useState<string>(
    () => studentFeesApi.getSyncReceipts()[0]?.id ?? ''
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await studentFeesApi.listReceipts();
        setReceipts(res.receipts);
        if (res.receipts.length > 0 && !res.receipts.some((r) => r.id === selectedId)) {
          setSelectedId(res.receipts[0].id);
        }
      } catch (err) {
        onNotify?.('err', err instanceof Error ? err.message : 'Unable to fetch official receipts.');
      }
    })();
  }, []);

  const selected = receipts.find((r) => r.id === selectedId) ?? receipts[0] ?? null;

  const handleDownloadReceipt = (receipt: FinanceReceiptRecord) => {
    const content = [
      'HI-TECH COLLEGE — OFFICIAL FEE PAYMENT RECEIPT',
      '======================================================',
      `Receipt Number:    ${receipt.receiptNumber}`,
      `Verification Code: ${receipt.verificationCode}`,
      `Student Name:      ${receipt.studentName}`,
      `Registration No:   ${receipt.studentRegNo}`,
      `Programme:         ${receipt.programme}`,
      `Term:              ${receipt.termLabel}`,
      `Payment Method:    ${receipt.method}`,
      `External Ref:      ${receipt.referenceNumber}`,
      `Amount Paid:       ${formatKes(receipt.amount)}.00`,
      `Description:       ${receipt.description}`,
      `Issued Timestamp:  ${new Date(receipt.issuedAt).toLocaleString()}`,
      '======================================================',
      'Verified by HI-TECH College Student Finance Ledger.',
    ].join('\n');
    downloadStudentDocument(`${receipt.receiptNumber}.txt`, content);
    onNotify?.('ok', `Official receipt ${receipt.receiptNumber} downloaded.`);
  };

  return (
    <main className="space-y-6">
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1769AA] dark:text-blue-400 block">
            Verified Financial Documents
          </span>
          <h1 className="text-2xl font-bold text-[#092c60] dark:text-white tracking-tight">
            Official Receipts
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Print or export tamper-evident receipts for verified M-Pesa and bank tuition payments.
          </p>
        </div>

        {selected && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && typeof window.print === 'function') {
                  window.print();
                }
              }}
              className="min-h-[38px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5"
            >
              <Printer size={14} aria-hidden="true" />
              <span>Print Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadReceipt(selected)}
              className="min-h-[38px] px-3.5 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Download size={14} aria-hidden="true" />
              <span>Export Receipt</span>
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Receipts List */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden print:hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <strong className="text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt size={15} className="text-[#1769AA]" aria-hidden="true" />
              <span>Issued Receipts ({receipts.length})</span>
            </strong>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {receipts.map((r) => (
              <div
                key={r.id}
                className={`p-4 flex items-center justify-between gap-3 text-xs ${
                  selected?.id === r.id ? 'bg-blue-50/70 dark:bg-slate-800/70' : ''
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="font-mono font-bold text-[#092c60] dark:text-blue-300 hover:underline text-left block"
                  >
                    {r.receiptNumber}
                  </button>
                  <p className="text-slate-700 dark:text-slate-200 truncate">{r.description}</p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {r.method} · Ref {r.referenceNumber} · {new Date(r.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <strong className="block font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatKes(r.amount)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(r)}
                    className="text-[11px] font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Printable Receipt Sheet */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 text-xs">
          {selected ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    HI-TECH COLLEGE · FINANCE OFFICE
                  </span>
                  <h2 className="text-lg font-bold text-[#092c60] dark:text-white mt-0.5">
                    Official Fee Receipt
                  </h2>
                </div>
                <div className="text-right">
                  <strong className="font-mono text-sm text-[#092c60] dark:text-blue-300 block">
                    {selected.receiptNumber}
                  </strong>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} aria-hidden="true" /> Verified Ledger Copy
                  </span>
                </div>
              </div>

              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500">Candidate Name</dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100">
                    {selected.studentName}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500">Registration Number</dt>
                  <dd className="font-mono font-semibold">{selected.studentRegNo}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500">Programme &amp; Term</dt>
                  <dd className="text-right">
                    {selected.programme} · {selected.termLabel}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500">Payment Channel &amp; Ref</dt>
                  <dd className="font-mono">
                    {selected.method} · {selected.referenceNumber}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500">Date Issued</dt>
                  <dd className="font-mono">{new Date(selected.issuedAt).toLocaleString()}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-2">
                  <dt className="text-slate-500">Verification Hash</dt>
                  <dd className="font-mono text-[#1769AA] dark:text-blue-400">
                    {selected.verificationCode}
                  </dd>
                </div>
              </dl>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Total Receipted Amount
                </span>
                <strong className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatKes(selected.amount)}.00
                </strong>
              </div>
            </>
          ) : (
            <p className="text-slate-500">No verified receipts issued yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

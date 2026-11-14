import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck,
  QrCode,
  CreditCard,
  FileText,
} from 'lucide-react';
import { FeeTransaction } from '../types';

interface FeeReceiptModalProps {
  transaction: FeeTransaction | null;
  onClose: () => void;
}

export default function FeeReceiptModal({
  transaction,
  onClose,
}: FeeReceiptModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const text = `
============================================================
              HI-TECH COLLEGE OF ACADEMIA & TECH
               OFFICIAL BURSARY PAYMENT RECEIPT
============================================================
Receipt Number   : ${transaction.receiptNumber}
Transaction Date : ${new Date(transaction.timestamp).toLocaleString()}
Student Reg No   : ${transaction.studentRegNo}
Student Name     : ${transaction.studentName}
Payment Channel  : ${transaction.paymentMethod}
M-Pesa / Bank Ref: ${transaction.referenceNumber}
Status           : ${transaction.status}
------------------------------------------------------------
PURPOSE / DESCRIPTION:
${transaction.description}
------------------------------------------------------------
TOTAL AMOUNT PAID: KES ${transaction.amount.toLocaleString()}.00
------------------------------------------------------------
Verification Hash: HCA-VERIFY-${transaction.id}-${Date.now().toString(36).toUpperCase()}
Issued By        : Finance & Student Accounts Directorate
Main Campus      : Nairobi Commercial Center, Moi Avenue
ISO 9001:2015 & TVETA Certified Institution
============================================================
    `.trim();

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Official_Receipt_${transaction.receiptNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-8">
        {/* MODAL ACTION BAR */}
        <div className="bg-[#092c60] text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="text-amber-400" size={18} />
            <h2 className="text-sm font-bold tracking-tight">Official Bursary Fee Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print Receipt"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={handleDownloadText}
              type="button"
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#092c60] rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              title="Download text file"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div ref={printableRef} className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          {/* HEADER */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#092c60] text-amber-400 flex items-center justify-center font-black">
                  <Building2 size={18} />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-[#092c60]">HI-TECH COLLEGE</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Office of the Registrar &amp; Finance Controller
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Nairobi Main Campus · P.O. Box 45000-00100 Nairobi · payments@hitech.ac.ke
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                {transaction.status} · PAID
              </span>
              <div className="mt-2 text-xs font-mono font-bold text-slate-900">
                {transaction.receiptNumber}
              </div>
              <div className="text-[10px] text-slate-500">
                {new Date(transaction.timestamp).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* STUDENT & PAYMENT DETAILS */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Student Name</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{transaction.studentName}</strong>
              <span className="font-mono text-blue-900 font-bold text-[11px]">
                {transaction.studentRegNo}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Method</span>
              <strong className="text-emerald-700 font-bold text-sm block mt-0.5 flex items-center gap-1">
                <CreditCard size={14} /> {transaction.paymentMethod}
              </strong>
              <span className="font-mono text-slate-600 text-[11px]">
                Ref: {transaction.referenceNumber}
              </span>
            </div>
          </div>

          {/* ITEMIZATION TABLE */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#092c60] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Item Description</th>
                  <th className="py-2.5 px-4 font-bold text-right">Amount (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {transaction.description || 'Academic Tuition & Semester Lab Allocation'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    KES {transaction.amount.toLocaleString()}.00
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900 text-right">Total Cleared</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                    KES {transaction.amount.toLocaleString()}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FOOTER & SECURITY STAMP */}
          <div className="pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-lg p-1.5 border border-slate-300 flex items-center justify-center text-slate-700">
                <QrCode size={44} />
              </div>
              <div className="text-[10px] text-slate-500">
                <span className="font-bold text-slate-700 block flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" /> Digital Integrity Verified
                </span>
                <span>Scan QR or present receipt code to Cash Office for confirmation.</span>
                <span className="font-mono block text-[9px] text-slate-400 mt-0.5">
                  HASH: HCA-RCT-{transaction.id.slice(0, 8)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block border-2 border-emerald-600 text-emerald-800 font-black text-[10px] uppercase px-3 py-1 rounded-lg transform rotate-[-3deg] bg-emerald-50">
                OFFICIALLY PAID
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-serif italic">Directorate of Finance</p>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}


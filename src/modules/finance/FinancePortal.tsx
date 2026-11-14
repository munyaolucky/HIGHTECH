import React, { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  Smartphone,
  CheckCircle2,
  Download,
  Search,
  Plus,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Building,
  Printer,
  Eye,
} from "lucide-react";
import confetti from "canvas-confetti";
import { collegeErpService, subscribeErpSync } from "../../services/collegeErpService";
import { studentPortalService } from "../../services/studentPortalService";
import { FeeTransaction, PortalRole } from "../../types";
import { useSyncedPortalTab } from "../../context/PortalShellContext";
import FeeReceiptModal from "../../components/FeeReceiptModal";
import MpesaStkPromptModal from "../../components/MpesaStkPromptModal";

interface FinancePortalProps {
  onSwitchPortal?: (role: PortalRole) => void;
}

export default function FinancePortal({ onSwitchPortal }: FinancePortalProps) {
  const [activeTab, setActiveTab] = useSyncedPortalTab<
    "overview" | "transactions" | "feestructure" | "stk_push"
  >("finance", "overview");
  const [transactions, setTransactions] = useState<FeeTransaction[]>(
    () => collegeErpService.getState().transactions
  );

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<FeeTransaction | null>(null);

  // STK Prompt Modal State
  const [isStkPromptOpen, setIsStkPromptOpen] = useState(false);

  useEffect(() => {
    return subscribeErpSync(() => {
      setTransactions([...collegeErpService.getState().transactions]);
    });
  }, []);

  const primaryStudentFin = studentPortalService.getFinancialSummary();

  // STK Push State
  const [stkPhone, setStkPhone] = useState("0712345678");
  const [stkAmount, setStkAmount] = useState("15000");
  const [stkStudentReg, setStkStudentReg] = useState("HCA/STU/2026/001");
  const [stkStudentName, setStkStudentName] = useState("Amina Wanjiku");
  const [stkState, setStkState] = useState<"IDLE" | "PENDING" | "CONFIRMED">("IDLE");

  const feeStructures = [
    { programme: "BSc. Computer Science", tuition: 45000, lab: 10000, exam: 5000, total: 60000 },
    { programme: "Diploma in Cyber Security", tuition: 35000, lab: 8000, exam: 4000, total: 47000 },
    { programme: "Certificate in IT", tuition: 22000, lab: 5000, exam: 3000, total: 30000 },
    { programme: "TVET CDACC Modular", tuition: 18000, lab: 4000, exam: 3000, total: 25000 },
  ];

  const handleOpenStkPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStkPromptOpen(true);
  };

  const handleConfirmMpesaPayment = (mpesaCode: string) => {
    setIsStkPromptOpen(false);
    setStkState("PENDING");

    const posted = collegeErpService.recordFeePayment({
      studentRegNo: stkStudentReg,
      studentName: stkStudentName,
      amount: Number(stkAmount),
      paymentMethod: "M-PESA",
      phoneOrRef: `${mpesaCode} · ${stkPhone}`,
      description: `Tuition & Lab Fee Payment (M-Pesa STK Push · ${mpesaCode})`,
    });

    if (posted.ok && posted.transaction) {
      setTransactions([...collegeErpService.getState().transactions]);
      setStkState("CONFIRMED");
      setSelectedReceipt(posted.transaction);
      try {
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      } catch {}
    } else {
      setStkState("IDLE");
    }
  };

  const totalCollections = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-[#092c60] text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard size={16} />
            <span>MODULE 20 · FINANCE &amp; ACCOUNTS MANAGEMENT PORTAL</span>
          </div>
          <h1 className="text-2xl font-bold">HI-TECH College Finance &amp; Cash Office</h1>
          <p className="text-blue-100 text-xs mt-1">
            Fee billing structures, student financial ledgers, M-Pesa Daraja STK reconciliation &amp; official receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSwitchPortal && (
            <>
              <button
                type="button"
                onClick={() => onSwitchPortal("student")}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Student Fee View (Bal: KES {primaryStudentFin.balance.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => onSwitchPortal("registrar")}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Registrar Portal
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab("stk_push")}
            className="px-4 py-2 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-bold rounded-xl flex items-center gap-2 shadow"
          >
            <Smartphone size={16} /> M-Pesa Daraja STK Simulator
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Collections</span>
            <strong className="text-xl font-bold text-slate-900 block mt-1">
              KES {totalCollections.toLocaleString()}.00
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">M-Pesa Paybill</span>
            <strong className="text-xl font-mono font-bold text-blue-900 block mt-1">890123</strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Smartphone size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Issued Receipts</span>
            <strong className="text-xl font-mono font-bold text-slate-900 block mt-1">
              {transactions.length} RCT
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Receipt size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Daraja API Status</span>
            <strong className="text-sm font-bold text-emerald-700 block mt-1">
              LIVE &amp; CONNECTED
            </strong>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 size={16} /> Financial Overview &amp; Budget
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "transactions"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt size={16} /> Official Receipts Register ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("feestructure")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "feestructure"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard size={16} /> Approved Fee Structures
        </button>
        <button
          onClick={() => setActiveTab("stk_push")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "stk_push"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Smartphone size={16} /> Live M-Pesa STK Simulator
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Monthly Collections vs Target (KES)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>January 2026 Collections</span>
                  <span className="font-mono text-blue-900">KES 850,000 / KES 1,000,000 (85%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>February 2026 Collections</span>
                  <span className="font-mono text-blue-900">KES 1,120,000 / KES 1,200,000 (93%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: "93%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>March 2026 (Projected)</span>
                  <span className="font-mono text-blue-900">KES 980,000 / KES 1,000,000 (98%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: "98%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Collections by Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">M-Pesa Daraja</span>
                <strong className="text-lg font-bold text-emerald-950 block mt-1">74.2%</strong>
                <span className="text-[11px] text-emerald-700">STK Push &amp; Paybill 890123</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-800">Direct Bank Transfer</span>
                <strong className="text-lg font-bold text-blue-950 block mt-1">21.8%</strong>
                <span className="text-[11px] text-blue-700">Equity &amp; KCB Collection Accts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTIONS REGISTER TAB */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Official Fee Payment Receipts Register</h3>
            <span className="text-xs text-slate-500 font-mono">Format: RCT-2026-xxxx</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Receipt No</th>
                <th className="p-4">Student Reg No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Channel &amp; Ref</th>
                <th className="p-4">Date &amp; Time</th>
                <th className="p-4">Amount (KES)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold text-blue-900">{tx.receiptNumber}</td>
                  <td className="p-4 font-mono font-bold text-slate-800">{tx.studentRegNo}</td>
                  <td className="p-4 font-bold text-slate-900">{tx.studentName}</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">{tx.paymentMethod}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{tx.referenceNumber}</span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(tx.timestamp).toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-slate-900">
                    KES {tx.amount.toLocaleString()}.00
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(tx)}
                      className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1 transition"
                    >
                      <Eye size={13} /> View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FEE STRUCTURE TAB */}
      {activeTab === "feestructure" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Approved 2026 Programme Fee Structures</h3>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Academic Programme</th>
                <th className="p-4">Tuition (KES)</th>
                <th className="p-4">Laboratory / ICT</th>
                <th className="p-4">Examination Fee</th>
                <th className="p-4 font-bold">Total Semester Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {feeStructures.map((f) => (
                <tr key={f.programme} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{f.programme}</td>
                  <td className="p-4 font-mono text-slate-700">KES {f.tuition.toLocaleString()}</td>
                  <td className="p-4 font-mono text-slate-700">KES {f.lab.toLocaleString()}</td>
                  <td className="p-4 font-mono text-slate-700">KES {f.exam.toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-blue-900">KES {f.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* M-PESA STK SIMULATOR TAB */}
      {activeTab === "stk_push" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone size={20} className="text-emerald-600" />
              Safaricom Daraja STK Push Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Initiates instantaneous prompt to payer and posts double-entry receipt record.
            </p>
          </div>

          <form onSubmit={handleOpenStkPrompt} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Student Registration Number</label>
              <input
                type="text"
                value={stkStudentReg}
                onChange={(e) => setStkStudentReg(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Student Full Name</label>
              <input
                type="text"
                value={stkStudentName}
                onChange={(e) => setStkStudentName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Payer Mobile Number (254...)</label>
              <input
                type="text"
                value={stkPhone}
                onChange={(e) => setStkPhone(e.target.value)}
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Amount to Pay (KES)</label>
              <input
                type="number"
                value={stkAmount}
                onChange={(e) => setStkAmount(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={stkState === "PENDING"}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <Smartphone size={16} />
              {stkState === "PENDING" ? "Processing Daraja Callback..." : "Dispatch STK Push & Generate Official Receipt"}
            </button>
          </form>

          {stkState === "CONFIRMED" && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-2 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 size={16} /> M-Pesa STK Push Completed!
              </div>
              <p>Amount KES {Number(stkAmount).toLocaleString()} credited to student {stkStudentReg}.</p>
              <p className="font-mono text-[11px] text-emerald-700">Receipt generated and ledger reconciled.</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const latest = transactions[0];
                    if (latest) setSelectedReceipt(latest);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <Printer size={13} /> View &amp; Print Official Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAFARICOM M-PESA STK PHONE PROMPT MODAL */}
      <MpesaStkPromptModal
        isOpen={isStkPromptOpen}
        phone={stkPhone}
        amount={Number(stkAmount) || 0}
        accountReference={stkStudentReg}
        onConfirm={handleConfirmMpesaPayment}
        onCancel={() => setIsStkPromptOpen(false)}
      />

      {/* OFFICIAL FEE RECEIPT MODAL */}
      <FeeReceiptModal
        transaction={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}

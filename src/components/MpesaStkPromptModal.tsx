import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, ShieldAlert, X, ArrowRight, Lock } from 'lucide-react';

interface MpesaStkPromptModalProps {
  isOpen: boolean;
  phone: string;
  amount: number;
  accountReference: string;
  paybillNumber?: string;
  onConfirm: (mpesaCode: string) => void;
  onCancel: () => void;
}

export default function MpesaStkPromptModal({
  isOpen,
  phone,
  amount,
  accountReference,
  paybillNumber = '890123',
  onConfirm,
  onCancel,
}: MpesaStkPromptModalProps) {
  const [pin, setPin] = useState('');
  const [stage, setStage] = useState<'PROMPT' | 'PROCESSING' | 'SUCCESS'>('PROMPT');
  const [countdown, setCountdown] = useState(25);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setStage('PROMPT');
      setCountdown(25);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendPin = (e: React.FormEvent) => {
    e.preventDefault();
    setStage('PROCESSING');

    // Generate realistic M-Pesa transaction reference (e.g., QJD849201A)
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randChar = () => letters.charAt(Math.floor(Math.random() * letters.length));
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `${randChar()}${randChar()}${randChar()}${randomDigits}${randChar()}`;
    setGeneratedCode(code);

    setTimeout(() => {
      setStage('SUCCESS');
      setTimeout(() => {
        onConfirm(code);
      }, 1400);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      {/* SIMULATED MOBILE PHONE DEVICE PROMPT */}
      <div className="bg-[#1f2937] text-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border-4 border-slate-700 animate-in zoom-in-95 duration-200 relative">
        {/* PHONE SPEAKER & CAMERA NOTCH */}
        <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-900" />
          <div className="w-8 h-1 rounded-full bg-slate-900" />
        </div>

        {/* STATUS BAR */}
        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-4 px-1">
          <span className="font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SAFARICOM 4G
          </span>
          <span>STK PUSH SIMULATOR</span>
        </div>

        {stage === 'PROMPT' && (
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center mb-2">
                <Smartphone size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-100">SIM Toolkit Prompt</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Prompt delivered to <span className="font-mono text-emerald-400 font-bold">{phone}</span>
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 text-xs text-slate-200 space-y-1.5 border border-slate-700">
              <p className="text-[11px] text-slate-300">
                Do you want to pay <strong className="text-emerald-400 font-bold">KES {amount.toLocaleString()}.00</strong> to{' '}
                <strong className="text-white">HI-TECH COLLEGE</strong> (Paybill {paybillNumber}) for Account{' '}
                <strong className="text-amber-400 font-mono">{accountReference}</strong>?
              </p>
            </div>

            <form onSubmit={handleSendPin} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Lock size={12} className="text-emerald-400" /> Enter 4-digit M-PESA PIN:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  required
                  className="w-full text-center text-lg tracking-[0.5em] font-mono bg-slate-950 border border-emerald-500/50 text-emerald-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/50 transition flex items-center justify-center gap-1"
                >
                  Send PIN <ArrowRight size={14} />
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-400">
                Auto-timeout in <span className="font-mono font-bold text-amber-400">{countdown}s</span>
              </p>
            </form>
          </div>
        )}

        {stage === 'PROCESSING' && (
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 text-center space-y-4">
            <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-white">Contacting Daraja Gateway...</h4>
              <p className="text-xs text-slate-400 mt-1">Securing M-Pesa STK Callback response</p>
            </div>
          </div>
        )}

        {stage === 'SUCCESS' && (
          <div className="bg-slate-900 rounded-2xl p-6 border border-emerald-500/40 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-sm font-bold text-emerald-300">Payment Confirmed!</h4>
            <div className="bg-slate-950 p-3 rounded-xl text-[11px] text-slate-300 font-mono text-left space-y-1">
              <span className="text-emerald-400 font-bold block">{generatedCode} Confirmed.</span>
              <span>Ksh {amount.toLocaleString()}.00 sent to HI-TECH COLLEGE.</span>
              <span className="text-slate-400 block text-[10px]">Acc: {accountReference}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


import { GraduationCap } from 'lucide-react';

export function SessionLoading({
  message = 'Verifying your HI-TECH College portal session...',
}: {
  message?: string;
}) {
  return (
    <div
      className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] flex items-center justify-center p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 text-center shadow-sm space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#102D50] text-[#F5EBDD] font-black text-xl shadow-sm">
          <GraduationCap size={24} />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-extrabold tracking-tight text-[#102D50] dark:text-white">
            HI-TECH College Digital Portal
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">{message}</p>
        </div>
        <div className="space-y-2.5" aria-hidden="true">
          <div className="h-3 w-3/4 mx-auto rounded-lg hitech-skeleton" />
          <div className="h-3 w-1/2 mx-auto rounded-lg hitech-skeleton" />
        </div>
      </div>
    </div>
  );
}

export default SessionLoading;

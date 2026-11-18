import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  studentPortalService,
  StudentPortalSection,
} from '../../../services/studentPortalService';

interface AssistantMessage {
  id: string;
  sender: 'assistant' | 'student';
  text: string;
  actionLabel?: string;
  actionPage?: StudentPortalSection;
}

interface StudentAssistantWidgetProps {
  onNavigate: (page: StudentPortalSection) => void;
}

export default function StudentAssistantWidget({ onNavigate }: StudentAssistantWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I can check your live fee balance, exam card eligibility, class attendance, or point you to any HI-TECH Student Portal workflow.',
    },
  ]);

  const buildGroundedReply = (query: string): AssistantMessage => {
    const q = query.toLowerCase();
    const state = studentPortalService.getState();
    const fin = studentPortalService.getFinancialSummary();
    const pendingTasks = state.assignments.filter((a) => a.status === 'PENDING');

    if (q.includes('fee') || q.includes('mpesa') || q.includes('balance') || q.includes('pay')) {
      return {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: `Your current balance is KES ${fin.balance.toLocaleString()} (${fin.percentPaid}% paid of KES ${fin.totalBilled.toLocaleString()}). You can pay instantly via Lipa na M-Pesa Paybill 890123 using account ${state.profile.registrationNumber}.`,
        actionLabel: 'Open Fees & M-Pesa',
        actionPage: 'finance',
      };
    }

    if (q.includes('exam') || q.includes('card') || q.includes('permit') || q.includes('eligib')) {
      return {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: `Attendance is currently ${state.profile.attendanceRate}% (required >=75%). ${
          fin.examCleared
            ? 'All semester fees are cleared — your Examination Card is unlocked for printing.'
            : `Note: KES ${fin.balance.toLocaleString()} balance remains before final Exam Card clearance.`
        }`,
        actionLabel: 'Check Examinations & Card',
        actionPage: 'examinations',
      };
    }

    if (q.includes('assignment') || q.includes('deadline') || q.includes('task')) {
      return {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text:
          pendingTasks.length > 0
            ? `You have ${pendingTasks.length} pending assignment(s), starting with "${pendingTasks[0].title}" (${pendingTasks[0].dueLabel}).`
            : 'All coursework assignments for this semester are currently submitted or graded.',
        actionLabel: 'Open Timetable & Tasks',
        actionPage: 'timetable',
      };
    }

    if (q.includes('appeal') || q.includes('remark') || q.includes('correction')) {
      return {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: 'You can file a formal Grade Remarking, Attendance Correction, or Exam Waiver Appeal directly from Academic Appeals with supporting evidence.',
        actionLabel: 'Open Academic Appeals',
        actionPage: 'appeals',
      };
    }

    if (q.includes('unit') || q.includes('register') || q.includes('defer') || q.includes('leave')) {
      return {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: `You currently have ${state.units.length} registered units and your Nominal Roll status is ${
          state.semesterReported ? 'Reported' : 'Action Required'
        }. You can request unit add/drop or academic deferment under Course Registration.`,
        actionLabel: 'Open Academic Registration',
        actionPage: 'course-registration',
      };
    }

    return {
      id: `ast-${Date.now()}`,
      sender: 'assistant',
      text: `For "${query}", your Student Support Centre lets you raise an official ticket or message unit lecturers directly.`,
      actionLabel: 'Go to Support Centre',
      actionPage: 'support',
    };
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: AssistantMessage = {
      id: `stu-${Date.now()}`,
      sender: 'student',
      text: text.trim(),
    };
    const reply = buildGroundedReply(text);
    setMessages((prev) => [...prev, userMsg, reply]);
    setInput('');
  };

  const quickPrompts = [
    'Check my fee balance',
    'Am I eligible for exams?',
    'Next assignment deadline',
    'Submit an academic appeal',
  ];

  return (
    <div className="fixed bottom-16 lg:bottom-6 right-5 z-40 no-print">
      {open ? (
        <div className="w-[330px] sm:w-[370px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[490px]">
          {/* Header */}
          <div className="bg-[#102D50] text-white px-4 py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E8B44A] text-[#102D50] flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div>
                <strong className="text-xs font-bold block">Student Portal Assistant</strong>
                <span className="text-[10px] text-blue-200 block">Grounded Live Academic Guide</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close Student Assistant"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-blue-100 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto scrollview-y bg-[#F4F7FB] dark:bg-slate-950/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'student'
                      ? 'bg-[#1769AA] text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.actionPage && msg.actionLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(msg.actionPage!);
                        setOpen(false);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
                    >
                      <span>{msg.actionLabel}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1.5 overflow-x-auto scrollview-clean">
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#eef4fd] dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about fees, exams, units..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
            />
            <button
              type="submit"
              aria-label="Send query"
              className="p-2 rounded-xl bg-[#1769AA] hover:bg-[#12568E] text-white shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-12 px-4 rounded-2xl bg-[#102D50] hover:bg-[#1769AA] text-white shadow-xl border border-white/15 flex items-center gap-2 text-xs font-bold transition-all hover:-translate-y-0.5"
        >
          <Sparkles size={16} className="text-[#E8B44A]" />
          <span className="hidden sm:inline">Student Assistant</span>
          <CheckCircle2 size={14} className="text-emerald-400 sm:hidden" />
        </button>
      )}
    </div>
  );
}

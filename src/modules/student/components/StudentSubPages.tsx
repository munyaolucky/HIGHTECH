import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Lock,
  Mail,
  MapPin,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';
import studentAvatarUrl from '../../../assets/images/student_profile_portrait_1794587291385.jpg';
import campusHeroUrl from '../../../assets/images/campus_hero_banner_1794587290452.jpg';
import { aiSupportCentreService } from '../../../services/aiSupportCentreService';
import { engagementService } from '../../../services/engagementService';
import { examAssessmentService } from '../../../services/examAssessmentService';
import { hostelsService } from '../../../services/hostelsService';
import {
  downloadStudentDocument,
  studentPortalService,
  StudentPortalSection,
} from '../../../services/studentPortalService';
import { SupportTicketCategory } from '../../../types/aiSupportCentre';
import { SupportRequestCategory } from '../../../types/hostels';
import { FeeTransaction } from '../../../types';
import StudentAcademicExtras from './StudentAcademicExtras';
import FeeReceiptModal from '../../../components/FeeReceiptModal';
import MpesaStkPromptModal from '../../../components/MpesaStkPromptModal';
import StudentCbtExamModal from '../../../components/StudentCbtExamModal';

interface StudentSubPagesProps {
  activeSection: StudentPortalSection;
  onBackToDashboard: () => void;
  onNavigate: (section: StudentPortalSection) => void;
  onNotify: (type: 'ok' | 'err', message: string) => void;
  onRefresh: () => void;
  onSwitchPortal?: (role: string) => void;
}

const SECTION_META: Record<Exclude<StudentPortalSection, 'dashboard'>, { title: string; subtitle: string }> = {
  profile: {
    title: 'My Student Profile',
    subtitle: 'Official student identity record, personal contacts, and Next of Kin details',
  },
  programme: {
    title: 'My Programme & Onboarding Status',
    subtitle: 'School of Computing & Informatics degree structure, credits, and admission verification',
  },
  'academic-progress': {
    title: 'Academic Progress & GPA Summary',
    subtitle: 'Cumulative credit hours, attendance compliance, and semester standing',
  },
  'course-registration': {
    title: 'Course Registration & Unit Changes',
    subtitle: 'Active Semester 1 course units and Registrar unit add/drop requests',
  },
  timetable: {
    title: 'Weekly Class Timetable & Assignments',
    subtitle: 'Scheduled lecture halls, laboratories, and upcoming coursework deadlines',
  },
  calendar: {
    title: 'Academic Calendar & Deadlines',
    subtitle: 'Key Trimester dates, CAT schedules, assignment deadlines, and campus events',
  },
  attendance: {
    title: 'Class Attendance & QR Check-In',
    subtitle: 'Unit attendance standing (75% exam rule) and live lecture session code check-in',
  },
  elearning: {
    title: 'E-Learning & Course Materials',
    subtitle: 'Downloadable lecture notes, recorded classes, and practical lab manuals',
  },
  examinations: {
    title: 'Examinations & Official Exam Card',
    subtitle: 'Scheduled internal, KNEC & TVET CDACC assessments and fee-clearance eligibility',
  },
  results: {
    title: 'Examination Results & Official Transcripts',
    subtitle: 'Registrar-approved marks and verified academic transcripts (read-only student record)',
  },
  finance: {
    title: 'Fees, Lipa na M-Pesa & Statements',
    subtitle: 'Live fee balance, online M-Pesa STK settlement, and verified receipts',
  },
  receipts: {
    title: 'Verified Payment Receipts',
    subtitle: 'Immutable tuition payment receipts and downloadable financial statement',
  },
  library: {
    title: 'Digital Library, Loans & E-Resources',
    subtitle: 'Search physical holdings, reserve books for pickup, and download PDF manuals',
  },
  attachment: {
    title: 'Industrial Attachment & Careers',
    subtitle: 'Placement details, intro letter downloads, weekly digital logbook, and career board',
  },
  clearance: {
    title: 'Multi-Department Student Clearance',
    subtitle: 'Finance, library, laboratories, hostels, dean, and academic registry sign-off status',
  },
  'campus-life': {
    title: 'Campus Clubs, Events & SRC Voting',
    subtitle: 'Student societies, campus activity RSVP, and anonymous SRC secret ballot voting',
  },
  'student-id': {
    title: 'Digital Student Identification Card',
    subtitle: 'Accepted at campus security gates, computer labs, library desk, and exam halls',
  },
  documents: {
    title: 'Official Student Documents',
    subtitle: 'Download certified admission letters, fee statements, exam permits, and handbooks',
  },
  support: {
    title: 'Student Support, Hostels & Welfare',
    subtitle: 'Helpdesk tickets, direct lecturer messaging, hostel applications, and counselling',
  },
  notifications: {
    title: 'Notifications Center',
    subtitle: 'Academic alerts, financial receipts, and security updates',
  },
  settings: {
    title: 'Account Security & Guardian Linking',
    subtitle: 'Manage MFA, password rotation, revocable parent consent links, and security history',
  },
  'college-information': {
    title: 'HI-TECH College Campus Directory',
    subtitle: 'Nairobi Main Campus facilities, laboratories, operating hours, and student handbook',
  },
};

export default function StudentSubPages({
  activeSection,
  onBackToDashboard,
  onNavigate,
  onNotify,
  onRefresh,
  onSwitchPortal,
}: StudentSubPagesProps) {
  const state = studentPortalService.getState();
  const fin = studentPortalService.getFinancialSummary();
  const resources = studentPortalService.getStaticResources();
  const engState = engagementService.getState();
  const hostelsState = hostelsService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  // Profile state
  const [contactForm, setContactForm] = useState(state.contact);

  // Course change & academic leave / deferment state
  const [unitChangeForm, setUnitChangeForm] = useState({
    action: 'ADD' as 'ADD' | 'DROP' | 'SWAP',
    unitCode: 'AI 310 — Applied Machine Learning',
    reason: '',
  });
  const [defermentForm, setDefermentForm] = useState({
    type: 'ACADEMIC_LEAVE' as 'ACADEMIC_LEAVE' | 'DEFERMENT' | 'CAMPUS_TRANSFER',
    targetSemester: '2026 / Semester 2',
    reason: '',
  });

  // Timetable & assignment submission state
  const [dayFilter, setDayFilter] = useState<string>('ALL');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');

  // M-Pesa payment state
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [mpesaAmount, setMpesaAmount] = useState(String(fin.balance > 0 ? fin.balance : 5000));
  const [mpesaPending, setMpesaPending] = useState(false);

  // Library search
  const [libraryQuery, setLibraryQuery] = useState('');

  // Support tab & forms
  const [supportTab, setSupportTab] = useState<'tickets' | 'lecturers' | 'welfare'>('tickets');
  const [ticketForm, setTicketForm] = useState<{
    category: SupportTicketCategory;
    subject: string;
    description: string;
  }>({
    category: 'EXAMS_RESULTS',
    subject: '',
    description: '',
  });
  const [msgForm, setMsgForm] = useState({
    unitCode: state.units[0]?.code ?? 'CSC 301',
    subject: '',
    body: '',
  });
  const studentHostels = hostelsState.hostels.filter((h) => h.active && h.occupancyPolicy !== 'STAFF_ONLY');
  const [hostelApp, setHostelApp] = useState({
    hostelId: studentHostels[0]?.id ?? 'hos-nrb-1',
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    reason: '',
  });
  const [welfareForm, setWelfareForm] = useState<{
    category: SupportRequestCategory;
    subject: string;
    description: string;
  }>({
    category: 'COUNSELLING',
    subject: '',
    description: '',
  });

  // Settings & Guardian form
  const [newPassword, setNewPassword] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  // Interactive Modal States
  const [isCbtModalOpen, setIsCbtModalOpen] = useState(false);
  const [selectedReceiptForModal, setSelectedReceiptForModal] = useState<FeeTransaction | null>(null);
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);

  if (activeSection === 'dashboard') return null;

  const meta = SECTION_META[activeSection];

  const SectionShellHeader = (rightAction?: React.ReactNode) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div>
          <p className="text-[11px] font-medium text-slate-500">
            Student Portal / {meta.title}
          </p>
          <h2 className="text-lg font-bold text-[#092c60] leading-tight mt-0.5">{meta.title}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{meta.subtitle}</p>
        </div>
      </div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </div>
  );

  if (
    activeSection === 'attendance' ||
    activeSection === 'elearning' ||
    activeSection === 'attachment' ||
    activeSection === 'clearance' ||
    activeSection === 'campus-life'
  ) {
    return (
      <StudentAcademicExtras
        activeSection={activeSection}
        headerBlock={SectionShellHeader()}
        onNotify={onNotify}
        onRefresh={onRefresh}
      />
    );
  }

  // 1. PROFILE
  if (activeSection === 'profile') {
    return (
      <div className="space-y-5">
        {SectionShellHeader()}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={studentAvatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">{profile.fullName}</h3>
                <p className="text-xs font-mono font-semibold text-[#0866d7] mt-0.5">{regNo}</p>
                <p className="text-xs text-slate-500 mt-0.5">{profile.programme}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Admission Number</span>
                <span className="font-mono font-semibold text-slate-900">{profile.admissionNumber}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">KCSE / National ID</span>
                <span className="font-mono font-semibold text-slate-900">{profile.nationalId}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-900 text-right">{profile.department}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Campus</span>
                <span className="font-medium text-slate-900">{profile.campus}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Academic Status</span>
                <span className="font-semibold text-emerald-700">{profile.status}</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.updateContactDetails(contactForm);
              if (!res.ok) return onNotify('err', res.error ?? 'Could not save profile changes.');
              onNotify('ok', 'Contact details and Next of Kin updated cleanly.');
              onRefresh();
            }}
            className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">Contact &amp; Next of Kin Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Student Email Address</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0866d7]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  required
                  value={contactForm.phoneNumber}
                  onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#0866d7]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Current Residence Address</label>
                <input
                  type="text"
                  required
                  value={contactForm.residenceAddress}
                  onChange={(e) => setContactForm({ ...contactForm, residenceAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0866d7]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Next of Kin Full Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.nextOfKinName}
                  onChange={(e) => setContactForm({ ...contactForm, nextOfKinName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0866d7]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Next of Kin Phone</label>
                <input
                  type="text"
                  required
                  value={contactForm.nextOfKinPhone}
                  onChange={(e) => setContactForm({ ...contactForm, nextOfKinPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-[#0866d7]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Official Registration Number and Programme edits require Registrar approval.
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors"
              >
                Save Contact Updates
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. PROGRAMME & ACADEMIC PROGRESS
  if (activeSection === 'programme' || activeSection === 'academic-progress') {
    const totalCredits = state.units.reduce((acc, u) => acc + u.credits, 0);
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => onNavigate('course-registration')}
            className="px-4 py-2 bg-[#0866d7] hover:bg-[#0652b3] text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            Manage Course Units
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <span className="text-slate-500">Programme Track</span>
            <strong className="block text-base font-bold text-[#092c60] mt-1">{profile.programme}</strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <span className="text-slate-500">Semester Credit Load</span>
            <strong className="block text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
              {totalCredits} Credits · {state.units.length} Units
            </strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <span className="text-slate-500">Average Attendance</span>
            <strong className="block text-base font-bold text-emerald-700 font-mono tabular-nums mt-1">
              {profile.attendanceRate}% (Exam Eligible)
            </strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <span className="text-slate-500">Cumulative GPA</span>
            <strong className="block text-base font-bold text-amber-700 font-mono tabular-nums mt-1">
              {profile.gpa.toFixed(2)} / 4.00
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">11-Step Admission &amp; Academic Onboarding</h3>
            <div className="divide-y divide-slate-100">
              {state.onboardingSteps.map((step) => (
                <div key={step.stepNumber} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-800">
                      {step.stepNumber}. {step.title}
                    </span>
                  </div>
                  <span className="text-slate-500 whitespace-nowrap shrink-0">{step.owner}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Curriculum &amp; Lecturers</h3>
            <div className="divide-y divide-slate-100">
              {state.units.map((u) => (
                <div key={u.code} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-mono font-bold text-[#092c60]">{u.code} · {u.credits} Credits</p>
                    <p className="font-semibold text-slate-900">{u.title}</p>
                    <p className="text-slate-500">{u.lecturerName}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <strong className="text-emerald-700 block">{u.attendance}% Att.</strong>
                    <span className="text-slate-500">Current: {u.grade ?? 'In Progress'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. COURSE REGISTRATION, NOMINAL ROLL REPORTING & ACADEMIC LEAVE
  if (activeSection === 'course-registration') {
    return (
      <div className="space-y-5">
        {SectionShellHeader()}

        {/* Semester Nominal Roll Reporting */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-mono text-[#0866d7] font-semibold">
              NOMINAL ROLL · {profile.academicYear} · {profile.semester}
            </p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {state.semesterReported
                ? `Semester Reporting Confirmed (${new Date(state.semesterReportedAt).toLocaleDateString()})`
                : 'Semester Nominal Roll Reporting Required'}
            </h3>
            <p className="text-slate-500 mt-0.5">
              All continuing and admitted students confirm session attendance on the Academic Registry nominal roll each semester.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              studentPortalService.confirmSemesterReporting();
              onNotify('ok', `Nominal roll attendance re-confirmed for ${profile.academicYear} ${profile.semester}.`);
              onRefresh();
            }}
            className={`px-4 py-2 font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              state.semesterReported
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-[#092c60] text-white hover:bg-[#061f46]'
            }`}
          >
            <CheckCircle2 size={15} />
            {state.semesterReported ? 'Reported — Re-Confirm Session' : 'Confirm Semester Reporting'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Registered Units — {profile.academicYear} · {profile.semester}
              </h3>
              <span className="text-xs font-mono tabular-nums text-emerald-700 font-semibold">
                {state.units.length} Active Units
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Code</th>
                    <th className="py-2.5 px-4 font-semibold">Course Title</th>
                    <th className="py-2.5 px-4 font-semibold">Lecturer</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Credits</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.units.map((u) => (
                    <tr key={u.code} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-[#092c60] whitespace-nowrap">{u.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{u.title}</td>
                      <td className="py-3 px-4 text-slate-600">{u.lecturerName}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{u.credits}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {u.attendance}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.submitUnitChangeRequest(unitChangeForm);
              if (!res.ok) return onNotify('err', res.error ?? 'Failed to submit request.');
              setUnitChangeForm({ ...unitChangeForm, reason: '' });
              onNotify('ok', 'Unit change request submitted for Registrar review.');
              onRefresh();
            }}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900">Request Unit Add / Drop / Swap</h3>
            <p className="text-slate-500">
              Enrolled units cannot be altered directly after census date; submit a change request to the Registrar.
            </p>
            <select
              value={unitChangeForm.action}
              onChange={(e) =>
                setUnitChangeForm({ ...unitChangeForm, action: e.target.value as 'ADD' | 'DROP' | 'SWAP' })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="ADD">Add Elective Unit</option>
              <option value="SWAP">Swap Enrolled Unit</option>
              <option value="DROP">Drop Unit</option>
            </select>
            <select
              value={unitChangeForm.unitCode}
              onChange={(e) => setUnitChangeForm({ ...unitChangeForm, unitCode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="AI 310 — Applied Machine Learning">AI 310 — Applied Machine Learning</option>
              <option value="IOT 305 — Embedded IoT Systems">IOT 305 — Embedded IoT Systems</option>
              <option value="ENT 101 — Technology Entrepreneurship">ENT 101 — Technology Entrepreneurship</option>
            </select>
            <textarea
              rows={3}
              required
              placeholder="Academic reason for Registrar approval..."
              value={unitChangeForm.reason}
              onChange={(e) => setUnitChangeForm({ ...unitChangeForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg"
            >
              Submit to Academic Registry
            </button>

            {state.unitChanges.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800">Submitted Requests ({state.unitChanges.length})</h4>
                {state.unitChanges.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="font-bold text-[#092c60]">{req.action}</span>
                      <span className="text-amber-700 font-semibold">{req.status}</span>
                    </div>
                    <p className="font-medium text-slate-800 mt-0.5">{req.unitCode}</p>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Academic Leave, Deferment & Campus Transfer */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Academic Leave, Semester Deferment &amp; Campus Transfer
            </h3>
            <p className="text-slate-500 mt-0.5">
              Submit formal requests to the Academic Dean and Registrar for temporary leave, intake deferment, or campus transfer.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.submitDefermentOrTransfer(defermentForm);
              if (!res.ok) return onNotify('err', res.error ?? 'Could not submit request.');
              setDefermentForm({ ...defermentForm, reason: '' });
              onNotify('ok', 'Request forwarded to Academic Dean & Registrar.');
              onRefresh();
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-slate-600 font-medium mb-1">Request Type</label>
              <select
                value={defermentForm.type}
                onChange={(e) =>
                  setDefermentForm({
                    ...defermentForm,
                    type: e.target.value as 'ACADEMIC_LEAVE' | 'DEFERMENT' | 'CAMPUS_TRANSFER',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="ACADEMIC_LEAVE">Academic Leave (1 Semester)</option>
                <option value="DEFERMENT">Semester Deferment</option>
                <option value="CAMPUS_TRANSFER">Inter-Campus Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Effective Semester / Intake</label>
              <select
                value={defermentForm.targetSemester}
                onChange={(e) => setDefermentForm({ ...defermentForm, targetSemester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="2026 / Semester 2">2026 / Semester 2 (May Intake)</option>
                <option value="2026 / Semester 3">2026 / Semester 3 (Sept Intake)</option>
                <option value="2027 / Semester 1">2027 / Semester 1 (Jan Intake)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Official Reason</label>
              <input
                type="text"
                required
                placeholder="State medical, financial, or academic reason..."
                value={defermentForm.reason}
                onChange={(e) => setDefermentForm({ ...defermentForm, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg whitespace-nowrap"
            >
              Submit to Dean
            </button>
          </form>

          {state.defermentRequests.length > 0 && (
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
              {state.defermentRequests.map((req) => (
                <div key={req.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-mono font-bold text-[#092c60]">
                      {req.type.replace('_', ' ')} · {req.targetSemester}
                    </p>
                    <p className="text-slate-700">{req.reason}</p>
                  </div>
                  <span className="font-mono font-semibold text-amber-700 whitespace-nowrap">
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. TIMETABLE, CALENDAR & ASSIGNMENTS
  if (activeSection === 'timetable' || activeSection === 'calendar') {
    const days = ['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const filteredUnits =
      dayFilter === 'ALL' ? state.units : state.units.filter((u) => u.day === dayFilter);

    return (
      <div className="space-y-5">
        {SectionShellHeader()}

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#0866d7]" /> Weekly Lecture &amp; Lab Schedule
            </h3>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDayFilter(day)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    dayFilter === day
                      ? 'bg-white text-[#092c60] font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day === 'ALL' ? 'Full Week' : day}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredUnits.map((u) => (
              <div
                key={u.code}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-mono font-bold text-[#0866d7]">
                    {u.day} · {u.time} · {u.code}
                  </p>
                  <strong className="text-sm text-slate-900 block">{u.title}</strong>
                  <span className="text-slate-500">{u.lecturerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 font-medium shrink-0">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{u.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Submission Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Active Assignments &amp; Submissions</h3>
          <div className="space-y-3">
            {state.assignments.map((asg) => (
              <div key={asg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-[#092c60] font-bold">
                      {asg.unitCode} · {asg.dueLabel} · {asg.status}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{asg.title}</h4>
                    <p className="text-slate-500">Lecturer: {asg.lecturerName}</p>
                  </div>
                  {asg.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubmissionId(activeSubmissionId === asg.id ? null : asg.id);
                        setSubmissionText('');
                      }}
                      className="px-3.5 py-2 bg-[#0866d7] hover:bg-[#0652b3] text-white font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <UploadCloud size={14} /> Submit Assignment
                    </button>
                  ) : (
                    <span className="font-mono font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                      {asg.scoreLabel ?? 'Submitted for Grading'}
                    </span>
                  )}
                </div>

                {activeSubmissionId === asg.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const res = studentPortalService.submitAssignment(asg.id, submissionText);
                      if (!res.ok) return onNotify('err', res.error ?? 'Submission failed');
                      setActiveSubmissionId(null);
                      setSubmissionText('');
                      onNotify('ok', `Assignment submitted for ${asg.unitCode}.`);
                      onRefresh();
                    }}
                    className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Enter Git repository URL, lab report file ref, or brief note..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg whitespace-nowrap shrink-0"
                    >
                      Confirm Submission
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 5. EXAMINATIONS & CBT LAUNCH
  if (activeSection === 'examinations') {
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCbtModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm transition"
            >
              <Sparkles size={14} className="text-amber-300" /> Start Interactive CBT Exam
            </button>
            {onSwitchPortal && (
              <button
                type="button"
                onClick={() => onSwitchPortal('examination')}
                className="px-3.5 py-2 bg-[#0866d7] hover:bg-[#0652b3] text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
              >
                Open Full CBT Workspace
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                downloadStudentDocument(
                  `Exam_Permit_${regNo.replace(/\//g, '_')}.txt`,
                  `HI-TECH COLLEGE EXAMINATION PERMIT\nStudent: ${profile.fullName}\nReg No: ${regNo}\nProgramme: ${profile.programme}\nAttendance: ${profile.attendanceRate}%\nFee Balance: KES ${fin.balance.toLocaleString()}\nEligibility: ${fin.examCleared ? 'CLEARED FOR FINAL EXAMS' : 'CAT CLEARED — CLEAR KES ' + fin.balance.toLocaleString() + ' FOR FINAL EXAM CARD'}\n`
                );
                onNotify('ok', 'Examination Permit downloaded.');
              }}
              className="px-3.5 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download size={14} /> Download Exam Card
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Examination Hall Clearance Status</h3>
            <p className="text-slate-600 mt-1">
              Attendance Standing: <strong className="font-mono">{profile.attendanceRate}%</strong> (Minimum 75% met) · Fee Clearance:{' '}
              <strong className="font-mono tabular-nums">{fin.percentPaid}%</strong> (Balance KES {fin.balance.toLocaleString()})
            </p>
          </div>
          {!fin.examCleared ? (
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg whitespace-nowrap shrink-0"
            >
              Clear Remaining Balance
            </button>
          ) : (
            <span className="font-semibold text-emerald-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <CheckCircle2 size={15} /> 100% Exam Cleared
            </span>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Examination Paper</th>
                <th className="py-3 px-4 font-semibold">Exam Body</th>
                <th className="py-3 px-4 font-semibold">Date &amp; Time</th>
                <th className="py-3 px-4 font-semibold">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.exams.map((ex) => (
                <tr key={ex.id}>
                  <td className="py-3 px-4 font-mono font-bold text-[#092c60]">{ex.courseCode}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{ex.courseTitle}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{ex.examBody}</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    {ex.examDate} · {ex.time}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{ex.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live CBT Assessments from Examination Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Online CBT Assessments &amp; Attempts (Examination Engine)
            </h3>
            {onSwitchPortal && (
              <button
                type="button"
                onClick={() => onSwitchPortal('examination')}
                className="text-xs font-bold text-[#0866d7] hover:underline"
              >
                Open Full CBT Workspace
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {examAssessmentService.getState().assessments.map((asm) => {
              const myAttempt = examAssessmentService
                .getState()
                .attempts.find(
                  (a) =>
                    a.assessmentId === asm.id &&
                    a.studentRegNo.toUpperCase() === regNo.toUpperCase()
                );
              return (
                <div key={asm.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-[#0866d7]">
                      {asm.unitCode} · {asm.assessmentKind} · {asm.durationMinutes} mins
                    </p>
                    <strong className="text-slate-900 block mt-0.5">{asm.title}</strong>
                    <span className="text-slate-500">
                      Status: {myAttempt ? `${myAttempt.moderationStatus} (Score: ${myAttempt.totalAwarded}/${myAttempt.maxPossibleMarks})` : asm.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCbtModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs whitespace-nowrap transition flex items-center gap-1"
                    >
                      <Sparkles size={13} /> {myAttempt ? 'Retake CBT Mock' : 'Take CBT Mock'}
                    </button>
                    {onSwitchPortal && (
                      <button
                        type="button"
                        onClick={() => onSwitchPortal('examination')}
                        className="px-3 py-1.5 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg text-xs whitespace-nowrap"
                      >
                        {myAttempt ? 'Review Engine' : 'Exam Workspace'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STUDENT CBT EXAM MODAL */}
        <StudentCbtExamModal
          isOpen={isCbtModalOpen}
          studentRegNo={regNo}
          studentName={profile.fullName}
          programme={profile.programme}
          onClose={() => setIsCbtModalOpen(false)}
          onFinished={(s, m) => {
            onNotify('ok', `CBT Exam submitted successfully! You scored ${s}/${m} marks.`);
            onRefresh();
          }}
        />
      </div>
    );
  }

  // 6. RESULTS & OFFICIAL TRANSCRIPTS
  if (activeSection === 'results') {
    const trx = resources.transcripts[0];
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => {
              downloadStudentDocument(
                `Transcript_${regNo.replace(/\//g, '_')}.txt`,
                `HI-TECH COLLEGE OFFICIAL ACADEMIC TRANSCRIPT\nStudent: ${profile.fullName}\nReg No: ${regNo}\nTranscript Ref: ${trx?.issuanceReference ?? 'TRX-2026-0001'}\nVerification Code: ${trx?.verificationCode ?? 'VRF-HCA-99210-2026'}\nGPA: ${profile.gpa.toFixed(2)}\n\n` +
                  state.units.map((u) => `${u.code}\t${u.title}\tScore: ${u.score ?? '-'}\tGrade: ${u.grade ?? '-'}`).join('\n')
              );
              onNotify('ok', 'Official Registrar-verified transcript downloaded.');
            }}
            className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download size={14} /> Download Official Transcript
          </button>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-mono text-[#0866d7] font-semibold">
              {trx?.issuanceReference ?? 'TRX-2026-0001'} · Code {trx?.verificationCode ?? 'VRF-HCA-99210-2026'}
            </p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Issued by {trx?.issuedBy ?? 'Dr. Kiprop Chemweno (Registrar)'}
            </h3>
            <p className="text-slate-500 mt-0.5">
              Approved examination marks are permanently locked and cannot be altered from student accounts.
            </p>
          </div>
          <div className="text-left sm:text-right font-mono tabular-nums shrink-0">
            <span className="text-slate-500 block">Cumulative GPA</span>
            <strong className="text-xl font-bold text-[#092c60]">{profile.gpa.toFixed(2)} / 4.00</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Unit Code</th>
                <th className="py-3 px-4 font-semibold">Course Title</th>
                <th className="py-3 px-4 font-semibold text-right">Credits</th>
                <th className="py-3 px-4 font-semibold text-right">Score</th>
                <th className="py-3 px-4 font-semibold text-right">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.units.map((u) => (
                <tr key={u.code}>
                  <td className="py-3 px-4 font-mono font-bold text-[#092c60]">{u.code}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{u.title}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">{u.credits}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">{u.score ?? '-'}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{u.grade ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 7. FEES, M-PESA STK PUSH & RECEIPTS
  if (activeSection === 'finance' || activeSection === 'receipts') {
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => {
              downloadStudentDocument(
                `Fee_Statement_${regNo.replace(/\//g, '_')}.txt`,
                `HI-TECH COLLEGE STUDENT FEE STATEMENT\nStudent: ${profile.fullName}\nReg No: ${regNo}\nTotal Billed: KES ${fin.totalBilled.toLocaleString()}\nTotal Paid: KES ${fin.totalPaid.toLocaleString()}\nOutstanding Balance: KES ${fin.balance.toLocaleString()}\n\n` +
                  state.transactions
                    .map((t) => `${t.receiptNumber}\t${t.paymentMethod}\t${t.referenceNumber}\tKES ${t.amount}`)
                    .join('\n')
              );
              onNotify('ok', 'Certified fee statement downloaded.');
            }}
            className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download size={14} /> Export Statement
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <span className="text-slate-500">Semester Total Billed</span>
            <strong className="block text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              KES {fin.totalBilled.toLocaleString()}
            </strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <span className="text-slate-500">Verified Payments ({fin.percentPaid}%)</span>
            <strong className="block text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
              KES {fin.totalPaid.toLocaleString()}
            </strong>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <span className="text-slate-500">Outstanding Balance</span>
            <strong className="block text-xl font-bold text-[#092c60] font-mono tabular-nums mt-1">
              KES {fin.balance.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsMpesaModalOpen(true);
            }}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smartphone size={16} className="text-emerald-600" /> Lipa na M-Pesa Online (STK Push)
            </h3>
            <p className="text-slate-500">
              Verified callbacks post an immutable receipt immediately and update your dashboard fee balance.
            </p>
            <div>
              <label className="block text-slate-600 font-medium mb-1">M-Pesa Phone Number</label>
              <input
                type="text"
                required
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Amount to Pay (KES)</label>
              <input
                type="number"
                min={100}
                required
                value={mpesaAmount}
                onChange={(e) => setMpesaAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={mpesaPending}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
            >
              <Smartphone size={14} />
              {mpesaPending ? 'Processing M-Pesa Callback...' : 'Send M-Pesa Payment Prompt'}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Verified Tuition Receipts (Read-Only Ledger)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Receipt</th>
                    <th className="py-2.5 px-4 font-semibold">Channel / Ref</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 px-4 font-mono font-bold text-[#092c60] whitespace-nowrap">{tx.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {tx.paymentMethod} · {tx.referenceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{tx.description}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 whitespace-nowrap">
                        KES {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptForModal(tx)}
                          className="text-[#0866d7] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> View Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            downloadStudentDocument(
                              `${tx.receiptNumber}.txt`,
                              `HI-TECH COLLEGE OFFICIAL RECEIPT\nReceipt No: ${tx.receiptNumber}\nStudent: ${profile.fullName} (${regNo})\nAmount: KES ${tx.amount.toLocaleString()}\nChannel: ${tx.paymentMethod}\nRef: ${tx.referenceNumber}\nStatus: ${tx.status}\n`
                            );
                            onNotify('ok', `Downloaded receipt ${tx.receiptNumber}.`);
                          }}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          TXT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Itemized Semester Fee Structure & Sponsorship Status */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Itemized Semester Fee Structure Invoice ({profile.academicYear} · {profile.semester})
              </h3>
              <p className="text-slate-500 mt-0.5">
                Funding Status: <strong className="text-slate-800">{state.sponsorshipStatus}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                downloadStudentDocument(
                  `Fee_Invoice_${regNo.replace(/\//g, '_')}.txt`,
                  `HI-TECH COLLEGE SEMESTER FEE INVOICE\nStudent: ${profile.fullName} (${regNo})\nProgramme: ${profile.programme}\nSponsorship: ${state.sponsorshipStatus}\n\n` +
                    state.feeStructure.map((f) => `${f.code}\t${f.voteHead}\tKES ${f.amount.toLocaleString()}`).join('\n') +
                    `\n\nTOTAL BILLED: KES ${fin.totalBilled.toLocaleString()}\nTOTAL PAID: KES ${fin.totalPaid.toLocaleString()}\nBALANCE DUE: KES ${fin.balance.toLocaleString()}\n`
                );
                onNotify('ok', 'Itemized semester fee invoice downloaded.');
              }}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download size={14} /> Download Fee Invoice
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Vote Head</th>
                <th className="py-2.5 px-4 font-semibold">Fee Description</th>
                <th className="py-2.5 px-4 font-semibold text-right">Billed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.feeStructure.map((line) => (
                <tr key={line.code}>
                  <td className="py-2.5 px-4 font-mono font-bold text-[#092c60]">{line.code}</td>
                  <td className="py-2.5 px-4 text-slate-800">{line.voteHead}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    KES {line.amount.toLocaleString()}.00
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-[#092c60]">
                <td className="py-3 px-4 font-mono">TOTAL</td>
                <td className="py-3 px-4">Approved Semester Vote Heads</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  KES {fin.totalBilled.toLocaleString()}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SAFARICOM M-PESA STK PHONE PROMPT MODAL */}
        <MpesaStkPromptModal
          isOpen={isMpesaModalOpen}
          phone={mpesaPhone}
          amount={Number(mpesaAmount) || 0}
          accountReference={regNo}
          onConfirm={(code) => {
            setIsMpesaModalOpen(false);
            setMpesaPending(true);
            const numericAmount = Number(mpesaAmount);
            const res = studentPortalService.recordMpesaPayment(mpesaPhone, numericAmount);
            setMpesaPending(false);
            if (!res.ok) return onNotify('err', res.error ?? 'M-Pesa settlement failed.');
            if (res.transaction) {
              setSelectedReceiptForModal(res.transaction);
            }
            const updated = studentPortalService.getFinancialSummary();
            setMpesaAmount(String(updated.balance > 0 ? updated.balance : 1000));
            onNotify('ok', `M-Pesa payment settled! Receipt ${res.receiptNumber} generated.`);
            onRefresh();
          }}
          onCancel={() => setIsMpesaModalOpen(false)}
        />

        {/* OFFICIAL FEE RECEIPT MODAL */}
        <FeeReceiptModal
          transaction={selectedReceiptForModal}
          onClose={() => setSelectedReceiptForModal(null)}
        />
      </div>
    );
  }

  // 8. DIGITAL LIBRARY
  if (activeSection === 'library') {
    const filteredBooks = resources.books.filter(
      (b) =>
        !libraryQuery.trim() ||
        b.title.toLowerCase().includes(libraryQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(libraryQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(libraryQuery.toLowerCase())
    );
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              value={libraryQuery}
              onChange={(e) => setLibraryQuery(e.target.value)}
              placeholder="Filter library catalogue..."
              className="text-xs outline-none w-48"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Physical Library Catalogue &amp; Active Loans ({resources.loans.length} Loaned)
            </h3>
            <div className="divide-y divide-slate-100">
              {filteredBooks.map((b) => {
                const reserved = resources.loans.some(
                  (l) => l.barcode === b.barcode && l.status === 'BORROWED'
                );
                return (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-slate-900 block">{b.title}</strong>
                      <span className="text-slate-500">
                        {b.author} · {b.shelfLocation} · {b.availableCopies}/{b.totalCopies} available
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={reserved || b.availableCopies === 0}
                      onClick={() => {
                        const res = studentPortalService.reserveBook(b.id);
                        if (!res.ok) return onNotify('err', res.error ?? 'Could not reserve');
                        onNotify('ok', `Hold placed on "${b.title}" for circulation desk pickup.`);
                        onRefresh();
                      }}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {reserved ? 'Borrowed / Hold' : 'Reserve Book'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Digital E-Books &amp; Lecture Manuals</h3>
            <div className="space-y-3">
              {resources.digitalResources.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <p className="font-mono text-[#0866d7] font-semibold">
                    {doc.type} · {doc.fileFormat} ({doc.fileSize}) · {doc.publishYear}
                  </p>
                  <strong className="text-sm text-slate-900 block">{doc.title}</strong>
                  <p className="text-slate-600">{doc.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      downloadStudentDocument(
                        `${doc.id}_digital_pack.txt`,
                        `HI-TECH DIGITAL LIBRARY\nTitle: ${doc.title}\nAuthors: ${doc.author}\nProgramme: ${doc.programme}\nSummary: ${doc.description}\n`
                      );
                      onNotify('ok', `Downloaded "${doc.title}".`);
                    }}
                    className="px-3.5 py-1.5 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Download size={13} /> Download Resource
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. DIGITAL STUDENT ID CARD
  if (activeSection === 'student-id') {
    const qrCells = Array.from(
      { length: 49 },
      (_, idx) => ((idx * 7 + regNo.charCodeAt(idx % regNo.length)) % 3) !== 0
    );
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Printer size={14} /> Print Student ID
          </button>
        )}

        <div className="max-w-md bg-[#092c60] text-white rounded-2xl p-6 space-y-5 border border-blue-900">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-wide text-amber-300">HI-TECH COLLEGE AFRICA</span>
            <span className="font-mono">VALID {profile.academicYear}</span>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={studentAvatarUrl}
              alt={profile.fullName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-xl object-cover border-2 border-amber-300 shrink-0"
            />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{profile.fullName}</h3>
              <p className="text-xs font-mono text-amber-300 font-bold">{regNo}</p>
              <p className="text-xs text-blue-100">{profile.programme}</p>
              <p className="text-xs text-blue-200">{profile.campus}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/15 flex items-center justify-between">
            <div className="text-[11px] font-mono text-blue-100 space-y-0.5">
              <div>ADMISSION: {profile.admissionNumber}</div>
              <div>STATUS: {profile.status}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg grid grid-cols-7 gap-0.5 shrink-0" aria-label="Student QR Verification">
              {qrCells.map((filled, idx) => (
                <span key={idx} className={`w-1.5 h-1.5 ${filled ? 'bg-[#092c60]' : 'bg-white'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 10. DOCUMENTS
  if (activeSection === 'documents') {
    const docs = [
      {
        title: 'Official Admission Letter',
        file: `Admission_${profile.admissionNumber}.txt`,
        body: `HI-TECH COLLEGE ADMISSION LETTER\nStudent: ${profile.fullName}\nReg No: ${regNo}\nAdmission: ${profile.admissionNumber}\nProgramme: ${profile.programme}\nCampus: ${profile.campus}`,
      },
      {
        title: 'Consolidated Fee Statement',
        file: `FeeStatement_${regNo.replace(/\//g, '_')}.txt`,
        body: `FEE STATEMENT\nStudent: ${profile.fullName} (${regNo})\nBilled: KES ${fin.totalBilled}\nPaid: KES ${fin.totalPaid}\nBalance: KES ${fin.balance}`,
      },
      {
        title: 'Semester 1 Examination Card',
        file: `ExamCard_${regNo.replace(/\//g, '_')}.txt`,
        body: `EXAMINATION PERMIT\nStudent: ${profile.fullName} (${regNo})\nAttendance: ${profile.attendanceRate}%\nBalance: KES ${fin.balance}`,
      },
      {
        title: 'Student Academic Handbook & Integrity Code',
        file: 'HITECH_Student_Handbook_2026.txt',
        body: 'HI-TECH COLLEGE ACADEMIC CODE: 75% minimum class attendance, 100% final fee clearance, zero tolerance for exam malpractice, Kenya Data Protection Act compliance.',
      },
    ];
    return (
      <div className="space-y-5">
        {SectionShellHeader()}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <div key={doc.title} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{doc.title}</h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{doc.file}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  downloadStudentDocument(doc.file, doc.body);
                  onNotify('ok', `Downloaded ${doc.title}.`);
                }}
                className="px-3.5 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download size={14} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11. STUDENT SUPPORT, LECTURER MESSAGING & HOSTELS/WELFARE
  if (activeSection === 'support') {
    const myTickets = aiSupportCentreService.getState().tickets.filter((t) => t.requesterUserId === 'stu-001');
    const myHostelApps = hostelsState.applications.filter((a) => a.studentRegNo === regNo);
    const myAllocs = hostelsState.allocations.filter((a) => a.studentRegNo === regNo);
    const myWelfare = hostelsState.supportRequests.filter((w) => w.studentRegNo === regNo);

    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSupportTab('tickets')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                supportTab === 'tickets' ? 'bg-white text-[#092c60] font-semibold shadow-sm' : 'text-slate-600'
              }`}
            >
              Helpdesk Tickets
            </button>
            <button
              type="button"
              onClick={() => setSupportTab('lecturers')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                supportTab === 'lecturers' ? 'bg-white text-[#092c60] font-semibold shadow-sm' : 'text-slate-600'
              }`}
            >
              Message Lecturer
            </button>
            <button
              type="button"
              onClick={() => setSupportTab('welfare')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                supportTab === 'welfare' ? 'bg-white text-[#092c60] font-semibold shadow-sm' : 'text-slate-600'
              }`}
            >
              Hostels &amp; Welfare
            </button>
          </div>
        )}

        {supportTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = aiSupportCentreService.createSupportTicket({
                  role: 'STUDENT',
                  category: ticketForm.category,
                  subject: ticketForm.subject,
                  description: ticketForm.description,
                });
                if (!res.ok) return onNotify('err', res.error ?? 'Could not create ticket');
                setTicketForm({ ...ticketForm, subject: '', description: '' });
                onNotify('ok', `Support ticket ${res.ticketRef} created cleanly.`);
                onRefresh();
              }}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900">Raise Student Helpdesk Ticket</h3>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as SupportTicketCategory })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="EXAMS_RESULTS">Examinations, CATs &amp; Results</option>
                <option value="FEES_INVOICING">Finance, Invoicing &amp; Fee Receipt</option>
                <option value="LIBRARY_ELEARNING">Digital Library &amp; E-Learning</option>
                <option value="PORTAL_TECH">Portal &amp; Technical Access</option>
                <option value="ACCOUNT_ACCESS">Account &amp; Password Access</option>
                <option value="HOSTEL_GENERAL">Hostel &amp; Student Services</option>
                <option value="DOCUMENTS">Letters &amp; Official Documents</option>
              </select>
              <input
                type="text"
                required
                placeholder="Ticket subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={3}
                required
                placeholder="Describe your request clearly..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg">
                Submit Support Ticket
              </button>
            </form>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900">My Active Support Tickets ({myTickets.length})</h3>
              {myTickets.map((t) => (
                <div key={t.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between font-mono text-slate-500">
                    <span className="font-bold text-[#092c60]">{t.ticketRef}</span>
                    <span>{t.status} · Priority {t.priority}</span>
                  </div>
                  <strong className="text-slate-900 block">{t.subject}</strong>
                  <p className="text-slate-600">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {supportTab === 'lecturers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = studentPortalService.sendLecturerMessage(msgForm.unitCode, msgForm.subject, msgForm.body);
                if (!res.ok) return onNotify('err', res.error ?? 'Could not send message');
                setMsgForm({ ...msgForm, subject: '', body: '' });
                onNotify('ok', `Message sent to ${msgForm.unitCode} lecturer.`);
                onRefresh();
              }}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900">Message Unit Lecturer</h3>
              <select
                value={msgForm.unitCode}
                onChange={(e) => setMsgForm({ ...msgForm, unitCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {state.units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.lecturerName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Subject"
                value={msgForm.subject}
                onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={3}
                required
                placeholder="Write your academic message..."
                value={msgForm.body}
                onChange={(e) => setMsgForm({ ...msgForm, body: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#092c60] text-white font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
              >
                <Send size={13} /> Send Message
              </button>
            </form>

            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {state.messages.map((m) => (
                <div key={m.id} className="p-4 space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-slate-500">
                    <span>
                      {m.direction === 'OUTBOUND' ? `To ${m.recipientName}` : `From ${m.recipientName}`} · {m.unitCode}
                    </span>
                    <span>{new Date(m.sentAt).toLocaleDateString()}</span>
                  </div>
                  <strong className="text-sm text-slate-900 block">{m.subject}</strong>
                  <p className="text-slate-600">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {supportTab === 'welfare' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = hostelsService.submitApplication({
                  studentRegNo: regNo,
                  studentName: profile.fullName,
                  branch: profile.campus,
                  hostelId: hostelApp.hostelId,
                  startDate: hostelApp.startDate,
                  endDate: hostelApp.endDate,
                  reason: hostelApp.reason,
                });
                if (!res.ok) return onNotify('err', res.error ?? 'Application rejected');
                setHostelApp({ ...hostelApp, reason: '' });
                onNotify('ok', 'Hostel accommodation application submitted cleanly.');
                onRefresh();
              }}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900">Apply for Campus Accommodation</h3>
              <select
                value={hostelApp.hostelId}
                onChange={(e) => setHostelApp({ ...hostelApp, hostelId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {studentHostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.branch} · {h.occupancyPolicy})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={hostelApp.startDate}
                  onChange={(e) => setHostelApp({ ...hostelApp, startDate: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <input
                  type="date"
                  value={hostelApp.endDate}
                  onChange={(e) => setHostelApp({ ...hostelApp, endDate: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <textarea
                rows={2}
                required
                placeholder="Room preference or medical/proximity note..."
                value={hostelApp.reason}
                onChange={(e) => setHostelApp({ ...hostelApp, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg">
                Submit Hostel Application
              </button>

              {(myAllocs.length > 0 || myHostelApps.length > 0) && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {myAllocs.map((al) => {
                    const hostel = hostelsState.hostels.find((h) => h.id === al.hostelId);
                    const room = hostelsState.rooms.find((r) => r.id === al.roomId);
                    const bed = hostelsState.beds.find((b) => b.id === al.bedId);
                    return (
                      <div key={al.id} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <strong>
                          {hostel?.name ?? al.hostelId} · Room {room?.roomCode ?? al.roomId} · Bed {bed?.bedCode ?? al.bedId}
                        </strong>
                        <span className="block font-mono text-[11px]">{al.status} · {al.startDate} to {al.endDate}</span>
                      </div>
                    );
                  })}
                  {myHostelApps.map((ap) => (
                    <div key={ap.id} className="flex justify-between py-1 font-mono text-[11px]">
                      <span>{ap.reference}</span>
                      <span className="text-[#0866d7] font-bold">{ap.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                hostelsService.submitSupportRequest({
                  studentRegNo: regNo,
                  studentName: profile.fullName,
                  branch: profile.campus,
                  category: welfareForm.category,
                  explicitSensitive: true,
                  subject: welfareForm.subject,
                  description: welfareForm.description,
                });
                setWelfareForm({ ...welfareForm, subject: '', description: '' });
                onNotify('ok', 'Confidential welfare request sent to Student Services.');
                onRefresh();
              }}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900">Confidential Counselling &amp; Welfare</h3>
              <select
                value={welfareForm.category}
                onChange={(e) => setWelfareForm({ ...welfareForm, category: e.target.value as SupportRequestCategory })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="COUNSELLING">Confidential Counselling Appointment</option>
                <option value="ACCOMMODATION_WELFARE">Accommodation &amp; Residence Welfare</option>
                <option value="FINANCIAL_AID">Financial Aid / Bursary Support</option>
                <option value="HEALTH_REFERRAL">Health &amp; Medical Referral</option>
                <option value="GENERAL_SUPPORT">General Welfare Support</option>
              </select>
              <input
                type="text"
                required
                placeholder="Confidential request subject"
                value={welfareForm.subject}
                onChange={(e) => setWelfareForm({ ...welfareForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={2}
                required
                placeholder="Private note for college counsellor..."
                value={welfareForm.description}
                onChange={(e) => setWelfareForm({ ...welfareForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg">
                Submit Confidential Request
              </button>

              {myWelfare.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  {myWelfare.map((w) => (
                    <div key={w.id} className="flex justify-between font-mono text-[11px] text-slate-700">
                      <span>{w.caseRef} · {w.subject}</span>
                      <span className="font-bold text-[#092c60]">{w.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    );
  }

  // 12. NOTIFICATIONS CENTER
  if (activeSection === 'notifications') {
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => {
              engagementService.markAllRead();
              onNotify('ok', 'All notifications marked read.');
              onRefresh();
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            Mark All Read
          </button>
        )}
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {engState.notifications.map((n) => (
            <div key={n.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div>
                <p className="font-mono text-slate-400">
                  {n.category} · {new Date(n.createdAt).toLocaleString()}
                </p>
                <strong className={`block mt-0.5 ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>
                  {n.title}
                </strong>
                <p className="text-slate-600 mt-0.5">{n.message}</p>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => {
                    engagementService.markNotificationRead(n.id);
                    onRefresh();
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 13. SETTINGS, GUARDIAN CONSENT & AUDIT LOG
  if (activeSection === 'settings') {
    return (
      <div className="space-y-5">
        {SectionShellHeader()}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#092c60]" /> Account Security &amp; Alerts
            </h3>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <span>
                <strong className="block text-slate-900">Multi-Factor Verification (MFA)</strong>
                <span className="text-slate-500">Require OTP code when downloading transcripts or altering contacts</span>
              </span>
              <input
                type="checkbox"
                checked={state.contact.mfaEnabled}
                onChange={(e) => {
                  studentPortalService.updateSecurityFlags({ mfaEnabled: e.target.checked });
                  onNotify('ok', `MFA verification ${e.target.checked ? 'enabled' : 'disabled'}.`);
                  onRefresh();
                }}
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <span>
                <strong className="block text-slate-900">SMS Examination &amp; Fee Alerts</strong>
                <span className="text-slate-500">Send instant transactional alerts to {state.contact.phoneNumber}</span>
              </span>
              <input
                type="checkbox"
                checked={state.contact.smsAlertsEnabled}
                onChange={(e) => {
                  studentPortalService.updateSecurityFlags({ smsAlertsEnabled: e.target.checked });
                  onRefresh();
                }}
              />
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword.length < 8) {
                  return onNotify('err', 'Password must be at least 8 characters long.');
                }
                studentPortalService.updateSecurityFlags({ passwordRotated: true });
                setNewPassword('');
                onNotify('ok', 'Portal password updated and recorded in your security audit history.');
                onRefresh();
              }}
              className="flex gap-2 pt-1"
            >
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg whitespace-nowrap shrink-0"
              >
                Rotate Password
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-[#0866d7]" /> Student-Authorized Guardian Access
            </h3>
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <span>
                <strong className="block text-slate-900">Allow Parent / Guardian Portal Access</strong>
                <span className="text-slate-500">1-year consent window · revocable anytime by student</span>
              </span>
              <input
                type="checkbox"
                checked={engState.studentGuardianSharingEnabled}
                onChange={(e) => {
                  engagementService.setGuardianConsentEnabled(e.target.checked);
                  onNotify('ok', `Guardian consent ${e.target.checked ? 'enabled' : 'revoked'}.`);
                  onRefresh();
                }}
              />
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = engagementService.inviteGuardian(guardianEmail, ['FEES', 'ACADEMICS', 'ATTENDANCE']);
                if (!res.ok) return onNotify('err', res.error ?? 'Could not send invite');
                setGuardianEmail('');
                onNotify('ok', 'One-time guardian invite sent.');
                onRefresh();
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                required
                placeholder="guardian.email@example.co.ke"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#0866d7] text-white font-semibold rounded-lg whitespace-nowrap shrink-0"
              >
                Invite Guardian
              </button>
            </form>

            <div className="space-y-1.5">
              {engState.guardianLinks.map((lnk) => (
                <div key={lnk.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>
                    <strong className="text-slate-900">{lnk.parentName}</strong> ({lnk.status})
                  </span>
                  {lnk.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => {
                        engagementService.revokeGuardianLink(lnk.id, 'Revoked by student in Settings');
                        onNotify('ok', `Revoked guardian access for ${lnk.parentName}.`);
                        onRefresh();
                      }}
                      className="text-red-700 font-semibold hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock size={15} className="text-[#092c60]" /> Student Security Audit History
          </h3>
          <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs font-mono">
            {state.auditLog.map((ev) => (
              <div key={ev.id} className="py-1.5 border-b border-slate-100 flex flex-wrap gap-2 text-slate-600">
                <span className="text-slate-400 tabular-nums">{new Date(ev.timestampIso).toLocaleTimeString()}</span>
                <span className="font-bold text-[#092c60]">{ev.module}</span>
                <span className="text-slate-800">{ev.action}</span>
                <span>— {ev.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 14. COLLEGE INFORMATION
  return (
    <div className="space-y-5">
      {SectionShellHeader()}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="min-h-[240px]">
          <img
            src={campusHeroUrl}
            alt="HI-TECH College Nairobi Main Campus"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 space-y-3 text-xs">
          <p className="font-semibold text-[#0866d7]">Nairobi Main Campus · Innovation &amp; ICT Centre</p>
          <h3 className="text-lg font-bold text-[#092c60]">HI-TECH College Academic &amp; Student Services</h3>
          <p className="text-slate-600 leading-relaxed">
            TVET-registered and KNEC/CDACC/KASNEB accredited examination centre equipping learners in Software Engineering, Cybersecurity, Cloud Computing, and Business Systems.
          </p>
          <div className="pt-2 space-y-1.5 text-slate-700 font-medium">
            <div className="flex items-center gap-2"><Clock size={14} className="text-[#0866d7]" /> Mon – Sat: 07:30 AM – 08:30 PM EAT</div>
            <div className="flex items-center gap-2"><MapPin size={14} className="text-[#0866d7]" /> Innovation Hub, Academic Wing, Nairobi</div>
            <div className="flex items-center gap-2"><Mail size={14} className="text-[#0866d7]" /> registrar@hitech.ac.ke</div>
          </div>
        </div>
      </div>
    </div>
  );
}

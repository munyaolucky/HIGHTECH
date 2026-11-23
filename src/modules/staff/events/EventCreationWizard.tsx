import React, { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  MapPin,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  EVENT_CATEGORIES,
  type EventAudienceRestriction,
  type EventMode,
  type EventVisibility,
} from '../../../../server/modules/events/events.types';
import {
  staffEventsApi,
  type EventScheduleItemRecord,
  type EventSpeakerRecord,
  type EventVenueConflict,
  type EventVenueRecord,
} from '../../../website/events/eventsApi';
import { EVENT_BANNER_PRESETS } from '../../../website/events/eventBannerKeys';

export interface WizardEventFormState {
  id?: string;
  eventCode?: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  eventDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  isMultiDay: boolean;
  recurrencePattern: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  campus: string;
  venueId: string;
  venue: string;
  building: string;
  room: string;
  mapsLink: string;
  onlinePlatform: string;
  accessibilityInfo: string;
  parkingInfo: string;
  mode: EventMode;
  meetingUrl: string;
  organisingDepartmentName: string;
  organizerName: string;
  contactEmail: string;
  contactPhone: string;
  showContactPhonePublicly: boolean;
  targetAudience: string;
  requirements: string;
  language: string;
  tagsText: string;
  visibility: EventVisibility;
  audienceRestriction: EventAudienceRestriction;
  capacity: number;
  waitlistCapacity: number;
  registrationOpenDate: string;
  registrationDeadline: string;
  isPaid: boolean;
  feeAmount: number;
  studentFeeAmount: number;
  feeCurrency: string;
  requiresApproval: boolean;
  allowWaitlist: boolean;
  allowSelfCancel: boolean;
  reminderHours: number[];
  confirmationMessage: string;
  certificateEnabled: boolean;
  certificateType: string;
  certificateMinAttendance: boolean;
  feedbackEnabled: boolean;
  bannerImageUrl: string;
  featured: boolean;
}

const WIZARD_STEPS = [
  { num: 1, label: 'Basic Info', icon: FileText },
  { num: 2, label: 'Date & Time', icon: Clock },
  { num: 3, label: 'Location & Venue', icon: MapPin },
  { num: 4, label: 'Programme', icon: Calendar },
  { num: 5, label: 'Speakers', icon: Users },
  { num: 6, label: 'Registration', icon: ShieldCheck },
  { num: 7, label: 'Fees & Tickets', icon: DollarSign },
  { num: 8, label: 'Notifications', icon: Bell },
  { num: 9, label: 'Visibility & Certs', icon: Award },
  { num: 10, label: 'Review & Save', icon: CheckCircle2 },
] as const;

interface EventCreationWizardProps {
  formState: WizardEventFormState;
  setFormState: React.Dispatch<React.SetStateAction<WizardEventFormState>>;
  schedules: Array<Partial<EventScheduleItemRecord>>;
  setSchedules: React.Dispatch<React.SetStateAction<Array<Partial<EventScheduleItemRecord>>>>;
  speakers: Array<Partial<EventSpeakerRecord>>;
  setSpeakers: React.Dispatch<React.SetStateAction<Array<Partial<EventSpeakerRecord>>>>;
  venues: EventVenueRecord[];
  saving: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSave: (submitForApproval: boolean) => Promise<void>;
}

export default function EventCreationWizard({
  formState,
  setFormState,
  schedules,
  setSchedules,
  speakers,
  setSpeakers,
  venues,
  saving,
  canSubmit,
  onCancel,
  onSave,
}: EventCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [conflicts, setConflicts] = useState<EventVenueConflict[]>([]);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const runConflictCheck = async () => {
    if (formState.mode === 'ONLINE' || !formState.eventDate) {
      setConflicts([]);
      return;
    }
    setCheckingConflict(true);
    try {
      const found = await staffEventsApi.checkVenueConflict({
        venueId: formState.venueId || undefined,
        venueName: formState.venue,
        eventDate: formState.eventDate,
        startTime: formState.startTime,
        endTime: formState.endTime,
        excludeEventId: formState.id,
      });
      setConflicts(found);
    } catch {
      setConflicts([]);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleVenueSelect = (venueId: string) => {
    const selected = venues.find((v) => v.id === venueId);
    if (!selected) {
      setFormState((s) => ({ ...s, venueId: '' }));
      return;
    }
    setFormState((s) => ({
      ...s,
      venueId: selected.id,
      campus: selected.campus,
      building: selected.building,
      room: selected.name,
      venue: `${selected.campus} — ${selected.name}`,
      accessibilityInfo: s.accessibilityInfo || selected.accessibilityFeatures,
    }));
  };

  const toggleReminderHour = (hr: number) => {
    setFormState((s) => {
      const has = s.reminderHours.includes(hr);
      return {
        ...s,
        reminderHours: has ? s.reminderHours.filter((x) => x !== hr) : [...s.reminderHours, hr].sort((a, b) => b - a),
      };
    });
  };

  const handleStepNext = () => {
    setValidationError(null);
    if (step === 1 && formState.title.trim().length < 4) {
      setValidationError('Enter an event title of at least 4 characters before proceeding.');
      return;
    }
    if (step === 2 && !/^\d{4}-\d{2}-\d{2}$/.test(formState.eventDate)) {
      setValidationError('Select a valid event start date.');
      return;
    }
    if (step === 3 && !formState.venue.trim()) {
      setValidationError('Specify a venue name or digital broadcast channel.');
      return;
    }
    if (step === 6 && (!Number.isFinite(formState.capacity) || formState.capacity < 1)) {
      setValidationError('Seat capacity must be at least 1.');
      return;
    }
    setStep((prev) => Math.min(10, prev + 1));
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (formState.title.trim().length < 4) {
      setValidationError('Event title must be at least 4 characters.');
      setStep(1);
      return;
    }
    await onSave(false);
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#B83232]">
            {formState.id ? `Editing ${formState.eventCode || 'Event'}` : '10-Step Event CMS Wizard'}
          </p>
          <h2 className="text-lg font-black text-[#102D50] dark:text-white">
            {formState.id ? `Edit: ${formState.title || 'College Event'}` : 'Create & Configure New College Event'}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
          >
            Back to Register
          </button>
        </div>
      </div>

      {/* 10-Step Progress Rail */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
        {WIZARD_STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.num;
          const completed = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                setValidationError(null);
                setStep(s.num);
              }}
              className={`rounded-xl border px-2 py-2 text-left transition-colors cursor-pointer ${
                active
                  ? 'bg-[#102D50] border-[#102D50] text-white'
                  : completed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold tabular-nums">
                <span>Step {s.num}</span>
                <Icon size={12} />
              </div>
              <div className="mt-0.5 text-[11px] font-bold truncate">{s.label}</div>
            </button>
          );
        })}
      </div>

      {validationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-3 text-xs font-semibold text-red-800 dark:text-red-200">
          {validationError}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* STEP 1: BASIC INFO */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="lg:col-span-2">
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formState.title}
                onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                placeholder="e.g. HI-TECH Annual Robotics & Applied AI Expo"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-[#102D50] dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Category (21 Official Types) *
              </label>
              <select
                value={formState.category}
                onChange={(e) => setFormState((s) => ({ ...s, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-[#102D50] dark:text-white"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Organising Department / Unit *
              </label>
              <input
                type="text"
                required
                value={formState.organisingDepartmentName}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, organisingDepartmentName: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Language
              </label>
              <input
                type="text"
                value={formState.language}
                onChange={(e) => setFormState((s) => ({ ...s, language: e.target.value }))}
                placeholder="English"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Cover Banner Preset
              </label>
              <select
                value={formState.bannerImageUrl}
                onChange={(e) => setFormState((s) => ({ ...s, bannerImageUrl: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              >
                <option value="">Auto Select by Category</option>
                {EVENT_BANNER_PRESETS.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Short Summary (Website Listing &amp; Cards)
              </label>
              <input
                type="text"
                value={formState.shortDescription}
                onChange={(e) => setFormState((s) => ({ ...s, shortDescription: e.target.value }))}
                placeholder="Concise one-sentence summary displayed on event cards..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Full Description &amp; Objectives
              </label>
              <textarea
                rows={4}
                value={formState.fullDescription}
                onChange={(e) => setFormState((s) => ({ ...s, fullDescription: e.target.value }))}
                placeholder="Detailed programme narrative, learning outcomes, and visitor information..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Topic Tags (comma separated)
              </label>
              <input
                type="text"
                value={formState.tagsText}
                onChange={(e) => setFormState((s) => ({ ...s, tagsText: e.target.value }))}
                placeholder="AI, TVET, Industry Partners, Coding"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 2: DATE & TIME */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formState.eventDate}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    eventDate: e.target.value,
                    endDate: s.isMultiDay ? s.endDate : e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formState.endDate}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    endDate: e.target.value,
                    isMultiDay: e.target.value !== s.eventDate,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={formState.timezone}
                onChange={(e) => setFormState((s) => ({ ...s, timezone: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Start Time *
              </label>
              <input
                type="text"
                required
                value={formState.startTime}
                onChange={(e) => setFormState((s) => ({ ...s, startTime: e.target.value }))}
                placeholder="09:00 AM"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                End Time *
              </label>
              <input
                type="text"
                required
                value={formState.endTime}
                onChange={(e) => setFormState((s) => ({ ...s, endTime: e.target.value }))}
                placeholder="04:00 PM"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Recurrence
              </label>
              <select
                value={formState.recurrencePattern}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    recurrencePattern: e.target.value as WizardEventFormState['recurrencePattern'],
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              >
                <option value="NONE">One-Time Event</option>
                <option value="DAILY">Daily Series</option>
                <option value="WEEKLY">Weekly Recurring</option>
                <option value="MONTHLY">Monthly Recurring</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Registration Opens
              </label>
              <input
                type="datetime-local"
                value={formState.registrationOpenDate.slice(0, 16)}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, registrationOpenDate: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                Registration Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formState.registrationDeadline.slice(0, 16)}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, registrationDeadline: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
              />
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & VENUE CONFLICT CHECK */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Delivery Mode *
                </label>
                <select
                  value={formState.mode}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, mode: e.target.value as EventMode }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                >
                  <option value="PHYSICAL">On-Campus (Physical)</option>
                  <option value="ONLINE">Online Broadcast / Webinar</option>
                  <option value="HYBRID">Hybrid (Physical + Live Stream)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Campus *
                </label>
                <select
                  value={formState.campus}
                  onChange={(e) => setFormState((s) => ({ ...s, campus: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                >
                  <option>Nairobi Main Campus</option>
                  <option>Westlands Technology Park Campus</option>
                  <option>Mombasa Coastal Campus</option>
                  <option>Online Broadcast</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Select Verified College Venue
                </label>
                <select
                  value={formState.venueId}
                  onChange={(e) => handleVenueSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                >
                  <option value="">Custom Venue / External Location</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.campus} — {v.name} (Cap {v.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Display Venue / Access Channel *
                </label>
                <input
                  type="text"
                  required
                  value={formState.venue}
                  onChange={(e) => setFormState((s) => ({ ...s, venue: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Building / Wing &amp; Room
                </label>
                <input
                  type="text"
                  value={formState.building}
                  onChange={(e) => setFormState((s) => ({ ...s, building: e.target.value }))}
                  placeholder="Academic Towers Block A"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Meeting / Livestream URL
                </label>
                <input
                  type="url"
                  value={formState.meetingUrl}
                  onChange={(e) => setFormState((s) => ({ ...s, meetingUrl: e.target.value }))}
                  placeholder="https://meet.hitech.ac.ke/..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Accessibility Notes
                </label>
                <input
                  type="text"
                  value={formState.accessibilityInfo}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, accessibilityInfo: e.target.value }))
                  }
                  placeholder="Ramp access, reserved seating, live captions"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Parking &amp; Gate Arrival Notes
                </label>
                <input
                  type="text"
                  value={formState.parkingInfo}
                  onChange={(e) => setFormState((s) => ({ ...s, parkingInfo: e.target.value }))}
                  placeholder="Visitor parking via Moi Avenue East Gate"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            {formState.mode !== 'ONLINE' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#102D50] dark:text-white">
                    Campus Venue Double-Booking Guard
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Verify that {formState.venue || 'the chosen room'} is free on {formState.eventDate} ({formState.startTime} – {formState.endTime}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runConflictCheck}
                  disabled={checkingConflict}
                  className="rounded-xl bg-[#1769AA] hover:bg-[#102D50] text-white px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {checkingConflict ? 'Checking...' : 'Check Venue Conflicts'}
                </button>
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-1 text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>Schedule Conflict Detected</span>
                </p>
                {conflicts.map((c) => (
                  <p key={c.conflictingEventId} className="text-[11px]">
                    {c.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PROGRAMME & SCHEDULE */}
        {step === 4 && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-slate-300">
                Build the official timed programme displayed on the public event page.
              </p>
              <button
                type="button"
                onClick={() =>
                  setSchedules((prev) => [
                    ...prev,
                    {
                      dayNumber: 1,
                      timeRange: '11:00 AM – 12:30 PM',
                      title: '',
                      speakerName: '',
                      location: formState.room || formState.venue,
                      description: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-bold hover:bg-slate-50 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Programme Slot</span>
              </button>
            </div>
            {schedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                No programme sessions added yet. Click &quot;Add Programme Slot&quot; to begin.
              </div>
            ) : (
              schedules.map((sc, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-800/40"
                >
                  <input
                    type="number"
                    min={1}
                    max={14}
                    aria-label="Day number"
                    value={sc.dayNumber ?? 1}
                    onChange={(e) =>
                      setSchedules((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, dayNumber: Number(e.target.value) || 1 } : x))
                      )
                    }
                    className="md:col-span-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2 font-mono tabular-nums"
                    placeholder="Day"
                  />
                  <input
                    type="text"
                    placeholder="09:00 AM – 10:00 AM"
                    value={sc.timeRange ?? ''}
                    onChange={(e) =>
                      setSchedules((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, timeRange: e.target.value } : x))
                      )
                    }
                    className="md:col-span-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Session Title *"
                    value={sc.title ?? ''}
                    onChange={(e) =>
                      setSchedules((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x))
                      )
                    }
                    className="md:col-span-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Speaker / Facilitator"
                    value={sc.speakerName ?? ''}
                    onChange={(e) =>
                      setSchedules((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, speakerName: e.target.value } : x))
                      )
                    }
                    className="md:col-span-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setSchedules((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove schedule slot"
                    className="md:col-span-1 inline-flex items-center justify-center rounded-lg border border-red-200 text-[#B83232] py-2 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 5: SPEAKERS & FACILITATORS */}
        {step === 5 && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-slate-300">
                Assign keynote speakers, industry guests, moderators, and lab trainers.
              </p>
              <button
                type="button"
                onClick={() =>
                  setSpeakers((prev) => [
                    ...prev,
                    {
                      name: '',
                      roleTitle: '',
                      speakerRole: 'Guest Speaker',
                      organization: 'HI-TECH College',
                      confirmationStatus: 'CONFIRMED',
                      bio: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-bold hover:bg-slate-50 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Speaker</span>
              </button>
            </div>
            {speakers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                No speakers added yet. Click &quot;Add Speaker&quot; to assign presenters.
              </div>
            ) : (
              speakers.map((sp, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-800/40"
                >
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={sp.name ?? ''}
                    onChange={(e) =>
                      setSpeakers((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                      )
                    }
                    className="md:col-span-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Official Title *"
                    value={sp.roleTitle ?? ''}
                    onChange={(e) =>
                      setSpeakers((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, roleTitle: e.target.value } : x))
                      )
                    }
                    className="md:col-span-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2"
                  />
                  <select
                    value={sp.speakerRole ?? 'Guest Speaker'}
                    onChange={(e) =>
                      setSpeakers((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, speakerRole: e.target.value as EventSpeakerRecord['speakerRole'] }
                            : x
                        )
                      )
                    }
                    className="md:col-span-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2"
                  >
                    <option>Keynote Speaker</option>
                    <option>Guest Speaker</option>
                    <option>Facilitator</option>
                    <option>Trainer</option>
                    <option>Moderator</option>
                    <option>Panelist</option>
                    <option>Host</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Organisation"
                    value={sp.organization ?? ''}
                    onChange={(e) =>
                      setSpeakers((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, organization: e.target.value } : x))
                      )
                    }
                    className="md:col-span-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setSpeakers((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove speaker"
                    className="md:col-span-1 inline-flex items-center justify-center rounded-lg border border-red-200 text-[#B83232] py-2 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 6: REGISTRATION & WAITLIST */}
        {step === 6 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Seat Capacity *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formState.capacity}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, capacity: Number(e.target.value) || 1 }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Waitlist Cap
                </label>
                <input
                  type="number"
                  min={0}
                  value={formState.waitlistCapacity}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, waitlistCapacity: Number(e.target.value) || 0 }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Audience Eligibility
                </label>
                <select
                  value={formState.audienceRestriction}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      audienceRestriction: e.target.value as EventAudienceRestriction,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                >
                  <option value="PUBLIC">Open Public Registration</option>
                  <option value="STUDENTS_ONLY">Students Only (HCA/STU Verified)</option>
                  <option value="STAFF_ONLY">Staff Only (HCA/STAFF Verified)</option>
                  <option value="INVITED_ONLY">Invited Guests Only (HTE-INV Code)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Target Audience Description
                </label>
                <input
                  type="text"
                  value={formState.targetAudience}
                  onChange={(e) => setFormState((s) => ({ ...s, targetAudience: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-[#102D50] dark:text-slate-200 mb-1">
                  Entry Requirements
                </label>
                <input
                  type="text"
                  value={formState.requirements}
                  onChange={(e) => setFormState((s) => ({ ...s, requirements: e.target.value }))}
                  placeholder="Student/National ID required"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 pt-2">
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.requiresApproval}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, requiresApproval: e.target.checked }))
                  }
                />
                <span>Require Organizer Approval per Registrant</span>
              </label>
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.allowWaitlist}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, allowWaitlist: e.target.checked }))
                  }
                />
                <span>Enable Automatic Waitlist &amp; Seat Promotion</span>
              </label>
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.allowSelfCancel}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, allowSelfCancel: e.target.checked }))
                  }
                />
                <span>Allow Participant Self-Cancellation</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 7: FEES & TICKET PRICING */}
        {step === 7 && (
          <div className="space-y-4 text-xs">
            <label className="inline-flex items-center gap-2.5 font-bold text-sm text-[#102D50] dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={formState.isPaid}
                onChange={(e) => setFormState((s) => ({ ...s, isPaid: e.target.checked }))}
              />
              <span>Paid Ticketed Event / Workshop Fee Required</span>
            </label>

            {formState.isPaid ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block font-bold mb-1">Currency</label>
                  <select
                    value={formState.feeCurrency}
                    onChange={(e) => setFormState((s) => ({ ...s, feeCurrency: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
                  >
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Standard / External Delegate Fee</label>
                  <input
                    type="number"
                    min={0}
                    value={formState.feeAmount}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, feeAmount: Number(e.target.value) || 0 }))
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Subsidised Student Fee</label>
                  <input
                    type="number"
                    min={0}
                    value={formState.studentFeeAmount}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        studentFeeAmount: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
                This event is configured for <strong>Free Admission</strong>. Instant digital QR passes are generated at zero charge.
              </div>
            )}
          </div>
        )}

        {/* STEP 8: NOTIFICATIONS & REMINDERS */}
        {step === 8 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Lead Coordinator Name</label>
              <input
                type="text"
                value={formState.organizerName}
                onChange={(e) => setFormState((s) => ({ ...s, organizerName: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Official Event Email *</label>
              <input
                type="email"
                required
                value={formState.contactEmail}
                onChange={(e) => setFormState((s) => ({ ...s, contactEmail: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Coordinator Phone</label>
              <input
                type="text"
                value={formState.contactPhone}
                onChange={(e) => setFormState((s) => ({ ...s, contactPhone: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 space-y-2">
              <span className="block font-bold">Automated Reminder Dispatch Windows</span>
              <div className="flex flex-wrap gap-3">
                {[72, 48, 24, 2, 1].map((hr) => (
                  <label key={hr} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.reminderHours.includes(hr)}
                      onChange={() => toggleReminderHour(hr)}
                    />
                    <span className="font-mono tabular-nums">{hr}h before start</span>
                  </label>
                ))}
                <label className="inline-flex items-center gap-2 ml-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formState.showContactPhonePublicly}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, showContactPhonePublicly: e.target.checked }))
                    }
                  />
                  <span>Display coordinator phone publicly</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block font-bold mb-1">
                Custom Ticket Confirmation Arrival Instructions
              </label>
              <textarea
                rows={3}
                value={formState.confirmationMessage}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, confirmationMessage: e.target.value }))
                }
                placeholder="Instructions printed directly onto the participant digital pass..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 9: VISIBILITY, CERTIFICATES & FEEDBACK */}
        {step === 9 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <h3 className="text-sm font-black text-[#102D50] dark:text-white flex items-center gap-2">
                <Eye size={15} className="text-[#1769AA]" />
                <span>Website Visibility &amp; Featured Placement</span>
              </h3>
              <div>
                <label className="block font-bold mb-1">Catalog Visibility</label>
                <select
                  value={formState.visibility}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, visibility: e.target.value as EventVisibility }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="PUBLIC">Public Website Directory</option>
                  <option value="INVITATION">Invitation-Only Landing</option>
                  <option value="INTERNAL">Internal Campus Portal Only</option>
                  <option value="PRIVATE">Private / Unlisted Link</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.featured}
                  onChange={(e) => setFormState((s) => ({ ...s, featured: e.target.checked }))}
                />
                <Sparkles size={14} className="text-[#B83232]" />
                <span>Feature this event in public Events spotlight banner</span>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <h3 className="text-sm font-black text-[#102D50] dark:text-white flex items-center gap-2">
                <Award size={15} className="text-[#B83232]" />
                <span>Certificates &amp; Post-Event Feedback</span>
              </h3>
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.certificateEnabled}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, certificateEnabled: e.target.checked }))
                  }
                />
                <span>Issue Verifiable HI-TECH Certificates</span>
              </label>
              {formState.certificateEnabled && (
                <div className="space-y-2">
                  <select
                    value={formState.certificateType}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, certificateType: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option>Certificate of Participation</option>
                    <option>Certificate of Attendance</option>
                    <option>Certificate of Completion</option>
                    <option>Certificate of Achievement</option>
                    <option>Certificate of Presentation</option>
                    <option>Certificate of Training</option>
                  </select>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.certificateMinAttendance}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, certificateMinAttendance: e.target.checked }))
                      }
                    />
                    <span>Require QR check-in attendance to unlock certificate</span>
                  </label>
                </div>
              )}
              <label className="inline-flex items-center gap-2 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formState.feedbackEnabled}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, feedbackEnabled: e.target.checked }))
                  }
                />
                <span>Enable public post-event evaluation &amp; NPS survey</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 10: REVIEW & SUBMIT */}
        {step === 10 && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F5EBDD]/60 dark:bg-slate-800/50 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-bold">Title &amp; Category</p>
                <p className="font-black text-[#102D50] dark:text-white text-sm mt-0.5">
                  {formState.title || 'Untitled Event'}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {formState.category} · {formState.organisingDepartmentName}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-bold">Schedule &amp; Venue</p>
                <p className="font-bold text-[#102D50] dark:text-white mt-0.5 font-mono tabular-nums">
                  {formState.eventDate} ({formState.startTime} – {formState.endTime})
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {formState.mode} · {formState.venue}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-bold">Capacity &amp; Pricing</p>
                <p className="font-bold text-[#102D50] dark:text-white mt-0.5 font-mono tabular-nums">
                  {formState.capacity} seats (Waitlist {formState.waitlistCapacity})
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {formState.isPaid
                    ? `${formState.feeCurrency} ${formState.feeAmount} (Student ${formState.studentFeeAmount})`
                    : 'Free Admission'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-bold">Programme &amp; Speakers</p>
                <p className="font-bold text-[#102D50] dark:text-white mt-0.5 font-mono tabular-nums">
                  {schedules.filter((s) => s.title).length} sessions · {speakers.filter((s) => s.name).length} speakers
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-bold">Governance &amp; Audience</p>
                <p className="font-bold text-[#102D50] dark:text-white mt-0.5">
                  {formState.visibility} · {formState.audienceRestriction}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {formState.requiresApproval ? 'Approval per registrant' : 'Instant pass issuance'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-[10px] font-bold">Certificates &amp; Feedback</p>
                <p className="font-bold text-[#102D50] dark:text-white mt-0.5">
                  {formState.certificateEnabled ? formState.certificateType : 'No certificates'}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {formState.feedbackEnabled ? 'Survey active' : 'Survey off'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Wizard Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#102D50] text-[#102D50] dark:text-white dark:border-slate-600 px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : formState.id ? 'Save Changes' : 'Save as Draft'}</span>
            </button>

            {canSubmit && (
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#B83232] hover:bg-[#952424] text-white px-4 py-2 text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                <Send size={14} />
                <span>Save &amp; Submit for Approval</span>
              </button>
            )}

            {step < 10 && (
              <button
                type="button"
                onClick={handleStepNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-4 py-2 text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                <span>Next Step</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}

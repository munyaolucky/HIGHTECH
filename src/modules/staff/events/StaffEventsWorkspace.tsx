import React, { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  CreditCard,
  Download,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { hasStaffPermission, type StaffUserAccount } from '../../../config/staff-navigation';
import {
  staffEventsApi,
  type CollegeEventRecord,
  type EventAuditLogRecord,
  type EventCertificateRecord,
  type EventFeedbackRecord,
  type EventInvitationRecord,
  type EventMediaRecord,
  type EventNotificationRecord,
  type EventPaymentRecord,
  type EventRegistrationRecord,
  type EventScheduleItemRecord,
  type EventSpeakerRecord,
  type EventVenueRecord,
  type EventsDashboardKpis,
  type EventsDashboardPayload,
  type PublicEventSummary,
} from '../../../website/events/eventsApi';
import { StaffButton, StaffPageHeader, StaffStatCard } from '../components/StaffDashboardUI';
import EventCreationWizard, { type WizardEventFormState } from './EventCreationWizard';
import {
  CertificatesPanel,
  FeedbackPanel,
  InvitationsPanel,
  MediaPanel,
  PaymentsPanel,
  ReportsPanel,
  SettingsPanel,
  VenuesPanel,
} from './StaffEventsOperationsPanels';
import {
  ApprovalsDashboardPanel,
  CommunicationsDashboardPanel,
  CoordinatorDashboardPanel,
  ProgrammeSpeakersPanel,
  StaffEventsCalendarPanel,
} from './StaffEventsExtendedDashboards';
import { Calendar, Mic } from 'lucide-react';
import ModuleDocumentRepository from '../../documents/ModuleDocumentRepository';

export type StaffEventsSection =
  | 'overview'
  | 'coordinator'
  | 'approvals'
  | 'calendar'
  | 'events'
  | 'create'
  | 'programme'
  | 'registrations'
  | 'checkin'
  | 'venues'
  | 'payments'
  | 'invitations'
  | 'communications'
  | 'certificates'
  | 'feedback'
  | 'media'
  | 'reports'
  | 'settings'
  | 'logs';

interface StaffEventsWorkspaceProps {
  user: StaffUserAccount;
  initialSection?: StaffEventsSection;
  initialEventId?: string;
  onBack?: () => void;
  onOpenPublicPreview?: (publicPath: string) => void;
}

function StaffCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

const DEFAULT_WIZARD_FORM = (user: StaffUserAccount): WizardEventFormState => {
  const startDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  return {
    title: '',
    category: 'Workshop & Training',
    shortDescription: '',
    fullDescription: '',
    eventDate: startDate,
    endDate: startDate,
    startTime: '09:00 AM',
    endTime: '04:00 PM',
    timezone: 'Africa/Nairobi',
    isMultiDay: false,
    recurrencePattern: 'NONE',
    campus: 'Nairobi Main Campus',
    venueId: 'venue-innovation-hall',
    venue: 'Nairobi Main Campus — Innovation Hall',
    building: 'Technology Block A',
    room: 'Main Hall',
    mapsLink: '',
    onlinePlatform: 'Microsoft Teams',
    accessibilityInfo: 'Step-free ramp access and reserved front-row seating',
    parkingInfo: 'Complimentary visitor parking at Gate B',
    mode: 'PHYSICAL',
    meetingUrl: '',
    organisingDepartmentName: user.department,
    organizerName: user.fullName,
    contactEmail: user.email,
    contactPhone: '+254 700 100 201',
    showContactPhonePublicly: true,
    targetAudience: 'Students, Prospective Applicants & Staff',
    requirements: '',
    language: 'English',
    tagsText: 'Skills, Innovation',
    visibility: 'PUBLIC',
    audienceRestriction: 'PUBLIC',
    capacity: 120,
    waitlistCapacity: 30,
    registrationOpenDate: new Date().toISOString().slice(0, 16),
    registrationDeadline: `${startDate}T08:00`,
    isPaid: false,
    feeAmount: 0,
    studentFeeAmount: 0,
    feeCurrency: 'KES',
    requiresApproval: false,
    allowWaitlist: true,
    allowSelfCancel: true,
    reminderHours: [24, 2],
    confirmationMessage: 'Present your QR pass at the registration desk 15 minutes prior.',
    certificateEnabled: true,
    certificateType: 'Certificate of Participation',
    certificateMinAttendance: true,
    feedbackEnabled: true,
    bannerImageUrl: 'local:ai-symposium',
    featured: false,
  };
};

export default function StaffEventsWorkspace({
  user,
  initialSection = 'overview',
  initialEventId,
  onBack,
  onOpenPublicPreview,
}: StaffEventsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<StaffEventsSection>(initialSection);
  const [kpis, setKpis] = useState<EventsDashboardKpis | null>(null);
  const [events, setEvents] = useState<PublicEventSummary[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<
    EventsDashboardPayload['recentRegistrations']
  >([]);
  const [capacityAlerts, setCapacityAlerts] = useState<EventsDashboardPayload['capacityAlerts']>([]);
  const [deadlineAlerts, setDeadlineAlerts] = useState<EventsDashboardPayload['deadlineAlerts']>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    EventsDashboardPayload['categoryBreakdown']
  >([]);
  const [notifications, setNotifications] = useState<EventNotificationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<EventAuditLogRecord[]>([]);
  const [venues, setVenues] = useState<EventVenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '');
  const [selectedRegistrations, setSelectedRegistrations] = useState<
    Omit<EventRegistrationRecord, 'lookupTokenHash'>[]
  >([]);
  const [selectedPayments, setSelectedPayments] = useState<EventPaymentRecord[]>([]);
  const [selectedInvitations, setSelectedInvitations] = useState<EventInvitationRecord[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<EventFeedbackRecord[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState({
    responseCount: 0,
    averageRating: 0,
    npsScore: 0,
  });
  const [selectedCertificates, setSelectedCertificates] = useState<EventCertificateRecord[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<EventMediaRecord[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<EventScheduleItemRecord[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<EventSpeakerRecord[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<EventNotificationRecord[]>([]);

  const [regFilter, setRegFilter] = useState('ALL');
  const [regSearch, setRegSearch] = useState('');

  // Wizard state
  const [formState, setFormState] = useState<WizardEventFormState>(() => DEFAULT_WIZARD_FORM(user));
  const [scheduleDrafts, setScheduleDrafts] = useState<Array<Partial<EventScheduleItemRecord>>>([]);
  const [speakerDrafts, setSpeakerDrafts] = useState<Array<Partial<EventSpeakerRecord>>>([]);
  const [savingForm, setSavingForm] = useState(false);

  // Cancel / Delete modals (inline UI, zero window.confirm)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PublicEventSummary | null>(null);

  // Manual & Bulk Registration forms
  const [manualRegOpen, setManualRegOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCategory, setManualCategory] = useState('Student');
  const [manualIdNo, setManualIdNo] = useState('');
  const [manualTicketType, setManualTicketType] = useState('General Admission');
  const [manualNote, setManualNote] = useState('');

  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState(
    'Grace Njoki,grace.njoki@hitech.ac.ke,+254711002200,Student,HCA/STU/2026/001\nPeter Kiprop,p.kiprop@hitech.ac.ke,+254722113344,Industry Partner,'
  );

  // Organiser Notes inline editor
  const [editingNoteRegId, setEditingNoteRegId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Check-In / Check-Out Desk
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInEventScope, setCheckInEventScope] = useState('');
  const [checkInResult, setCheckInResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Announcement form
  const [announceSubject, setAnnounceSubject] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [announceAudience, setAnnounceAudience] = useState<'CONFIRMED' | 'WAITLISTED' | 'ALL'>(
    'CONFIRMED'
  );

  // Permissions
  const canCreate = hasStaffPermission(user.permissions, 'event.create');
  const canEdit = hasStaffPermission(user.permissions, 'event.edit');
  const canDelete = hasStaffPermission(user.permissions, 'event.delete');
  const canSubmit = hasStaffPermission(user.permissions, 'event.submit');
  const canApprove = hasStaffPermission(user.permissions, 'event.approve');
  const canPublish = hasStaffPermission(user.permissions, 'event.publish');
  const canCancel = hasStaffPermission(user.permissions, 'event.cancel');
  const canViewRegs = hasStaffPermission(user.permissions, 'event.registration.view');
  const canAddRegs = hasStaffPermission(user.permissions, 'event.registration.create') || canEdit;
  const canApproveRegs = hasStaffPermission(user.permissions, 'event.registration.approve');
  const canExportRegs = hasStaffPermission(user.permissions, 'event.registration.export');
  const canCheckIn = hasStaffPermission(user.permissions, 'event.checkin');
  const canManageVenues = hasStaffPermission(user.permissions, 'event.venues.manage');
  const canVerifyPayments = hasStaffPermission(user.permissions, 'event.payments.verify');
  const canRefundPayments = hasStaffPermission(user.permissions, 'event.payments.refund');
  const canManageInvites = hasStaffPermission(user.permissions, 'event.invitations.manage');
  const canGenerateCerts = hasStaffPermission(user.permissions, 'event.certificates.generate');
  const canViewFeedback = hasStaffPermission(user.permissions, 'event.feedback.view');
  const canManageMedia = hasStaffPermission(user.permissions, 'event.media.manage');
  const canViewReports = hasStaffPermission(user.permissions, 'event.reports.view');
  const canManageSettings = hasStaffPermission(user.permissions, 'event.settings.manage');

  useEffect(() => {
    setActiveTab(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (initialEventId) setSelectedEventId(initialEventId);
  }, [initialEventId]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [data, venueRows] = await Promise.all([
        staffEventsApi.getDashboard(),
        staffEventsApi.listVenues().catch(() => [] as EventVenueRecord[]),
      ]);
      setKpis(data.kpis);
      setEvents(data.events);
      setRecentRegistrations(data.recentRegistrations);
      setCapacityAlerts(data.capacityAlerts);
      setDeadlineAlerts(data.deadlineAlerts);
      setCategoryBreakdown(data.categoryBreakdown);
      setNotifications(data.recentNotifications);
      setAuditLogs(data.auditLogs);
      setVenues(venueRows);
      setSelectedEventId((prev) => prev || data.events[0]?.id || '');
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load events workspace.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const loadSelectedEventDetail = useCallback(async (eventId: string) => {
    if (!eventId) return;
    try {
      const detail = await staffEventsApi.getEventDetail(eventId);
      setSelectedRegistrations(detail.registrations);
      setSelectedPayments(detail.payments);
      setSelectedInvitations(detail.invitations);
      setSelectedFeedback(detail.feedback);
      setFeedbackSummary(detail.feedbackSummary);
      setSelectedCertificates(detail.certificates);
      setSelectedMedia(detail.media);
      setSelectedSchedules(detail.schedules);
      setSelectedSpeakers(detail.speakers);
      setSelectedNotifications(detail.notifications);
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load selected event operations.',
      });
    }
  }, []);

  useEffect(() => {
    const needsDetail = [
      'registrations',
      'checkin',
      'programme',
      'payments',
      'invitations',
      'communications',
      'certificates',
      'feedback',
      'media',
    ].includes(activeTab);
    if (selectedEventId && needsDetail) {
      loadSelectedEventDetail(selectedEventId);
    }
  }, [selectedEventId, activeTab, loadSelectedEventDetail]);

  const selectedEventObj = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId]
  );

  const filteredEvents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return events.filter((ev) => {
      if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false;
      if (q) {
        const hay = `${ev.eventCode} ${ev.title} ${ev.category} ${ev.venue} ${ev.organisingDepartmentName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, searchTerm, statusFilter]);

  const filteredRegs = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    return selectedRegistrations.filter((r) => {
      if (regFilter !== 'ALL' && r.status !== regFilter) return false;
      if (q) {
        const hay = `${r.fullName} ${r.email} ${r.registrationNumber} ${r.phone} ${r.qrToken} ${r.ticketType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [selectedRegistrations, regFilter, regSearch]);

  const openNewEventWizard = () => {
    setFormState(DEFAULT_WIZARD_FORM(user));
    setScheduleDrafts([
      {
        dayNumber: 1,
        timeRange: '09:00 AM – 10:30 AM',
        title: 'Opening Keynote & Registration',
        speakerName: user.fullName,
        location: 'Main Hall',
        description: '',
      },
    ]);
    setSpeakerDrafts([
      {
        name: user.fullName,
        roleTitle: user.roleTitle,
        speakerRole: 'Host',
        organization: 'HI-TECH College',
        confirmationStatus: 'CONFIRMED',
        bio: '',
      },
    ]);
    setActiveTab('create');
  };

  const openEditEvent = async (event: CollegeEventRecord) => {
    setFormState({
      id: event.id,
      eventCode: event.eventCode,
      title: event.title,
      category: event.category,
      shortDescription: event.shortDescription,
      fullDescription: event.fullDescription,
      eventDate: event.eventDate,
      endDate: event.endDate || event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      timezone: event.timezone || 'Africa/Nairobi',
      isMultiDay: Boolean(event.isMultiDay),
      recurrencePattern: event.recurrencePattern || 'NONE',
      campus: event.campus || 'Nairobi Main Campus',
      venueId: event.venueId || '',
      venue: event.venue,
      building: event.building || '',
      room: event.room || '',
      mapsLink: event.mapsLink || '',
      onlinePlatform: event.onlinePlatform || '',
      accessibilityInfo: event.accessibilityInfo || '',
      parkingInfo: event.parkingInfo || '',
      mode: event.mode,
      meetingUrl: event.meetingUrl || '',
      organisingDepartmentName: event.organisingDepartmentName,
      organizerName: event.organizerName,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      showContactPhonePublicly: event.showContactPhonePublicly ?? true,
      targetAudience: event.targetAudience,
      requirements: event.requirements,
      language: event.language || 'English',
      tagsText: (event.tags || []).join(', '),
      visibility: event.visibility || 'PUBLIC',
      audienceRestriction: event.audienceRestriction,
      capacity: event.capacity,
      waitlistCapacity: event.waitlistCapacity ?? 25,
      registrationOpenDate: (event.registrationOpenDate || event.createdAt).slice(0, 16),
      registrationDeadline: event.registrationDeadline.slice(0, 16),
      isPaid: event.isPaid,
      feeAmount: event.feeAmount,
      studentFeeAmount: event.studentFeeAmount ?? 0,
      feeCurrency: event.feeCurrency || 'KES',
      requiresApproval: event.requiresApproval,
      allowWaitlist: event.allowWaitlist,
      allowSelfCancel: event.allowSelfCancel,
      reminderHours: event.reminderHours ?? [24, 2],
      confirmationMessage: event.confirmationMessage || '',
      certificateEnabled: event.certificateEnabled ?? true,
      certificateType: event.certificateType || 'Certificate of Participation',
      certificateMinAttendance: event.certificateMinAttendance ?? true,
      feedbackEnabled: event.feedbackEnabled ?? true,
      bannerImageUrl: event.bannerImageUrl || '',
      featured: event.featured,
    });
    try {
      const detail = await staffEventsApi.getEventDetail(event.id);
      setScheduleDrafts(detail.schedules);
      setSpeakerDrafts(detail.speakers);
    } catch {
      setScheduleDrafts([]);
      setSpeakerDrafts([]);
    }
    setActiveTab('create');
  };

  const handleSaveWizard = async (submitToo: boolean) => {
    setBannerMsg(null);
    setSavingForm(true);
    try {
      const tags = formState.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<CollegeEventRecord> & {
        schedules?: Array<Partial<EventScheduleItemRecord>>;
        speakers?: Array<Partial<EventSpeakerRecord>>;
        submitForApproval?: boolean;
      } = {
        ...formState,
        venueId: formState.venueId || null,
        tags,
        schedules: scheduleDrafts,
        speakers: speakerDrafts,
        submitForApproval: submitToo,
      };

      let saved: CollegeEventRecord;
      if (formState.id) {
        saved = await staffEventsApi.updateEvent(formState.id, payload);
        if (submitToo && canSubmit && saved.status === 'DRAFT') {
          saved = await staffEventsApi.submitEvent(saved.id);
        }
      } else {
        saved = await staffEventsApi.createEvent(payload);
      }

      setBannerMsg({
        type: 'success',
        text: `Event "${saved.title}" (${saved.eventCode}) saved with status ${saved.status}.`,
      });
      await loadDashboard();
      setSelectedEventId(saved.id);
      setActiveTab('events');
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save event.',
      });
    } finally {
      setSavingForm(false);
    }
  };

  const runWorkflowAction = async (
    action: 'submit' | 'approve' | 'publish' | 'duplicate',
    eventId: string,
    title: string
  ) => {
    setBannerMsg(null);
    try {
      if (action === 'submit') await staffEventsApi.submitEvent(eventId);
      if (action === 'approve') await staffEventsApi.approveEvent(eventId);
      if (action === 'publish') await staffEventsApi.publishEvent(eventId);
      if (action === 'duplicate') {
        const cloned = await staffEventsApi.duplicateEvent(eventId);
        setBannerMsg({
          type: 'success',
          text: `Cloned "${title}" as new draft "${cloned.title}" (${cloned.eventCode}).`,
        });
        await loadDashboard();
        return;
      }
      setBannerMsg({
        type: 'success',
        text: `Workflow action "${action.toUpperCase()}" completed for "${title}".`,
      });
      await loadDashboard();
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : `Failed to ${action} event.`,
      });
    }
  };

  const handleCancelEventConfirm = async () => {
    if (!cancelTargetId) return;
    try {
      await staffEventsApi.cancelEvent(
        cancelTargetId,
        cancelReason.trim() || 'Cancelled by college management.'
      );
      setBannerMsg({
        type: 'success',
        text: 'Event cancelled and registered participants notified.',
      });
      setCancelTargetId(null);
      setCancelReason('');
      await loadDashboard();
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to cancel event.',
      });
    }
  };

  const handleDeleteOrArchiveConfirm = async (hardDelete: boolean) => {
    if (!deleteTarget) return;
    try {
      await staffEventsApi.archiveOrDeleteEvent(deleteTarget.id, hardDelete);
      setBannerMsg({
        type: 'success',
        text: hardDelete
          ? `Permanently deleted "${deleteTarget.title}".`
          : `Archived "${deleteTarget.title}" from active listings.`,
      });
      setDeleteTarget(null);
      await loadDashboard();
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to remove event.',
      });
    }
  };

  const handleRegistrationAction = async (
    regId: string,
    action: 'APPROVE' | 'REJECT' | 'CANCEL' | 'PROMOTE'
  ) => {
    setBannerMsg(null);
    try {
      if (action === 'PROMOTE') {
        await staffEventsApi.promoteWaitlisted(regId);
      } else {
        await staffEventsApi.updateRegistrationStatus(regId, action);
      }
      setBannerMsg({
        type: 'success',
        text: `Participant registration updated (${action}).`,
      });
      await Promise.all([loadDashboard(), loadSelectedEventDetail(selectedEventId)]);
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Registration update failed.',
      });
    }
  };

  const handleManualAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      const res = await staffEventsApi.addStaffRegistration(selectedEventId, {
        fullName: manualName,
        email: manualEmail,
        phone: manualPhone,
        participantCategory: manualCategory,
        studentOrStaffNumber: manualIdNo,
        ticketType: manualTicketType,
        organiserNotes: manualNote,
        autoConfirm: true,
      });
      setBannerMsg({
        type: 'success',
        text: `Added ${res.registration.fullName} (${res.registration.registrationNumber}).`,
      });
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      setManualIdNo('');
      setManualNote('');
      setManualRegOpen(false);
      await Promise.all([loadDashboard(), loadSelectedEventDetail(selectedEventId)]);
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Manual registration failed.',
      });
    }
  };

  const handleBulkCsvSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    const rows = bulkCsvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [fullName = '', email = '', phone = '', participantCategory = 'Student', studentOrStaffNumber = ''] =
          line.split(',').map((c) => c.trim());
        return { fullName, email, phone, participantCategory, studentOrStaffNumber };
      })
      .filter((r) => r.fullName && r.email);

    if (rows.length === 0) {
      setBannerMsg({ type: 'error', text: 'Enter at least one valid "Full Name, Email" row.' });
      return;
    }

    try {
      const res = await staffEventsApi.bulkRegisterParticipants(selectedEventId, rows);
      setBannerMsg({
        type: 'success',
        text: `Bulk import added ${res.addedCount} participant(s).${
          res.skipped.length > 0 ? ` Skipped ${res.skipped.length} duplicate/invalid row(s).` : ''
        }`,
      });
      setBulkImportOpen(false);
      await Promise.all([loadDashboard(), loadSelectedEventDetail(selectedEventId)]);
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Bulk import failed.',
      });
    }
  };

  const handleSaveRegNote = async (regId: string) => {
    try {
      await staffEventsApi.updateRegistrationNotes(regId, { organiserNotes: editingNoteText });
      setEditingNoteRegId(null);
      setBannerMsg({ type: 'success', text: 'Updated organiser participant notes.' });
      await loadSelectedEventDetail(selectedEventId);
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update note.',
      });
    }
  };

  const handleCheckInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = checkInInput.trim();
    if (!raw) return;
    setCheckInResult(null);
    try {
      const payload = raw.toUpperCase().startsWith('HTE-QR-')
        ? { qrToken: raw, eventId: checkInEventScope || undefined }
        : { registrationNumber: raw, eventId: checkInEventScope || undefined };
      const res = await staffEventsApi.checkIn(payload);
      setCheckInResult({
        ok: true,
        message: `Checked in ${res.registration.fullName} (${res.registration.registrationNumber}) for ${res.eventTitle}.`,
      });
      setCheckInInput('');
      await loadDashboard();
      if (selectedEventId) await loadSelectedEventDetail(selectedEventId);
    } catch (err) {
      setCheckInResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Check-in rejected.',
      });
    }
  };

  const handleQuickCheckInOut = async (
    reg: Omit<EventRegistrationRecord, 'lookupTokenHash'>,
    mode: 'IN' | 'OUT'
  ) => {
    setCheckInResult(null);
    try {
      if (mode === 'IN') {
        const res = await staffEventsApi.checkIn({ registrationId: reg.id, eventId: reg.eventId });
        setCheckInResult({
          ok: true,
          message: `Checked IN ${res.registration.fullName} (${res.registration.registrationNumber}).`,
        });
      } else {
        const res = await staffEventsApi.checkOut({ registrationId: reg.id, eventId: reg.eventId });
        setCheckInResult({
          ok: true,
          message: `Checked OUT ${res.registration.fullName} (${res.registration.registrationNumber}).`,
        });
      }
      await Promise.all([loadDashboard(), loadSelectedEventDetail(selectedEventId)]);
    } catch (err) {
      setCheckInResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Attendance scan update failed.',
      });
    }
  };

  const handleSendAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setBannerMsg(null);
    try {
      const res = await staffEventsApi.sendAnnouncement(selectedEventId, {
        subject: announceSubject,
        message: announceMessage,
        audience: announceAudience,
      });
      setBannerMsg({
        type: 'success',
        text: `Dispatched notification to ${res.sentCount} participant(s).`,
      });
      setAnnounceSubject('');
      setAnnounceMessage('');
      await loadDashboard();
    } catch (err) {
      setBannerMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Announcement failed.',
      });
    }
  };

  const pendingApprovalEvents = useMemo(
    () => events.filter((e) => e.status === 'PENDING_APPROVAL'),
    [events]
  );

  const navTabs: Array<{
    key: StaffEventsSection;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    visible: boolean;
  }> = [
    { key: 'overview', label: 'Overview & KPIs', icon: Layers, visible: true },
    { key: 'coordinator', label: 'Coordinator', icon: UserPlus, visible: true },
    {
      key: 'approvals',
      label: `Approvals${pendingApprovalEvents.length ? ` (${pendingApprovalEvents.length})` : ''}`,
      icon: ShieldCheck,
      visible: true,
    },
    { key: 'calendar', label: 'Calendar', icon: Calendar, visible: true },
    { key: 'events', label: 'All Events', icon: CalendarDays, visible: true },
    {
      key: 'create',
      label: formState.id ? 'Edit Wizard' : 'Create Wizard',
      icon: Edit3,
      visible: canCreate || canEdit,
    },
    { key: 'programme', label: 'Programme & Speakers', icon: Mic, visible: true },
    { key: 'registrations', label: 'Registrations', icon: Users, visible: canViewRegs },
    { key: 'checkin', label: 'Check-In / Out', icon: QrCode, visible: canCheckIn },
    { key: 'venues', label: 'Venues', icon: Building2, visible: true },
    { key: 'payments', label: 'Payments', icon: CreditCard, visible: canVerifyPayments || canViewRegs },
    { key: 'invitations', label: 'Invitations', icon: Mail, visible: canManageInvites || canEdit },
    { key: 'communications', label: 'Communications', icon: Send, visible: canEdit || canManageInvites },
    { key: 'certificates', label: 'Certificates', icon: Award, visible: canGenerateCerts || canViewRegs },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare, visible: canViewFeedback || canViewRegs },
    { key: 'media', label: 'Media', icon: ImageIcon, visible: canManageMedia || canEdit },
    { key: 'reports', label: 'Reports', icon: BarChart3, visible: canViewReports },
    { key: 'settings', label: 'Settings', icon: Settings, visible: true },
    { key: 'logs', label: 'Audit & Alerts', icon: Bell, visible: true },
  ];

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="HI-TECH College Events Operations & CMS"
        description="Unified campus & public event lifecycle: 10-step wizard, venue conflict prevention, registrations, bursar fees, invitations, QR check-in/out, certificates, and NPS analytics."
        breadcrumb="Institutional Operations / Events Management System"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {onOpenPublicPreview && (
              <>
                <StaffButton variant="secondary" onClick={() => onOpenPublicPreview('/events')}>
                  <ExternalLink size={15} />
                  <span>Public Events</span>
                </StaffButton>
                <StaffButton
                  variant="secondary"
                  onClick={() => onOpenPublicPreview('/events/calendar')}
                >
                  <CalendarDays size={15} />
                  <span>Public Calendar</span>
                </StaffButton>
              </>
            )}
            {canCreate && (
              <StaffButton onClick={openNewEventWizard}>
                <Plus size={15} />
                <span>Create Event</span>
              </StaffButton>
            )}
            {onBack && (
              <StaffButton variant="secondary" onClick={onBack}>
                Back
              </StaffButton>
            )}
          </div>
        }
      />

      {bannerMsg && (
        <div
          role="status"
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between gap-3 ${
            bannerMsg.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
          }`}
        >
          <span>{bannerMsg.text}</span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            className="text-xs font-bold underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {navTabs
          .filter((t) => t.visible)
          .map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#102D50] text-white dark:bg-[#1769AA]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
      </div>

      {/* ========================================================== */}
      {/* TAB: OVERVIEW & 18 KPIs                                    */}
      {/* ========================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {kpis ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono tabular-nums">
                <StaffStatCard
                  label="Total / Published Events"
                  value={`${kpis.totalEvents} / ${kpis.publishedEvents}`}
                  description={`${kpis.upcomingEvents} upcoming · ${kpis.draftEvents} drafts`}
                  icon={CalendarDays}
                />
                <StaffStatCard
                  label="Pending Event Approvals"
                  value={kpis.pendingEventApprovals}
                  description={`${kpis.ongoingEvents} ongoing · ${kpis.completedEvents} completed`}
                  icon={ShieldCheck}
                />
                <StaffStatCard
                  label="Active Registrations"
                  value={kpis.activeRegistrations}
                  description={`${kpis.confirmedAttendees} confirmed · ${kpis.waitlistedParticipants} waitlisted`}
                  icon={Users}
                />
                <StaffStatCard
                  label="Check-Ins / Fees (KES)"
                  value={`${kpis.checkedInAttendees} / ${kpis.totalRevenueKes.toLocaleString()}`}
                  description={`${kpis.checkedOutAttendees} checked out · KES ${kpis.outstandingFeesKes.toLocaleString()} pending`}
                  icon={QrCode}
                />
              </section>

              {/* Secondary Granular Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono tabular-nums">
                {[
                  { label: 'Drafts', val: kpis.draftEvents },
                  { label: 'Cancelled Events', val: kpis.cancelledEvents },
                  { label: 'Pending Regs', val: kpis.pendingRegistrationApprovals },
                  { label: 'Checked Out', val: kpis.checkedOutAttendees },
                  { label: 'No-Shows (Past)', val: kpis.noShowParticipants },
                  { label: 'Cancelled Passes', val: kpis.cancelledRegistrations },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
                  >
                    <p className="font-sans text-[11px] font-semibold text-slate-500">{m.label}</p>
                    <p className="mt-1 text-lg font-black text-[#102D50] dark:text-white">{m.val}</p>
                  </div>
                ))}
              </div>
            </>
          ) : loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              Loading institutional events KPIs...
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Approval Queue + Operational Alerts */}
            <div className="lg:col-span-7 space-y-6">
              <StaffCard
                title="Event Approval Queue"
                subtitle="Separation-of-duties review: creators cannot approve their own submitted events."
              >
                {pendingApprovalEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">
                    No events waiting for governance approval right now.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovalEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#102D50] dark:text-white">{ev.title}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            {ev.eventCode} · {ev.eventDate} · Submitted by {ev.createdByName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <StaffButton variant="secondary" onClick={() => openEditEvent(ev)}>
                              Review
                            </StaffButton>
                          )}
                          {canApprove && ev.createdById !== user.id && (
                            <StaffButton
                              onClick={() => runWorkflowAction('approve', ev.id, ev.title)}
                            >
                              Approve Event
                            </StaffButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </StaffCard>

              <StaffCard
                title="Capacity & Closing Deadline Alerts"
                subtitle="Events approaching 80%+ occupancy or registration cutoff within 48 hours."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <h3 className="font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-[#B83232]" />
                      <span>High Occupancy ({capacityAlerts.length})</span>
                    </h3>
                    {capacityAlerts.length === 0 ? (
                      <p className="text-slate-500">All upcoming events have comfortable seat capacity.</p>
                    ) : (
                      capacityAlerts.map((c) => (
                        <div
                          key={c.eventId}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5"
                        >
                          <p className="font-bold text-[#102D50] dark:text-white">{c.title}</p>
                          <p className="font-mono text-[11px] text-[#B83232] tabular-nums">
                            {c.occupancyPct}% filled · {c.availableSeats} left · {c.waitlistCount} waitlisted
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                      <RefreshCw size={14} className="text-[#1769AA]" />
                      <span>Closing Deadlines ({deadlineAlerts.length})</span>
                    </h3>
                    {deadlineAlerts.length === 0 ? (
                      <p className="text-slate-500">No registrations closing in the next 48 hours.</p>
                    ) : (
                      deadlineAlerts.map((d) => (
                        <div
                          key={d.eventId}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5"
                        >
                          <p className="font-bold text-[#102D50] dark:text-white">{d.title}</p>
                          <p className="font-mono text-[11px] text-[#1769AA] tabular-nums">
                            Closes in {d.hoursRemaining}h ({d.eventDate})
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </StaffCard>
            </div>

            {/* Category Breakdown & Recent Registrations */}
            <div className="lg:col-span-5 space-y-6">
              <StaffCard title="Registrations by Category" subtitle="Cumulative sign-ups across active categories.">
                <div className="space-y-2.5 text-xs">
                  {categoryBreakdown.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2"
                    >
                      <span className="font-semibold text-[#102D50] dark:text-white">{cat.category}</span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {cat.eventCount} evt · <strong>{cat.registrations}</strong> regs
                      </span>
                    </div>
                  ))}
                </div>
              </StaffCard>

              <StaffCard title="Recent Registrations Feed" subtitle="Latest public & portal event sign-ups.">
                <div className="space-y-2 text-xs">
                  {recentRegistrations.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#102D50] dark:text-white truncate">{r.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          <span className="font-mono text-[#1769AA]">{r.registrationNumber}</span> ·{' '}
                          {r.eventTitle}
                        </p>
                      </div>
                      <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold shrink-0">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </StaffCard>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB: ALL EVENTS & WORKFLOW                                 */}
      {/* ========================================================== */}
      {activeTab === 'events' && (
        <StaffCard
          title="College Events & Approval Pipeline"
          subtitle="Workflow: Draft -> Pending Approval -> Approved -> Published. Creators cannot approve their own events."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, code, venue..."
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PUBLISHED">Published</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <StaffButton variant="secondary" onClick={loadDashboard}>
                <RefreshCw size={14} />
                <span>Refresh</span>
              </StaffButton>
            </div>
          }
        >
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading college events...</div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((ev) => {
                const isCreator = ev.createdById === user.id;
                const badgeClass: Record<string, string> = {
                  PUBLISHED: 'bg-emerald-100 text-emerald-800',
                  APPROVED: 'bg-blue-100 text-blue-800',
                  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
                  DRAFT: 'bg-slate-100 text-slate-700',
                  CANCELLED: 'bg-red-100 text-red-800',
                  COMPLETED: 'bg-indigo-100 text-indigo-800',
                  ARCHIVED: 'bg-slate-200 text-slate-700',
                };

                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {ev.eventCode}
                        </span>
                        <span
                          className={`rounded-lg px-2.5 py-0.5 text-[11px] font-extrabold ${
                            badgeClass[ev.status] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {ev.status}
                        </span>
                        <span className="text-[11px] font-bold text-[#1769AA]">{ev.category}</span>
                        {ev.featured && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F5EBDD] text-[#102D50] px-2 py-0.5 text-[11px] font-bold">
                            <Sparkles size={11} className="text-[#B83232]" />
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-[#102D50] dark:text-white">
                        {ev.title}
                      </h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        <span>
                          {ev.eventDate} · {ev.startTime} – {ev.endTime}
                        </span>
                        <span className="font-sans">{ev.venue}</span>
                        <span>
                          Seats: {ev.registeredCount}/{ev.capacity}
                        </span>
                        <span>Waitlist: {ev.waitlistCount}</span>
                        <span>Checked-In: {ev.checkedInCount}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {canEdit && (
                        <StaffButton variant="secondary" onClick={() => openEditEvent(ev)}>
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </StaffButton>
                      )}
                      {canCreate && (
                        <StaffButton
                          variant="secondary"
                          onClick={() => runWorkflowAction('duplicate', ev.id, ev.title)}
                        >
                          <Copy size={13} />
                          <span>Duplicate</span>
                        </StaffButton>
                      )}
                      {canSubmit && ev.status === 'DRAFT' && (
                        <StaffButton
                          onClick={() => runWorkflowAction('submit', ev.id, ev.title)}
                        >
                          Submit
                        </StaffButton>
                      )}
                      {canApprove && ev.status === 'PENDING_APPROVAL' && !isCreator && (
                        <StaffButton
                          onClick={() => runWorkflowAction('approve', ev.id, ev.title)}
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve</span>
                        </StaffButton>
                      )}
                      {canPublish && (ev.status === 'APPROVED' || ev.status === 'DRAFT') && (
                        <StaffButton
                          onClick={() => runWorkflowAction('publish', ev.id, ev.title)}
                        >
                          Publish Live
                        </StaffButton>
                      )}
                      {canViewRegs && (
                        <StaffButton
                          variant="secondary"
                          onClick={() => {
                            setSelectedEventId(ev.id);
                            setActiveTab('registrations');
                          }}
                        >
                          <Users size={13} />
                          <span>Registrations</span>
                        </StaffButton>
                      )}
                      {canCancel && !['CANCELLED', 'COMPLETED', 'ARCHIVED'].includes(ev.status) && (
                        <StaffButton
                          variant="danger"
                          onClick={() => {
                            setCancelTargetId(ev.id);
                            setCancelReason('');
                          }}
                        >
                          <XCircle size={13} />
                          <span>Cancel</span>
                        </StaffButton>
                      )}
                      {canDelete && (
                        <StaffButton variant="secondary" onClick={() => setDeleteTarget(ev)}>
                          <Trash2 size={13} />
                        </StaffButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cancel Modal */}
          {cancelTargetId && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
              <h4 className="text-xs font-black text-red-900">Confirm Official Event Cancellation</h4>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason to send to registered participants..."
                className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs"
              />
              <div className="flex justify-end gap-2">
                <StaffButton variant="secondary" onClick={() => setCancelTargetId(null)}>
                  Keep Event
                </StaffButton>
                <StaffButton variant="danger" onClick={handleCancelEventConfirm}>
                  Cancel Event &amp; Notify
                </StaffButton>
              </div>
            </div>
          )}

          {/* Archive / Hard Delete Confirmation */}
          {deleteTarget && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <h4 className="text-xs font-black text-amber-950">
                Archive or Delete &ldquo;{deleteTarget.title}&rdquo;?
              </h4>
              <p className="text-xs text-amber-900">
                Archiving hides the event from public listings while preserving attendance &amp; bursar
                audit history. Hard delete removes draft records permanently.
              </p>
              <div className="flex justify-end gap-2">
                <StaffButton variant="secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </StaffButton>
                <StaffButton
                  variant="secondary"
                  onClick={() => handleDeleteOrArchiveConfirm(false)}
                >
                  Archive Event
                </StaffButton>
                {deleteTarget.registeredCount === 0 && (
                  <StaffButton
                    variant="danger"
                    onClick={() => handleDeleteOrArchiveConfirm(true)}
                  >
                    Delete Permanently
                  </StaffButton>
                )}
              </div>
            </div>
          )}
        </StaffCard>
      )}

      {/* ========================================================== */}
      {/* TAB: 10-STEP EVENT CREATION & EDITING WIZARD               */}
      {/* ========================================================== */}
      {activeTab === 'create' && (
        <EventCreationWizard
          formState={formState}
          setFormState={setFormState}
          schedules={scheduleDrafts}
          setSchedules={setScheduleDrafts}
          speakers={speakerDrafts}
          setSpeakers={setSpeakerDrafts}
          venues={venues}
          saving={savingForm}
          canSubmit={canSubmit}
          onCancel={() => setActiveTab('events')}
          onSave={handleSaveWizard}
        />
      )}

      {/* ========================================================== */}
      {/* TAB: REGISTRATIONS, MANUAL ADD, BULK CSV & ANNOUNCEMENTS   */}
      {/* ========================================================== */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          <StaffCard
            title="Event Registrations, Waitlist & Participant Actions"
            subtitle="Approve provisional seats, add walk-ins manually, bulk import CSV rosters, edit notes, and export attendance CSV."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Select event"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.registeredCount}/{ev.capacity})
                    </option>
                  ))}
                </select>
                {canAddRegs && selectedEventId && (
                  <>
                    <StaffButton
                      variant="secondary"
                      onClick={() => {
                        setManualRegOpen((v) => !v);
                        setBulkImportOpen(false);
                      }}
                    >
                      <UserPlus size={14} />
                      <span>Manual Add</span>
                    </StaffButton>
                    <StaffButton
                      variant="secondary"
                      onClick={() => {
                        setBulkImportOpen((v) => !v);
                        setManualRegOpen(false);
                      }}
                    >
                      <Upload size={14} />
                      <span>Bulk CSV</span>
                    </StaffButton>
                  </>
                )}
                {canExportRegs && selectedEventId && (
                  <a
                    href={`/api/events/${encodeURIComponent(selectedEventId)}/export`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-[#102D50] dark:text-white hover:bg-slate-50"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </a>
                )}
              </div>
            }
          >
            {/* Manual Add Participant Drawer */}
            {manualRegOpen && (
              <form
                onSubmit={handleManualAddSubmit}
                className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#102D50] dark:text-white">
                    Manual Staff Participant Registration
                  </h3>
                  <button
                    type="button"
                    onClick={() => setManualRegOpen(false)}
                    className="text-slate-500 underline cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Full Name *"
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2"
                  />
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="Email Address *"
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2"
                  />
                  <input
                    type="tel"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="Phone (+254...)"
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2"
                  />
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2"
                  >
                    <option value="Student">Student</option>
                    <option value="Staff Member">Staff Member</option>
                    <option value="Industry Partner">Industry Partner</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Guest / VIP">Guest / VIP</option>
                  </select>
                  <input
                    type="text"
                    value={manualIdNo}
                    onChange={(e) => setManualIdNo(e.target.value)}
                    placeholder="Student/Staff No"
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2"
                  />
                  <select
                    value={manualTicketType}
                    onChange={(e) => setManualTicketType(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2"
                  >
                    <option value="General Admission">General Admission</option>
                    <option value="Student Ticket">Student Ticket</option>
                    <option value="VIP">VIP</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Exhibitor">Exhibitor</option>
                    <option value="Complimentary">Complimentary</option>
                  </select>
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Organiser Note"
                    className="sm:col-span-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2"
                  />
                </div>
                <div className="flex justify-end">
                  <StaffButton type="submit">Add Confirmed Participant</StaffButton>
                </div>
              </form>
            )}

            {/* Bulk CSV Paste Importer */}
            {bulkImportOpen && (
              <form
                onSubmit={handleBulkCsvSubmit}
                className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#102D50] dark:text-white">
                    Bulk CSV Participant Import (Full Name, Email, Phone, Category, Student/Staff No)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setBulkImportOpen(false)}
                    className="text-slate-500 underline cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-900 p-3 font-mono text-[11px]"
                />
                <div className="flex justify-end">
                  <StaffButton type="submit">Run Bulk Import</StaffButton>
                </div>
              </form>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="search"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search attendee name, reg number, QR..."
                className="flex-1 min-w-[200px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
              <select
                value={regFilter}
                onChange={(e) => setRegFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending Approval</option>
                <option value="WAITLISTED">Waitlisted</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {filteredRegs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No registrations match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                      <th className="py-2 pr-3 font-bold">Reg # &amp; Ticket</th>
                      <th className="py-2 pr-3 font-bold">Participant</th>
                      <th className="py-2 pr-3 font-bold">Category / Mode</th>
                      <th className="py-2 pr-3 font-bold">Status &amp; Pay</th>
                      <th className="py-2 pr-3 font-bold">Attendance &amp; Notes</th>
                      <th className="py-2 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRegs.map((reg) => (
                      <tr key={reg.id}>
                        <td className="py-3 pr-3 font-mono">
                          <div className="font-bold text-[#102D50] dark:text-white">
                            {reg.registrationNumber}
                          </div>
                          <div className="text-[11px] text-slate-500">{reg.qrToken}</div>
                          <div className="text-[10px] text-[#1769AA] font-sans font-bold">
                            {reg.ticketType}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-bold text-[#102D50] dark:text-white">{reg.fullName}</div>
                          <div className="text-[11px] text-slate-500">{reg.email}</div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {reg.phone}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div>{reg.participantCategory}</div>
                          <div className="text-[11px] font-semibold text-[#1769AA]">
                            {reg.attendanceMode}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-bold">
                            {reg.status}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            Pay: {reg.paymentStatus}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-semibold">
                            {reg.checkedOut
                              ? 'Checked Out'
                              : reg.checkedIn
                              ? 'Checked In'
                              : 'Not Arrived'}
                          </div>
                          {editingNoteRegId === reg.id ? (
                            <div className="mt-1 flex items-center gap-1">
                              <input
                                type="text"
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                className="rounded border border-slate-300 px-2 py-0.5 text-[11px]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRegNote(reg.id)}
                                className="rounded bg-[#102D50] text-white px-2 py-0.5 text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteRegId(reg.id);
                                setEditingNoteText(reg.organiserNotes || '');
                              }}
                              className="text-[10px] text-[#1769AA] hover:underline cursor-pointer mt-0.5 block"
                            >
                              {reg.organiserNotes ? `Note: ${reg.organiserNotes}` : '+ Add note'}
                            </button>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            {canApproveRegs && reg.status === 'PENDING' && (
                              <StaffButton
                                onClick={() => handleRegistrationAction(reg.id, 'APPROVE')}
                              >
                                Approve
                              </StaffButton>
                            )}
                            {canApproveRegs && reg.status === 'WAITLISTED' && (
                              <StaffButton
                                onClick={() => handleRegistrationAction(reg.id, 'PROMOTE')}
                              >
                                Promote
                              </StaffButton>
                            )}
                            {canApproveRegs && reg.status === 'PENDING' && (
                              <StaffButton
                                variant="danger"
                                onClick={() => handleRegistrationAction(reg.id, 'REJECT')}
                              >
                                Reject
                              </StaffButton>
                            )}
                            {canApproveRegs && ['CONFIRMED', 'WAITLISTED'].includes(reg.status) && (
                              <StaffButton
                                variant="secondary"
                                onClick={() => handleRegistrationAction(reg.id, 'CANCEL')}
                              >
                                Cancel
                              </StaffButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </StaffCard>

          <StaffCard
            title="Send Event Participant Notification"
            subtitle="Dispatch verified portal/email updates to confirmed, waitlisted, or all active registrants."
          >
            <form onSubmit={handleSendAnnouncement} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <select
                value={announceAudience}
                onChange={(e) =>
                  setAnnounceAudience(e.target.value as 'CONFIRMED' | 'WAITLISTED' | 'ALL')
                }
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              >
                <option value="CONFIRMED">Confirmed Registrants Only</option>
                <option value="WAITLISTED">Waitlisted Queue Only</option>
                <option value="ALL">All Active Registrants</option>
              </select>
              <input
                type="text"
                required
                value={announceSubject}
                onChange={(e) => setAnnounceSubject(e.target.value)}
                placeholder="Announcement Subject *"
                className="md:col-span-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              />
              <textarea
                rows={2}
                required
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
                placeholder="Write schedule update, hall change, or pre-event instructions..."
                className="md:col-span-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
              />
              <div className="flex items-end">
                <StaffButton type="submit">
                  <Send size={14} />
                  <span>Send Update</span>
                </StaffButton>
              </div>
            </form>
          </StaffCard>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB: QR CHECK-IN & CHECK-OUT DESK                          */}
      {/* ========================================================== */}
      {activeTab === 'checkin' && (
        <StaffCard
          title="Live QR Code Check-In & Check-Out Attendance Desk"
          subtitle="Scan or enter an HTE-QR-... token or HTE-EVT-... registration number to verify gate entry and exit."
          actions={
            <select
              aria-label="Event scope"
              value={checkInEventScope || selectedEventId}
              onChange={(e) => {
                setCheckInEventScope(e.target.value);
                if (e.target.value) setSelectedEventId(e.target.value);
              }}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold"
            >
              <option value="">All Upcoming Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.checkedInCount}/{ev.registeredCount} checked in)
                </option>
              ))}
            </select>
          }
        >
          {(() => {
            const confirmedList = selectedRegistrations.filter((r) => r.status === 'CONFIRMED');
            const checkedInCount = confirmedList.filter((r) => r.checkedIn).length;
            const remainingCount = Math.max(0, confirmedList.length - checkedInCount);
            const pct =
              confirmedList.length > 0
                ? Math.round((checkedInCount / confirmedList.length) * 1000) / 10
                : 0;
            return (
              <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
                  <span className="font-sans text-[11px] font-semibold text-slate-500 block">
                    Confirmed
                  </span>
                  <strong className="text-lg font-black text-[#102D50] dark:text-white">
                    {confirmedList.length}
                  </strong>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
                  <span className="font-sans text-[11px] font-semibold text-slate-500 block">
                    Checked In
                  </span>
                  <strong className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {checkedInCount}
                  </strong>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
                  <span className="font-sans text-[11px] font-semibold text-slate-500 block">
                    Remaining
                  </span>
                  <strong className="text-lg font-black text-amber-700 dark:text-amber-400">
                    {remainingCount}
                  </strong>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
                  <span className="font-sans text-[11px] font-semibold text-slate-500 block">
                    Live Attendance %
                  </span>
                  <strong className="text-lg font-black text-[#1769AA]">{pct}%</strong>
                </div>
              </div>
            );
          })()}

          <form onSubmit={handleCheckInSubmit} className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              type="text"
              value={checkInInput}
              onChange={(e) => setCheckInInput(e.target.value)}
              placeholder="Scan / type HTE-QR-SUMMIT01 or HTE-EVT-2026-0001..."
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-mono"
            />
            <StaffButton type="submit">
              <ClipboardCheck size={15} />
              <span>Verify &amp; Check In</span>
            </StaffButton>
          </form>

          {checkInResult && (
            <div
              role="status"
              className={`mb-5 rounded-xl border p-4 text-xs font-bold flex items-center gap-2 ${
                checkInResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {checkInResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{checkInResult.message}</span>
            </div>
          )}

          <div className="space-y-2">
            {selectedRegistrations
              .filter((r) => r.status === 'CONFIRMED')
              .map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#102D50] dark:text-white mr-2">
                      {reg.registrationNumber}
                    </span>
                    <span className="font-bold">{reg.fullName}</span>
                    <span className="text-slate-500 ml-2">({reg.participantCategory})</span>
                    <span className="text-slate-400 font-mono ml-2">{reg.qrToken}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!reg.checkedIn ? (
                      <StaffButton onClick={() => handleQuickCheckInOut(reg, 'IN')}>
                        <LogIn size={13} />
                        <span>Check In</span>
                      </StaffButton>
                    ) : !reg.checkedOut ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 text-emerald-800 px-2.5 py-1 font-bold">
                          <CheckCircle2 size={13} />
                          In ({reg.checkedInAt?.slice(11, 16)})
                        </span>
                        <StaffButton
                          variant="secondary"
                          onClick={() => handleQuickCheckInOut(reg, 'OUT')}
                        >
                          <LogOut size={13} />
                          <span>Check Out</span>
                        </StaffButton>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-700 px-2.5 py-1 font-bold">
                        Checked Out ({reg.checkedOutAt?.slice(11, 16)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </StaffCard>
      )}

      {activeTab === 'coordinator' && (
        <CoordinatorDashboardPanel
          user={user}
          events={events}
          canEdit={canEdit}
          onEditEvent={openEditEvent}
          onSelectWorkspaceTab={(tab, eventId) => {
            setSelectedEventId(eventId);
            setActiveTab(tab);
          }}
          onOpenWizard={openNewEventWizard}
        />
      )}

      {activeTab === 'approvals' && (
        <ApprovalsDashboardPanel
          user={user}
          events={events}
          auditLogs={auditLogs}
          canApprove={canApprove}
          canEdit={canEdit}
          onReload={loadDashboard}
          onEditEvent={openEditEvent}
          onNotify={setBannerMsg}
        />
      )}

      {activeTab === 'calendar' && (
        <StaffEventsCalendarPanel
          events={events}
          onSelectEvent={(ev) => {
            setSelectedEventId(ev.id);
            setActiveTab('registrations');
          }}
        />
      )}

      {/* ========================================================== */}
      {/* OPERATIONS SUB-PANELS (VENUES -> SETTINGS)                 */}
      {/* ========================================================== */}
      {activeTab === 'venues' && (
        <VenuesPanel
          venues={venues}
          canManage={canManageVenues}
          onReload={loadDashboard}
          onNotify={setBannerMsg}
        />
      )}

      {(activeTab === 'programme' ||
        activeTab === 'payments' ||
        activeTab === 'invitations' ||
        activeTab === 'communications' ||
        activeTab === 'certificates' ||
        activeTab === 'feedback' ||
        activeTab === 'media') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs">
            <span className="font-bold text-[#102D50] dark:text-white">
              Active Event Context:
            </span>
            <select
              aria-label="Select event context"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="min-w-[260px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-semibold"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.eventCode} — {ev.title}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'programme' && (
            <ProgrammeSpeakersPanel
              eventId={selectedEventId}
              eventTitle={selectedEventObj?.title || ''}
              schedules={selectedSchedules}
              speakers={selectedSpeakers}
              canEdit={canEdit}
              onReload={() => loadSelectedEventDetail(selectedEventId)}
              onNotify={setBannerMsg}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsPanel
              eventId={selectedEventId}
              eventTitle={selectedEventObj?.title || ''}
              payments={selectedPayments}
              canVerify={canVerifyPayments}
              canRefund={canRefundPayments}
              onReload={() => loadSelectedEventDetail(selectedEventId)}
              onNotify={setBannerMsg}
            />
          )}

          {activeTab === 'invitations' && (
            <InvitationsPanel
              eventId={selectedEventId}
              eventTitle={selectedEventObj?.title || ''}
              invitations={selectedInvitations}
              canManage={canManageInvites}
              onReload={() => loadSelectedEventDetail(selectedEventId)}
              onNotify={setBannerMsg}
            />
          )}

          {activeTab === 'communications' && (
            <CommunicationsDashboardPanel
              eventId={selectedEventId}
              eventTitle={selectedEventObj?.title || ''}
              notifications={selectedNotifications}
              onReload={async () => {
                await Promise.all([loadDashboard(), loadSelectedEventDetail(selectedEventId)]);
              }}
              onNotify={setBannerMsg}
            />
          )}

          {activeTab === 'certificates' && (
            <CertificatesPanel
              eventId={selectedEventId}
              eventTitle={selectedEventObj?.title || ''}
              certificates={selectedCertificates}
              canManage={canGenerateCerts}
              onReload={() => loadSelectedEventDetail(selectedEventId)}
              onNotify={setBannerMsg}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackPanel
              eventTitle={selectedEventObj?.title || ''}
              feedback={selectedFeedback}
              summary={feedbackSummary}
            />
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              <MediaPanel
                eventId={selectedEventId}
                eventTitle={selectedEventObj?.title || ''}
                media={selectedMedia}
                canManage={canManageMedia}
                onReload={() => loadSelectedEventDetail(selectedEventId)}
                onNotify={setBannerMsg}
              />
              <ModuleDocumentRepository
                moduleKey="EVENTS"
                relatedEntityType="COLLEGE_EVENT"
                relatedEntityId={selectedEventId}
                courseOrClass={selectedEventObj?.eventCode}
                defaultRecipient="Events & Communications Desk"
                title="Event Programmes, Briefs & Press Kits (Central DMS)"
                description="Store signed venue approvals, event programmes, sponsorship agreements, and press kits linked to this event."
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && <ReportsPanel canExport={canExportRegs} />}

      {activeTab === 'settings' && (
        <SettingsPanel canManage={canManageSettings} onNotify={setBannerMsg} />
      )}

      {/* ========================================================== */}
      {/* TAB: NOTIFICATIONS & AUDIT LOG                             */}
      {/* ========================================================== */}
      {activeTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StaffCard title="Dispatched Event Notifications" subtitle="Automated tickets, approvals, and announcements.">
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold text-[#102D50] dark:text-white">
                    <span>{n.subject}</span>
                    <span className="text-[10px] text-[#1769AA]">{n.channel}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{n.message}</p>
                  <p className="text-[11px] text-slate-400">
                    To: {n.recipientName} ({n.recipientTarget})
                  </p>
                </div>
              ))}
            </div>
          </StaffCard>

          <StaffCard title="Events Governance Audit Log" subtitle="Immutable operational action trail.">
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold text-[#102D50] dark:text-white">
                    <span>{log.action}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {log.createdAt.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{log.detail}</p>
                  <p className="text-[11px] text-[#1769AA] font-semibold">
                    {log.actorName} ({log.actorRole})
                  </p>
                </div>
              ))}
            </div>
          </StaffCard>
        </div>
      )}
    </div>
  );
}

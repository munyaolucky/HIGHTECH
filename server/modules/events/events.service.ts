import crypto from 'node:crypto';
import {
  allocateCertificateNumber,
  allocateEventCode,
  allocateEventRegistrationNumber,
  getDb,
  saveDb,
  type PortalDatabase,
} from '../../data/store.ts';
import { hashEventToken } from './events.seed.ts';
import type {
  CollegeEventRecord,
  CollegeEventStatus,
  EventAuditLogRecord,
  EventAudienceRestriction,
  EventCertificateRecord,
  EventFeedbackRecord,
  EventInvitationRecord,
  EventInvitationStatus,
  EventMediaRecord,
  EventMode,
  EventNotificationRecord,
  EventPaymentRecord,
  EventPaymentStatus,
  EventRegistrationRecord,
  EventRegistrationStatus,
  EventScheduleItemRecord,
  EventSettingsRecord,
  EventSpeakerRecord,
  EventVenueConflict,
  EventVenueRecord,
  EventVisibility,
  EventsDashboardKpis,
  EventsDashboardPayload,
  PublicEventDetail,
  PublicEventSummary,
  PublicRegistrationTicketView,
} from './events.types.ts';

export interface EventsActor {
  id: string;
  fullName: string;
  role: string;
  permissions: string[];
}

export class EventsHttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'college-event'
  );
}

function ensureUniqueEventSlug(db: PortalDatabase, baseSlug: string, excludeId?: string): string {
  let candidate = slugify(baseSlug);
  let suffix = 2;
  while (db.collegeEvents.some((e) => e.slug === candidate && e.id !== excludeId)) {
    candidate = `${slugify(baseSlug)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(formulaSafe)) {
    return `"${formulaSafe.replace(/"/g, '""')}"`;
  }
  return formulaSafe;
}

function parseTimeToMinutes(timeLabel: string): number {
  const match = timeLabel.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return -1;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = (match[3] ?? '').toUpperCase();
  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);
  if (sA < 0 || eA < 0 || sB < 0 || eB < 0) return true;
  return sA < eB && sB < eA;
}

function recalculateEventCounters(db: PortalDatabase, eventId: string): void {
  const event = db.collegeEvents.find((e) => e.id === eventId);
  if (!event) return;
  const regs = db.collegeEventRegistrations.filter((r) => r.eventId === eventId);
  event.registeredCount = regs.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING').length;
  event.waitlistCount = regs.filter((r) => r.status === 'WAITLISTED').length;
  event.checkedInCount = regs.filter((r) => r.checkedIn && r.status === 'CONFIRMED').length;
  event.checkedOutCount = regs.filter((r) => r.checkedOut && r.status === 'CONFIRMED').length;
  event.updatedAt = nowIso();
}

function queueNotification(
  db: PortalDatabase,
  input: {
    eventId: string;
    registrationId: string | null;
    channel: 'EMAIL' | 'SMS' | 'PORTAL';
    recipientName: string;
    recipientTarget: string;
    subject: string;
    message: string;
  }
): EventNotificationRecord {
  const rec: EventNotificationRecord = {
    id: `enot-${crypto.randomUUID().slice(0, 8)}`,
    eventId: input.eventId,
    registrationId: input.registrationId,
    channel: input.channel,
    recipientName: input.recipientName,
    recipientTarget: input.recipientTarget,
    subject: input.subject,
    message: input.message,
    status: 'DISPATCHED',
    createdAt: nowIso(),
  };
  db.collegeEventNotifications.unshift(rec);
  return rec;
}

function appendAudit(
  db: PortalDatabase,
  actor: EventsActor,
  eventId: string,
  action: string,
  detail: string
): EventAuditLogRecord {
  const log: EventAuditLogRecord = {
    id: `eaud-${crypto.randomUUID().slice(0, 8)}`,
    eventId,
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    detail,
    createdAt: nowIso(),
  };
  db.collegeEventAuditLogs.unshift(log);
  return log;
}

function computeRegistrationOpen(event: CollegeEventRecord): {
  isRegistrationOpen: boolean;
  registrationClosedReason: string | null;
  availableSeats: number;
  isToday: boolean;
  isPast: boolean;
} {
  const today = todayDateString();
  const isToday = event.eventDate <= today && (event.endDate || event.eventDate) >= today;
  const isPast = event.status === 'COMPLETED' || (event.endDate || event.eventDate) < today;
  const occupied = Math.max(0, event.registeredCount);
  const availableSeats = Math.max(0, event.capacity - occupied);

  if (!event.isPublished || !['PUBLISHED', 'ONGOING'].includes(event.status)) {
    return {
      isRegistrationOpen: false,
      registrationClosedReason:
        event.status === 'CANCELLED'
          ? 'This event has been cancelled.'
          : event.status === 'COMPLETED' || isPast
          ? 'This event has already taken place.'
          : 'Registration is currently closed for this event.',
      availableSeats,
      isToday,
      isPast,
    };
  }

  if (isPast) {
    return {
      isRegistrationOpen: false,
      registrationClosedReason: 'This event date has passed.',
      availableSeats,
      isToday,
      isPast,
    };
  }

  const deadlineMs = Date.parse(event.registrationDeadline);
  if (!Number.isNaN(deadlineMs) && deadlineMs < Date.now()) {
    return {
      isRegistrationOpen: false,
      registrationClosedReason: 'Registration deadline has passed.',
      availableSeats,
      isToday,
      isPast,
    };
  }

  if (availableSeats === 0 && !event.allowWaitlist) {
    return {
      isRegistrationOpen: false,
      registrationClosedReason: 'All seats are filled and waitlist is closed.',
      availableSeats: 0,
      isToday,
      isPast,
    };
  }

  return {
    isRegistrationOpen: true,
    registrationClosedReason: null,
    availableSeats,
    isToday,
    isPast,
  };
}

function toPublicSummary(event: CollegeEventRecord): PublicEventSummary {
  const meta = computeRegistrationOpen(event);
  return {
    ...event,
    ...meta,
  };
}

function toPublicTicketView(
  reg: EventRegistrationRecord,
  event: CollegeEventRecord
): PublicRegistrationTicketView {
  return {
    id: reg.id,
    eventId: reg.eventId,
    registrationNumber: reg.registrationNumber,
    qrToken: reg.qrToken,
    fullName: reg.fullName,
    email: reg.email,
    phone: reg.phone,
    participantCategory: reg.participantCategory,
    organizationOrInstitution: reg.organizationOrInstitution,
    studentOrStaffNumber: reg.studentOrStaffNumber,
    attendanceMode: reg.attendanceMode,
    ticketType: reg.ticketType,
    paymentStatus: reg.paymentStatus,
    amountDue: reg.amountDue,
    amountPaid: reg.amountPaid,
    specialRequirements: reg.specialRequirements,
    status: reg.status,
    checkedIn: reg.checkedIn,
    checkedInAt: reg.checkedInAt,
    checkedOut: reg.checkedOut,
    checkedOutAt: reg.checkedOutAt,
    certificateCode: reg.certificateCode,
    registeredAt: reg.registeredAt,
    event: {
      id: event.id,
      eventCode: event.eventCode,
      slug: event.slug,
      title: event.title,
      category: event.category,
      eventDate: event.eventDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      campus: event.campus,
      venue: event.venue,
      mode: event.mode,
      meetingUrl: event.meetingUrl,
      organisingDepartmentName: event.organisingDepartmentName,
      contactEmail: event.contactEmail,
      contactPhone: event.showContactPhonePublicly ? event.contactPhone : 'See event desk',
      isPaid: event.isPaid,
      feeAmount: event.feeAmount,
      feeCurrency: event.feeCurrency,
      allowSelfCancel: event.allowSelfCancel,
      feedbackEnabled: event.feedbackEnabled,
      certificateEnabled: event.certificateEnabled,
      status: event.status,
    },
  };
}

function promoteNextWaitlisted(
  db: PortalDatabase,
  event: CollegeEventRecord
): EventRegistrationRecord | null {
  const occupied = db.collegeEventRegistrations.filter(
    (r) => r.eventId === event.id && (r.status === 'CONFIRMED' || r.status === 'PENDING')
  ).length;
  if (occupied >= event.capacity) return null;

  const waitlisted = db.collegeEventRegistrations
    .filter((r) => r.eventId === event.id && r.status === 'WAITLISTED')
    .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  if (waitlisted.length === 0) return null;

  const promoted = waitlisted[0];
  promoted.status = event.requiresApproval ? 'PENDING' : 'CONFIRMED';
  promoted.reviewNote = 'Promoted automatically from event waitlist as a seat opened.';
  promoted.updatedAt = nowIso();
  recalculateEventCounters(db, event.id);

  queueNotification(db, {
    eventId: event.id,
    registrationId: promoted.id,
    channel: 'EMAIL',
    recipientName: promoted.fullName,
    recipientTarget: promoted.email,
    subject: `Waitlist Update: Seat Available for ${event.title}`,
    message:
      promoted.status === 'CONFIRMED'
        ? `Great news! A seat opened up and your registration (${promoted.registrationNumber}) is now CONFIRMED.`
        : `A seat opened up for ${event.title}. Your registration (${promoted.registrationNumber}) has moved from Waitlist to Pending Organizer Approval.`,
  });

  queueNotification(db, {
    eventId: event.id,
    registrationId: promoted.id,
    channel: 'SMS',
    recipientName: promoted.fullName,
    recipientTarget: promoted.phone,
    subject: 'Waitlist Promotion SMS',
    message: `HI-TECH Events: Your registration ${promoted.registrationNumber} for ${event.title} is now ${promoted.status}.`,
  });

  return promoted;
}

function computeFeedbackSummary(db: PortalDatabase, eventId: string) {
  const items = db.collegeEventFeedbacks.filter((f) => f.eventId === eventId);
  if (items.length === 0) {
    return { responseCount: 0, averageRating: 0, npsScore: 0 };
  }
  const avg = items.reduce((acc, item) => acc + item.overallRating, 0) / items.length;
  const promoters = items.filter((f) => f.recommendNps >= 9).length;
  const detractors = items.filter((f) => f.recommendNps <= 6).length;
  const npsScore = Math.round(((promoters - detractors) / items.length) * 100);
  return {
    responseCount: items.length,
    averageRating: Math.round(avg * 10) / 10,
    npsScore,
  };
}

function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const dateCompact = dateStr.replace(/-/g, '');
  const mins = parseTimeToMinutes(timeStr);
  if (mins < 0) return `${dateCompact}T090000`;
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${dateCompact}T${h}${m}00`;
}

export const eventsService = {
  // ==========================================================
  // PUBLIC WEBSITE ENDPOINTS
  // ==========================================================

  listPublicEvents(filters?: {
    search?: string;
    category?: string;
    mode?: string;
    dateFilter?: string;
    feeFilter?: string;
    featured?: string;
    campus?: string;
  }): PublicEventSummary[] {
    const db = getDb();
    const today = todayDateString();
    const search = (filters?.search ?? '').trim().toLowerCase();
    const category = (filters?.category ?? 'ALL').trim();
    const mode = (filters?.mode ?? 'ALL').trim().toUpperCase();
    const dateFilter = (filters?.dateFilter ?? 'ALL').trim().toUpperCase();
    const feeFilter = (filters?.feeFilter ?? 'ALL').trim().toUpperCase();
    const campus = (filters?.campus ?? 'ALL').trim();
    const featured = filters?.featured;

    return db.collegeEvents
      .filter(
        (event) =>
          event.isPublished &&
          ['PUBLISHED', 'ONGOING', 'COMPLETED'].includes(event.status) &&
          (event.visibility === 'PUBLIC' || !event.visibility)
      )
      .map(toPublicSummary)
      .filter((event) => {
        if (search) {
          const hay = `${event.title} ${event.shortDescription} ${event.venue} ${event.campus} ${event.organisingDepartmentName} ${event.category} ${event.tags.join(' ')}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        if (category && category !== 'ALL' && event.category.toLowerCase() !== category.toLowerCase()) {
          return false;
        }
        if (mode && mode !== 'ALL' && event.mode !== mode) {
          return false;
        }
        if (campus && campus !== 'ALL' && event.campus.toLowerCase() !== campus.toLowerCase()) {
          return false;
        }
        if (dateFilter === 'TODAY' && event.eventDate !== today) {
          return false;
        }
        if (dateFilter === 'UPCOMING' && (event.eventDate < today || event.status === 'COMPLETED')) {
          return false;
        }
        if (dateFilter === 'PAST' && event.eventDate >= today && event.status !== 'COMPLETED') {
          return false;
        }
        if (feeFilter === 'FREE' && event.isPaid) {
          return false;
        }
        if (feeFilter === 'PAID' && !event.isPaid) {
          return false;
        }
        if (featured === 'true' && !event.featured) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (!a.isPast) return a.eventDate.localeCompare(b.eventDate);
        return b.eventDate.localeCompare(a.eventDate);
      });
  },

  getPublicEventBySlugOrId(slugOrId: string): PublicEventDetail {
    const db = getDb();
    const event = db.collegeEvents.find(
      (e) =>
        (e.slug === slugOrId || e.id === slugOrId) &&
        e.isPublished &&
        ['PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(e.status)
    );
    if (!event) {
      throw new EventsHttpError(404, 'Event not found or not currently published.');
    }
    const schedules = db.collegeEventSchedules
      .filter((s) => s.eventId === event.id)
      .sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder);
    const speakers = db.collegeEventSpeakers
      .filter((s) => s.eventId === event.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const publicMedia = db.collegeEventMedia
      .filter((m) => m.eventId === event.id && m.visibility === 'PUBLIC' && m.consentVerified)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      ...toPublicSummary(event),
      schedules,
      speakers,
      publicMedia,
      feedbackSummary: computeFeedbackSummary(db, event.id),
    };
  },

  getPublicEventAvailability(idOrSlug: string) {
    const db = getDb();
    const event = db.collegeEvents.find(
      (e) => (e.id === idOrSlug || e.slug === idOrSlug) && e.isPublished
    );
    if (!event) {
      throw new EventsHttpError(404, 'Event not found.');
    }
    const meta = computeRegistrationOpen(event);
    return {
      eventId: event.id,
      eventCode: event.eventCode,
      slug: event.slug,
      title: event.title,
      capacity: event.capacity,
      waitlistCapacity: event.waitlistCapacity,
      registeredCount: event.registeredCount,
      waitlistCount: event.waitlistCount,
      availableSeats: meta.availableSeats,
      allowWaitlist: event.allowWaitlist,
      isRegistrationOpen: meta.isRegistrationOpen,
      registrationClosedReason: meta.registrationClosedReason,
      isPaid: event.isPaid,
      feeAmount: event.feeAmount,
      studentFeeAmount: event.studentFeeAmount,
      feeCurrency: event.feeCurrency,
      requiresApproval: event.requiresApproval,
      audienceRestriction: event.audienceRestriction,
    };
  },

  registerForPublicEvent(
    eventIdOrSlug: string,
    payload: {
      fullName?: string;
      email?: string;
      phone?: string;
      participantCategory?: string;
      organizationOrInstitution?: string;
      studentOrStaffNumber?: string;
      attendanceMode?: string;
      ticketType?: string;
      paymentMethod?: string;
      paymentRef?: string;
      specialRequirements?: string;
      consentAccepted?: boolean;
      invitationCode?: string;
    }
  ): { registration: PublicRegistrationTicketView; lookupToken: string; message: string } {
    const db = getDb();
    const event = db.collegeEvents.find(
      (e) => e.id === eventIdOrSlug || e.slug === eventIdOrSlug
    );
    if (!event || !event.isPublished) {
      throw new EventsHttpError(404, 'Event not found or not open for public registration.');
    }

    const openState = computeRegistrationOpen(event);
    if (!openState.isRegistrationOpen) {
      throw new EventsHttpError(
        400,
        openState.registrationClosedReason || 'Registration is closed for this event.'
      );
    }

    const fullName = String(payload.fullName ?? '').trim();
    const email = String(payload.email ?? '').trim().toLowerCase();
    const phone = String(payload.phone ?? '').trim();
    const participantCategory = String(payload.participantCategory ?? '').trim();
    const organizationOrInstitution = String(payload.organizationOrInstitution ?? '').trim();
    const studentOrStaffNumber = String(payload.studentOrStaffNumber ?? '').trim().toUpperCase();
    const requestedMode = String(payload.attendanceMode ?? 'PHYSICAL').trim().toUpperCase();
    const specialRequirements = String(payload.specialRequirements ?? '').trim();
    const consentAccepted = Boolean(payload.consentAccepted);
    const invitationCode = String(payload.invitationCode ?? '').trim().toUpperCase();

    if (fullName.length < 3) {
      throw new EventsHttpError(400, 'Please enter your full name (at least 3 characters).');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new EventsHttpError(400, 'Please provide a valid email address.');
    }
    if (phone.replace(/\D/g, '').length < 9) {
      throw new EventsHttpError(400, 'Please provide a valid phone number (at least 9 digits).');
    }
    if (!participantCategory) {
      throw new EventsHttpError(400, 'Please select a participant category.');
    }
    if (!consentAccepted) {
      throw new EventsHttpError(
        400,
        'You must accept the event registration & data privacy consent notice to continue.'
      );
    }

    let matchedInvitation: EventInvitationRecord | undefined;

    if (event.audienceRestriction === 'STUDENTS_ONLY') {
      if (!/^HCA\/STU\/\d{4}\/\d+/.test(studentOrStaffNumber)) {
        throw new EventsHttpError(
          403,
          'This event is restricted to enrolled HI-TECH College students. Please provide a valid HCA/STU registration number.'
        );
      }
    } else if (event.audienceRestriction === 'STAFF_ONLY') {
      if (!/^HCA\/(STAFF|ADMIN)\/\d{4}\/\d+/.test(studentOrStaffNumber)) {
        throw new EventsHttpError(
          403,
          'This event is restricted to HI-TECH College staff members. Please provide a valid staff number (e.g. HCA/STAFF/2026/001).'
        );
      }
    } else if (event.audienceRestriction === 'INVITED_ONLY') {
      if (!invitationCode.startsWith('HTE-INV-')) {
        throw new EventsHttpError(
          403,
          'This event requires a valid institutional invitation code (HTE-INV-...).'
        );
      }
      const eventInvs = db.collegeEventInvitations.filter((i) => i.eventId === event.id);
      if (eventInvs.length > 0) {
        matchedInvitation = eventInvs.find(
          (i) => i.invitationCode.toUpperCase() === invitationCode
        );
        if (!matchedInvitation) {
          throw new EventsHttpError(403, 'Invitation code not found for this event.');
        }
        if (
          matchedInvitation.status === 'CANCELLED' ||
          matchedInvitation.status === 'EXPIRED' ||
          matchedInvitation.status === 'DECLINED'
        ) {
          throw new EventsHttpError(
            403,
            `Invitation code ${matchedInvitation.invitationCode} is ${matchedInvitation.status.toLowerCase()}.`
          );
        }
        if (matchedInvitation.convertedRegistrationId) {
          throw new EventsHttpError(409, 'This invitation code has already been redeemed.');
        }
      }
    }

    let attendanceMode: 'PHYSICAL' | 'ONLINE' = requestedMode === 'ONLINE' ? 'ONLINE' : 'PHYSICAL';
    if (event.mode === 'PHYSICAL') attendanceMode = 'PHYSICAL';
    if (event.mode === 'ONLINE') attendanceMode = 'ONLINE';

    const duplicate = db.collegeEventRegistrations.find(
      (r) =>
        r.eventId === event.id &&
        r.email.toLowerCase() === email &&
        r.status !== 'CANCELLED' &&
        r.status !== 'REJECTED'
    );
    if (duplicate) {
      throw new EventsHttpError(
        409,
        `This email address is already registered for this event (${duplicate.registrationNumber}).`
      );
    }

    const occupiedCount = db.collegeEventRegistrations.filter(
      (r) => r.eventId === event.id && (r.status === 'CONFIRMED' || r.status === 'PENDING')
    ).length;

    let status: EventRegistrationStatus;
    if (occupiedCount >= event.capacity) {
      if (!event.allowWaitlist) {
        throw new EventsHttpError(
          409,
          'Event capacity is full and waitlist registration is not enabled for this event.'
        );
      }
      if (
        event.waitlistCapacity > 0 &&
        db.collegeEventRegistrations.filter((r) => r.eventId === event.id && r.status === 'WAITLISTED')
          .length >= event.waitlistCapacity
      ) {
        throw new EventsHttpError(409, 'Both event capacity and waitlist capacity are currently full.');
      }
      status = 'WAITLISTED';
    } else {
      status = event.requiresApproval ? 'PENDING' : 'CONFIRMED';
    }

    const isStudent = participantCategory === 'Student';
    const ticketType =
      String(payload.ticketType ?? '').trim() ||
      (isStudent ? 'Student Ticket' : 'General Admission');
    const amountDue = event.isPaid
      ? isStudent && event.studentFeeAmount >= 0
        ? event.studentFeeAmount
        : event.feeAmount
      : 0;
    const paymentRef = String(payload.paymentRef ?? '').trim().toUpperCase();
    const paymentStatus: EventPaymentStatus =
      amountDue === 0
        ? 'PAID'
        : paymentRef
        ? 'PENDING'
        : 'UNPAID';

    const registrationNumber = allocateEventRegistrationNumber(db);
    const lookupToken = `HTE-TKT-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
    const lookupTokenHash = hashEventToken(lookupToken);
    const qrToken = `HTE-QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const timestamp = nowIso();

    const registration: EventRegistrationRecord = {
      id: `ereg-${crypto.randomUUID().slice(0, 10)}`,
      eventId: event.id,
      registrationNumber,
      lookupTokenHash,
      qrToken,
      fullName,
      email,
      phone,
      participantCategory,
      organizationOrInstitution,
      studentOrStaffNumber,
      attendanceMode,
      ticketType,
      paymentStatus,
      amountDue,
      amountPaid: 0,
      specialRequirements,
      consentAccepted: true,
      status,
      checkedIn: false,
      checkedInAt: null,
      checkedInById: null,
      checkedInByName: null,
      checkedOut: false,
      checkedOutAt: null,
      reviewedByName: null,
      reviewNote: null,
      organiserNotes: '',
      certificateCode: null,
      registeredAt: timestamp,
      updatedAt: timestamp,
    };

    db.collegeEventRegistrations.push(registration);

    if (event.isPaid && amountDue > 0) {
      const payMethod = (String(payload.paymentMethod ?? 'MPESA').toUpperCase() as EventPaymentRecord['method']);
      db.collegeEventPayments.unshift({
        id: `epay-${crypto.randomUUID().slice(0, 8)}`,
        eventId: event.id,
        registrationId: registration.id,
        registrationNumber,
        participantName: fullName,
        participantEmail: email,
        ticketType,
        amount: amountDue,
        currency: event.feeCurrency || 'KES',
        method: ['MPESA', 'BANK_TRANSFER', 'CASH_BURSAR', 'WAIVER'].includes(payMethod)
          ? payMethod
          : 'MPESA',
        transactionRef: paymentRef || `AWAITING-${registrationNumber}`,
        status: paymentStatus,
        verifiedById: null,
        verifiedByName: null,
        verifiedAt: null,
        refundReason: null,
        refundedAt: null,
        createdAt: timestamp,
      });
    }

    if (matchedInvitation) {
      matchedInvitation.status = 'ACCEPTED';
      matchedInvitation.convertedRegistrationId = registration.id;
      matchedInvitation.updatedAt = timestamp;
    }

    recalculateEventCounters(db, event.id);

    const statusLabel =
      status === 'CONFIRMED'
        ? 'Confirmed'
        : status === 'WAITLISTED'
        ? 'Waitlisted'
        : 'Pending Organizer Approval';

    queueNotification(db, {
      eventId: event.id,
      registrationId: registration.id,
      channel: 'EMAIL',
      recipientName: fullName,
      recipientTarget: email,
      subject: `Event Registration ${statusLabel}: ${event.title}`,
      message: `Hello ${fullName}, your registration number is ${registrationNumber}. Status: ${statusLabel}. Date: ${event.eventDate} (${event.startTime}). Venue: ${event.venue}.`,
    });

    queueNotification(db, {
      eventId: event.id,
      registrationId: registration.id,
      channel: 'SMS',
      recipientName: fullName,
      recipientTarget: phone,
      subject: 'Event Registration SMS Receipt',
      message: `HI-TECH College: Reg ${registrationNumber} (${status.toUpperCase()}) for ${event.title} on ${event.eventDate}.`,
    });

    saveDb(db);

    const message =
      status === 'CONFIRMED'
        ? `Registration confirmed! Your event pass (${registrationNumber}) is ready.`
        : status === 'WAITLISTED'
        ? `The event is currently full. You have been added to the waitlist (${registrationNumber}).`
        : `Registration submitted (${registrationNumber}). Awaiting organizer approval.`;

    return {
      registration: toPublicTicketView(registration, event),
      lookupToken,
      message,
    };
  },

  getPublicRegistrationByToken(
    registrationIdOrNumber: string,
    lookupToken?: string
  ): PublicRegistrationTicketView {
    if (!lookupToken || !lookupToken.trim()) {
      throw new EventsHttpError(
        401,
        'A valid registration ticket token is required to access this confirmation.'
      );
    }
    const db = getDb();
    const reg = db.collegeEventRegistrations.find(
      (r) =>
        r.id === registrationIdOrNumber ||
        r.registrationNumber.toUpperCase() === registrationIdOrNumber.toUpperCase()
    );
    if (!reg) {
      throw new EventsHttpError(404, 'Event registration record not found.');
    }
    if (hashEventToken(lookupToken) !== reg.lookupTokenHash) {
      throw new EventsHttpError(403, 'Invalid or unauthorized registration ticket token.');
    }
    const event = db.collegeEvents.find((e) => e.id === reg.eventId);
    if (!event) {
      throw new EventsHttpError(404, 'Associated event no longer exists.');
    }
    return toPublicTicketView(reg, event);
  },

  cancelPublicRegistration(
    registrationIdOrNumber: string,
    lookupToken?: string,
    reason?: string
  ): { ticket: PublicRegistrationTicketView; promotedRegistrationNumber: string | null } {
    if (!lookupToken || !lookupToken.trim()) {
      throw new EventsHttpError(401, 'A valid registration ticket token is required to cancel.');
    }
    const db = getDb();
    const reg = db.collegeEventRegistrations.find(
      (r) =>
        r.id === registrationIdOrNumber ||
        r.registrationNumber.toUpperCase() === registrationIdOrNumber.toUpperCase()
    );
    if (!reg) {
      throw new EventsHttpError(404, 'Event registration record not found.');
    }
    if (hashEventToken(lookupToken) !== reg.lookupTokenHash) {
      throw new EventsHttpError(403, 'Invalid registration ticket token.');
    }
    const event = db.collegeEvents.find((e) => e.id === reg.eventId);
    if (!event) {
      throw new EventsHttpError(404, 'Associated event not found.');
    }
    if (!event.allowSelfCancel) {
      throw new EventsHttpError(
        400,
        'Self-cancellation is disabled for this event. Please contact the organizer.'
      );
    }
    if (reg.checkedIn) {
      throw new EventsHttpError(400, 'Cannot cancel after event check-in has been recorded.');
    }
    if (reg.status === 'CANCELLED' || reg.status === 'REJECTED') {
      throw new EventsHttpError(400, `Registration is already ${reg.status.toLowerCase()}.`);
    }

    reg.status = 'CANCELLED';
    reg.reviewNote = String(reason ?? '').trim() || 'Cancelled by participant via confirmation portal.';
    reg.updatedAt = nowIso();
    recalculateEventCounters(db, event.id);

    queueNotification(db, {
      eventId: event.id,
      registrationId: reg.id,
      channel: 'EMAIL',
      recipientName: reg.fullName,
      recipientTarget: reg.email,
      subject: `Registration Cancelled: ${event.title}`,
      message: `Your registration (${reg.registrationNumber}) for ${event.title} has been cancelled as requested.`,
    });

    const promoted = promoteNextWaitlisted(db, event);
    saveDb(db);

    return {
      ticket: toPublicTicketView(reg, event),
      promotedRegistrationNumber: promoted?.registrationNumber ?? null,
    };
  },

  verifyPublicTicketOrCertificate(tokenOrCode: string) {
    const query = String(tokenOrCode ?? '').trim().toUpperCase();
    if (!query) {
      throw new EventsHttpError(400, 'Provide a ticket QR token, registration number, or certificate code.');
    }
    const db = getDb();

    // Check certificate first
    const cert = db.collegeEventCertificates.find(
      (c) =>
        c.certificateNumber.toUpperCase() === query ||
        c.verificationCode.toUpperCase() === query
    );
    if (cert) {
      const event = db.collegeEvents.find((e) => e.id === cert.eventId);
      return {
        kind: 'CERTIFICATE' as const,
        valid: cert.status === 'ISSUED',
        status: cert.status,
        certificateNumber: cert.certificateNumber,
        verificationCode: cert.verificationCode,
        holderName: cert.participantName,
        certificateType: cert.certificateType,
        issuedAt: cert.issuedAt,
        issuedByName: cert.issuedByName,
        revokedReason: cert.revokedReason,
        eventTitle: event?.title ?? 'HI-TECH College Event',
        eventDate: event?.eventDate ?? '',
        eventVenue: event?.venue ?? '',
      };
    }

    // Check ticket QR / registration number
    const reg = db.collegeEventRegistrations.find(
      (r) =>
        r.qrToken.toUpperCase() === query ||
        r.registrationNumber.toUpperCase() === query
    );
    if (!reg) {
      throw new EventsHttpError(
        404,
        'No matching HI-TECH College event ticket or certificate was found for that code.'
      );
    }
    const event = db.collegeEvents.find((e) => e.id === reg.eventId);
    return {
      kind: 'TICKET' as const,
      valid: reg.status === 'CONFIRMED' && event?.status !== 'CANCELLED',
      status: reg.status,
      registrationNumber: reg.registrationNumber,
      qrToken: reg.qrToken,
      holderName: reg.fullName,
      participantCategory: reg.participantCategory,
      ticketType: reg.ticketType,
      attendanceMode: reg.attendanceMode,
      checkedIn: reg.checkedIn,
      checkedInAt: reg.checkedInAt,
      eventTitle: event?.title ?? 'HI-TECH College Event',
      eventDate: event?.eventDate ?? '',
      eventTime: event ? `${event.startTime} – ${event.endTime}` : '',
      eventVenue: event?.venue ?? '',
      eventStatus: event?.status ?? 'PUBLISHED',
    };
  },

  submitPublicFeedback(
    eventIdOrSlug: string,
    payload: {
      respondentName?: string;
      registrationNumber?: string;
      isAnonymous?: boolean;
      overallRating?: number;
      speakerRating?: number;
      organisationRating?: number;
      venueRating?: number;
      recommendNps?: number;
      comments?: string;
      futureTopicInterest?: string;
    }
  ): EventFeedbackRecord {
    const db = getDb();
    const event = db.collegeEvents.find(
      (e) => e.id === eventIdOrSlug || e.slug === eventIdOrSlug
    );
    if (!event) {
      throw new EventsHttpError(404, 'Event not found.');
    }
    if (!event.feedbackEnabled) {
      throw new EventsHttpError(400, 'Feedback collection is disabled for this event.');
    }

    const overall = Number(payload.overallRating ?? 5);
    const speaker = Number(payload.speakerRating ?? overall);
    const org = Number(payload.organisationRating ?? overall);
    const venue = Number(payload.venueRating ?? overall);
    const nps = Number(payload.recommendNps ?? 9);

    if (
      [overall, speaker, org, venue].some((r) => !Number.isFinite(r) || r < 1 || r > 5) ||
      !Number.isFinite(nps) ||
      nps < 0 ||
      nps > 10
    ) {
      throw new EventsHttpError(400, 'Ratings must be 1–5 and recommendation score must be 0–10.');
    }

    const regNo = String(payload.registrationNumber ?? '').trim().toUpperCase();
    const reg = regNo
      ? db.collegeEventRegistrations.find(
          (r) => r.eventId === event.id && r.registrationNumber.toUpperCase() === regNo
        )
      : undefined;

    const isAnonymous = Boolean(payload.isAnonymous);
    const respondentName = isAnonymous
      ? 'Anonymous Participant'
      : String(payload.respondentName ?? reg?.fullName ?? 'Event Attendee').trim() || 'Event Attendee';

    const rec: EventFeedbackRecord = {
      id: `efb-${crypto.randomUUID().slice(0, 8)}`,
      eventId: event.id,
      registrationId: reg?.id ?? null,
      respondentName,
      isAnonymous,
      overallRating: Math.round(overall),
      speakerRating: Math.round(speaker),
      organisationRating: Math.round(org),
      venueRating: Math.round(venue),
      recommendNps: Math.round(nps),
      comments: String(payload.comments ?? '').trim(),
      futureTopicInterest: String(payload.futureTopicInterest ?? '').trim(),
      createdAt: nowIso(),
    };

    db.collegeEventFeedbacks.unshift(rec);
    saveDb(db);
    return rec;
  },

  generateEventIcsCalendar(slugOrId: string): { fileName: string; ics: string } {
    const db = getDb();
    const event = db.collegeEvents.find(
      (e) =>
        (e.slug === slugOrId || e.id === slugOrId) &&
        e.isPublished
    );
    if (!event) {
      throw new EventsHttpError(404, 'Event not found.');
    }
    const dtStart = formatIcsDateTime(event.eventDate, event.startTime);
    const dtEnd = formatIcsDateTime(event.endDate || event.eventDate, event.endTime);
    const escapeIcs = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HI-TECH College//Integrated Events Platform//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${event.id}@hitech.ac.ke`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;TZID=Africa/Nairobi:${dtStart}`,
      `DTEND;TZID=Africa/Nairobi:${dtEnd}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.shortDescription)}`,
      `LOCATION:${escapeIcs(event.venue)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return {
      fileName: `${event.slug}.ics`,
      ics: lines.join('\r\n'),
    };
  },

  listStudentPortalEventsAndTickets(studentIdentifier: string) {
    const db = getDb();
    const needle = String(studentIdentifier ?? '').trim().toLowerCase();
    const upcomingEvents = this.listPublicEvents({ dateFilter: 'ALL' });
    const myRegistrations = needle
      ? db.collegeEventRegistrations
          .filter(
            (r) =>
              r.studentOrStaffNumber.toLowerCase() === needle ||
              r.email.toLowerCase() === needle
          )
          .map((r) => {
            const ev = db.collegeEvents.find((e) => e.id === r.eventId);
            const cert = r.certificateCode
              ? db.collegeEventCertificates.find((c) => c.certificateNumber === r.certificateCode)
              : undefined;
            return {
              id: r.id,
              registrationNumber: r.registrationNumber,
              qrToken: r.qrToken,
              status: r.status,
              ticketType: r.ticketType,
              attendanceMode: r.attendanceMode,
              checkedIn: r.checkedIn,
              checkedOut: r.checkedOut,
              certificateCode: r.certificateCode,
              certificateStatus: cert?.status ?? null,
              registeredAt: r.registeredAt,
              eventId: r.eventId,
              eventSlug: ev?.slug ?? '',
              eventTitle: ev?.title ?? 'HI-TECH Event',
              eventDate: ev?.eventDate ?? '',
              startTime: ev?.startTime ?? '',
              endTime: ev?.endTime ?? '',
              venue: ev?.venue ?? '',
              feedbackEnabled: ev?.feedbackEnabled ?? true,
            };
          })
      : [];

    return {
      upcomingEvents,
      myRegistrations,
    };
  },

  // ==========================================================
  // STAFF PORTAL & EVENT OPERATIONS ENDPOINTS
  // ==========================================================

  getStaffEventsDashboard(): EventsDashboardPayload {
    const db = getDb();
    const today = todayDateString();

    for (const ev of db.collegeEvents) {
      recalculateEventCounters(db, ev.id);
    }

    const activeEvents = db.collegeEvents.filter((e) => e.status !== 'ARCHIVED');
    const regs = db.collegeEventRegistrations;

    const totalRevenueKes = db.collegeEventPayments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    const outstandingFeesKes = db.collegeEventPayments
      .filter((p) => p.status === 'UNPAID' || p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    const kpis: EventsDashboardKpis = {
      totalEvents: activeEvents.length,
      draftEvents: activeEvents.filter((e) => e.status === 'DRAFT').length,
      pendingEventApprovals: activeEvents.filter((e) => e.status === 'PENDING_APPROVAL').length,
      publishedEvents: activeEvents.filter((e) => e.status === 'PUBLISHED').length,
      upcomingEvents: activeEvents.filter(
        (e) => e.eventDate >= today && ['PUBLISHED', 'APPROVED', 'ONGOING'].includes(e.status)
      ).length,
      ongoingEvents: activeEvents.filter((e) => e.status === 'ONGOING').length,
      completedEvents: activeEvents.filter((e) => e.status === 'COMPLETED').length,
      cancelledEvents: activeEvents.filter((e) => e.status === 'CANCELLED').length,
      activeRegistrations: regs.filter((r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED').length,
      confirmedAttendees: regs.filter((r) => r.status === 'CONFIRMED').length,
      pendingRegistrationApprovals: regs.filter((r) => r.status === 'PENDING').length,
      waitlistedParticipants: regs.filter((r) => r.status === 'WAITLISTED').length,
      checkedInAttendees: regs.filter((r) => r.checkedIn && r.status === 'CONFIRMED').length,
      checkedOutAttendees: regs.filter((r) => r.checkedOut && r.status === 'CONFIRMED').length,
      noShowParticipants: regs.filter((r) => {
        if (r.status !== 'CONFIRMED' || r.checkedIn) return false;
        const ev = db.collegeEvents.find((e) => e.id === r.eventId);
        return Boolean(ev && (ev.status === 'COMPLETED' || ev.eventDate < today));
      }).length,
      cancelledRegistrations: regs.filter((r) => r.status === 'CANCELLED').length,
      totalRevenueKes,
      outstandingFeesKes,
    };

    const events = db.collegeEvents
      .map(toPublicSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const recentRegistrations = regs
      .slice()
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .slice(0, 15)
      .map(({ lookupTokenHash: _redacted, ...rest }) => {
        const ev = db.collegeEvents.find((e) => e.id === rest.eventId);
        return {
          ...rest,
          eventTitle: ev?.title ?? 'College Event',
        };
      });

    const capacityAlerts = events
      .filter(
        (e) =>
          !e.isPast &&
          e.status !== 'CANCELLED' &&
          e.status !== 'ARCHIVED' &&
          e.capacity > 0 &&
          e.registeredCount / e.capacity >= 0.75
      )
      .map((e) => ({
        eventId: e.id,
        title: e.title,
        eventDate: e.eventDate,
        occupancyPct: Math.min(100, Math.round((e.registeredCount / e.capacity) * 100)),
        availableSeats: e.availableSeats,
        waitlistCount: e.waitlistCount,
      }));

    const deadlineAlerts = events
      .filter((e) => !e.isPast && ['PUBLISHED', 'ONGOING'].includes(e.status))
      .map((e) => {
        const ms = Date.parse(e.registrationDeadline) - Date.now();
        const hoursRemaining = Math.round(ms / 3600000);
        return {
          eventId: e.id,
          title: e.title,
          eventDate: e.eventDate,
          registrationDeadline: e.registrationDeadline,
          hoursRemaining,
        };
      })
      .filter((d) => d.hoursRemaining >= 0 && d.hoursRemaining <= 168)
      .sort((a, b) => a.hoursRemaining - b.hoursRemaining);

    const categoryMap = new Map<string, { eventCount: number; registrations: number }>();
    for (const ev of activeEvents) {
      const current = categoryMap.get(ev.category) ?? { eventCount: 0, registrations: 0 };
      current.eventCount += 1;
      current.registrations += ev.registeredCount;
      categoryMap.set(ev.category, current);
    }
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.registrations - a.registrations || b.eventCount - a.eventCount);

    return {
      kpis,
      events,
      recentRegistrations,
      capacityAlerts,
      deadlineAlerts,
      categoryBreakdown,
      recentNotifications: db.collegeEventNotifications.slice(0, 40),
      auditLogs: db.collegeEventAuditLogs.slice(0, 40),
    };
  },

  listStaffEvents(filters?: { status?: string; search?: string; category?: string }): PublicEventSummary[] {
    const db = getDb();
    const status = (filters?.status ?? 'ALL').trim().toUpperCase();
    const category = (filters?.category ?? 'ALL').trim();
    const search = (filters?.search ?? '').trim().toLowerCase();

    return db.collegeEvents
      .map(toPublicSummary)
      .filter((e) => {
        if (status && status !== 'ALL' && e.status !== status) return false;
        if (category && category !== 'ALL' && e.category.toLowerCase() !== category.toLowerCase()) return false;
        if (search) {
          const hay = `${e.title} ${e.eventCode} ${e.venue} ${e.campus} ${e.organisingDepartmentName} ${e.organizerName}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  },

  getStaffEventDetail(eventId: string) {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) {
      throw new EventsHttpError(404, 'Event not found.');
    }
    recalculateEventCounters(db, event.id);
    const schedules = db.collegeEventSchedules
      .filter((s) => s.eventId === event.id)
      .sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder);
    const speakers = db.collegeEventSpeakers
      .filter((s) => s.eventId === event.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const registrations = db.collegeEventRegistrations
      .filter((r) => r.eventId === event.id)
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .map(({ lookupTokenHash: _redacted, ...rest }) => rest);
    const payments = db.collegeEventPayments.filter((p) => p.eventId === event.id);
    const invitations = db.collegeEventInvitations.filter((i) => i.eventId === event.id);
    const feedback = db.collegeEventFeedbacks.filter((f) => f.eventId === event.id);
    const certificates = db.collegeEventCertificates.filter((c) => c.eventId === event.id);
    const media = db.collegeEventMedia.filter((m) => m.eventId === event.id);
    const notifications = db.collegeEventNotifications
      .filter((n) => n.eventId === event.id)
      .slice(0, 60);
    const auditLogs = db.collegeEventAuditLogs
      .filter((l) => l.eventId === event.id)
      .slice(0, 60);

    return {
      event: toPublicSummary(event),
      schedules,
      speakers,
      registrations,
      payments,
      invitations,
      feedback,
      feedbackSummary: computeFeedbackSummary(db, event.id),
      certificates,
      media,
      notifications,
      auditLogs,
    };
  },

  checkVenueConflict(params: {
    venueId?: string | null;
    venueName?: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    excludeEventId?: string;
  }): EventVenueConflict[] {
    const db = getDb();
    const targetVenueId = params.venueId ? String(params.venueId).trim() : '';
    const targetVenueName = String(params.venueName ?? '').trim().toLowerCase();
    if (!params.eventDate || (!targetVenueId && !targetVenueName)) return [];

    const conflicts: EventVenueConflict[] = [];
    for (const ev of db.collegeEvents) {
      if (params.excludeEventId && ev.id === params.excludeEventId) continue;
      if (ev.status === 'CANCELLED' || ev.status === 'ARCHIVED') continue;
      if (ev.mode === 'ONLINE') continue;
      if (ev.eventDate !== params.eventDate) continue;

      const sameVenueById = targetVenueId && ev.venueId === targetVenueId;
      const sameVenueByName =
        targetVenueName &&
        (ev.venue.toLowerCase().includes(targetVenueName) ||
          ev.room.toLowerCase() === targetVenueName);
      if (!sameVenueById && !sameVenueByName) continue;

      if (timeRangesOverlap(params.startTime, params.endTime, ev.startTime, ev.endTime)) {
        conflicts.push({
          conflictingEventId: ev.id,
          conflictingEventTitle: ev.title,
          eventDate: ev.eventDate,
          timeWindow: `${ev.startTime} – ${ev.endTime}`,
          venue: ev.venue,
          reason: `Venue overlaps with "${ev.title}" (${ev.startTime} – ${ev.endTime}).`,
        });
      }
    }
    return conflicts;
  },

  createStaffEvent(
    actor: EventsActor,
    payload: Partial<CollegeEventRecord> & {
      schedules?: Array<Partial<EventScheduleItemRecord>>;
      speakers?: Array<Partial<EventSpeakerRecord>>;
      submitForApproval?: boolean;
      ignoreVenueConflict?: boolean;
    }
  ): CollegeEventRecord {
    const db = getDb();
    const title = String(payload.title ?? '').trim();
    if (title.length < 4) {
      throw new EventsHttpError(400, 'Event title must be at least 4 characters long.');
    }
    const eventDate = String(payload.eventDate ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      throw new EventsHttpError(400, 'Event date must be in YYYY-MM-DD format.');
    }
    const endDate = String(payload.endDate ?? eventDate).trim();
    const startTime = String(payload.startTime ?? '09:00 AM').trim();
    const endTime = String(payload.endTime ?? '04:00 PM').trim();
    const venue = String(payload.venue ?? '').trim();
    if (!venue) {
      throw new EventsHttpError(400, 'Event venue or online access channel is required.');
    }

    const capacity = Number(payload.capacity ?? 100);
    if (!Number.isFinite(capacity) || capacity < 1) {
      throw new EventsHttpError(400, 'Event capacity must be at least 1.');
    }

    const mode = String(payload.mode ?? 'PHYSICAL').toUpperCase() as EventMode;
    if (!['PHYSICAL', 'ONLINE', 'HYBRID'].includes(mode)) {
      throw new EventsHttpError(400, 'Event mode must be PHYSICAL, ONLINE, or HYBRID.');
    }

    const audienceRestriction = String(
      payload.audienceRestriction ?? 'PUBLIC'
    ).toUpperCase() as EventAudienceRestriction;
    if (!['PUBLIC', 'STUDENTS_ONLY', 'STAFF_ONLY', 'INVITED_ONLY'].includes(audienceRestriction)) {
      throw new EventsHttpError(400, 'Invalid audience restriction value.');
    }

    if (mode !== 'ONLINE' && payload.venueId && !payload.ignoreVenueConflict) {
      const conflicts = this.checkVenueConflict({
        venueId: payload.venueId,
        venueName: venue,
        eventDate,
        startTime,
        endTime,
      });
      if (conflicts.length > 0) {
        throw new EventsHttpError(409, conflicts[0].reason);
      }
    }

    const id = `evt-${crypto.randomUUID().slice(0, 8)}`;
    const eventCode = payload.eventCode?.trim() || allocateEventCode(db);
    const slug = ensureUniqueEventSlug(db, payload.slug || title);
    const timestamp = nowIso();
    const isPaid = Boolean(payload.isPaid);
    const feeAmount = isPaid ? Math.max(0, Number(payload.feeAmount ?? 0)) : 0;
    const studentFeeAmount = isPaid
      ? Math.max(0, Number(payload.studentFeeAmount ?? Math.round(feeAmount * 0.5)))
      : 0;

    const initialStatus: CollegeEventStatus = payload.submitForApproval
      ? 'PENDING_APPROVAL'
      : 'DRAFT';

    const newEvent: CollegeEventRecord = {
      id,
      eventCode,
      slug,
      title,
      category: String(payload.category ?? 'Seminar').trim(),
      shortDescription: String(payload.shortDescription ?? '').trim() || title,
      fullDescription:
        String(payload.fullDescription ?? '').trim() ||
        String(payload.shortDescription ?? '').trim() ||
        title,
      eventDate,
      endDate,
      startTime,
      endTime,
      timezone: String(payload.timezone ?? db.eventSettings?.defaultTimezone ?? 'Africa/Nairobi').trim(),
      isMultiDay: Boolean(payload.isMultiDay || endDate !== eventDate),
      recurrencePattern: (payload.recurrencePattern ?? 'NONE') as CollegeEventRecord['recurrencePattern'],
      campus: String(payload.campus ?? 'Nairobi Main Campus').trim(),
      venueId: payload.venueId ?? null,
      venue,
      building: String(payload.building ?? '').trim(),
      room: String(payload.room ?? '').trim(),
      mapsLink: String(payload.mapsLink ?? '').trim(),
      onlinePlatform: String(payload.onlinePlatform ?? '').trim(),
      accessibilityInfo: String(payload.accessibilityInfo ?? '').trim(),
      parkingInfo: String(payload.parkingInfo ?? '').trim(),
      mode,
      meetingUrl: String(payload.meetingUrl ?? '').trim(),
      organisingDepartmentId: payload.organisingDepartmentId ?? null,
      organisingDepartmentName: String(
        payload.organisingDepartmentName ?? 'Corporate Communications & Marketing'
      ).trim(),
      organizerName: String(payload.organizerName ?? actor.fullName).trim(),
      contactEmail: String(payload.contactEmail ?? 'events@hitech.ac.ke').trim(),
      contactPhone: String(payload.contactPhone ?? '+254 700 100 201').trim(),
      showContactPhonePublicly:
        payload.showContactPhonePublicly !== undefined
          ? Boolean(payload.showContactPhonePublicly)
          : true,
      targetAudience: String(payload.targetAudience ?? 'Students, Staff & General Public').trim(),
      requirements: String(payload.requirements ?? '').trim(),
      language: String(payload.language ?? 'English').trim(),
      tags: Array.isArray(payload.tags) ? payload.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      visibility: ((payload.visibility ?? 'PUBLIC') as EventVisibility),
      audienceRestriction,
      capacity,
      waitlistCapacity: Math.max(0, Number(payload.waitlistCapacity ?? 25)),
      registeredCount: 0,
      waitlistCount: 0,
      checkedInCount: 0,
      checkedOutCount: 0,
      registrationOpenDate: String(payload.registrationOpenDate ?? timestamp).trim(),
      registrationDeadline: String(payload.registrationDeadline ?? `${eventDate}T08:00:00.000Z`).trim(),
      isPaid,
      feeAmount,
      studentFeeAmount,
      feeCurrency: String(payload.feeCurrency ?? db.eventSettings?.defaultCurrency ?? 'KES').trim(),
      requiresApproval: Boolean(payload.requiresApproval),
      allowWaitlist: payload.allowWaitlist !== undefined ? Boolean(payload.allowWaitlist) : true,
      allowSelfCancel: payload.allowSelfCancel !== undefined ? Boolean(payload.allowSelfCancel) : true,
      reminderHours: Array.isArray(payload.reminderHours)
        ? payload.reminderHours.map(Number)
        : db.eventSettings?.defaultReminderHours ?? [24, 2],
      confirmationMessage: String(payload.confirmationMessage ?? '').trim(),
      certificateEnabled: Boolean(payload.certificateEnabled),
      certificateType: String(payload.certificateType ?? 'Certificate of Participation').trim(),
      certificateMinAttendance:
        payload.certificateMinAttendance !== undefined
          ? Boolean(payload.certificateMinAttendance)
          : true,
      feedbackEnabled:
        payload.feedbackEnabled !== undefined ? Boolean(payload.feedbackEnabled) : true,
      bannerImageUrl: String(payload.bannerImageUrl ?? '').trim(),
      featured: Boolean(payload.featured),
      status: initialStatus,
      isPublished: false,
      createdById: actor.id,
      createdByName: actor.fullName,
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      publishedById: null,
      publishedByName: null,
      publishedAt: null,
      cancelledReason: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    db.collegeEvents.unshift(newEvent);

    if (Array.isArray(payload.schedules)) {
      payload.schedules.forEach((s, index) => {
        if (s.title && s.timeRange) {
          db.collegeEventSchedules.push({
            id: `esch-${crypto.randomUUID().slice(0, 8)}`,
            eventId: id,
            dayNumber: Math.max(1, Number(s.dayNumber ?? 1)),
            timeRange: String(s.timeRange).trim(),
            title: String(s.title).trim(),
            speakerName: String(s.speakerName ?? '').trim(),
            location: String(s.location ?? venue).trim(),
            description: String(s.description ?? '').trim(),
            sortOrder: index + 1,
          });
        }
      });
    }

    if (Array.isArray(payload.speakers)) {
      payload.speakers.forEach((sp, index) => {
        if (sp.name && sp.roleTitle) {
          db.collegeEventSpeakers.push({
            id: `espk-${crypto.randomUUID().slice(0, 8)}`,
            eventId: id,
            name: String(sp.name).trim(),
            roleTitle: String(sp.roleTitle).trim(),
            speakerRole: (sp.speakerRole ?? 'Guest Speaker') as EventSpeakerRecord['speakerRole'],
            organization: String(sp.organization ?? 'HI-TECH College').trim(),
            bio: String(sp.bio ?? '').trim(),
            photoUrl: String(sp.photoUrl ?? '').trim(),
            confirmationStatus: (sp.confirmationStatus ?? 'CONFIRMED') as EventSpeakerRecord['confirmationStatus'],
            sortOrder: index + 1,
          });
        }
      });
    }

    appendAudit(
      db,
      actor,
      id,
      initialStatus === 'PENDING_APPROVAL' ? 'EVENT_CREATED_AND_SUBMITTED' : 'EVENT_CREATED',
      `Created event ${eventCode} "${title}" scheduled for ${eventDate} (${initialStatus}).`
    );
    saveDb(db);
    return newEvent;
  },

  updateStaffEvent(
    actor: EventsActor,
    eventId: string,
    payload: Partial<CollegeEventRecord> & {
      schedules?: Array<Partial<EventScheduleItemRecord>>;
      speakers?: Array<Partial<EventSpeakerRecord>>;
    }
  ): CollegeEventRecord {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) {
      throw new EventsHttpError(404, 'Event not found.');
    }

    if (payload.title !== undefined) {
      const title = String(payload.title).trim();
      if (title.length < 4) throw new EventsHttpError(400, 'Event title must be at least 4 characters.');
      event.title = title;
      if (!payload.slug) {
        event.slug = ensureUniqueEventSlug(db, title, event.id);
      }
    }
    if (payload.slug !== undefined && String(payload.slug).trim()) {
      event.slug = ensureUniqueEventSlug(db, String(payload.slug), event.id);
    }
    if (payload.category !== undefined) event.category = String(payload.category).trim();
    if (payload.shortDescription !== undefined) event.shortDescription = String(payload.shortDescription).trim();
    if (payload.fullDescription !== undefined) event.fullDescription = String(payload.fullDescription).trim();
    if (payload.eventDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload.eventDate))) {
        throw new EventsHttpError(400, 'Invalid event date format.');
      }
      event.eventDate = String(payload.eventDate);
    }
    if (payload.endDate !== undefined) event.endDate = String(payload.endDate).trim() || event.eventDate;
    if (payload.startTime !== undefined) event.startTime = String(payload.startTime).trim();
    if (payload.endTime !== undefined) event.endTime = String(payload.endTime).trim();
    if (payload.timezone !== undefined) event.timezone = String(payload.timezone).trim();
    if (payload.isMultiDay !== undefined) event.isMultiDay = Boolean(payload.isMultiDay);
    if (payload.recurrencePattern !== undefined) event.recurrencePattern = payload.recurrencePattern;
    if (payload.campus !== undefined) event.campus = String(payload.campus).trim();
    if (payload.venueId !== undefined) event.venueId = payload.venueId;
    if (payload.venue !== undefined) event.venue = String(payload.venue).trim();
    if (payload.building !== undefined) event.building = String(payload.building).trim();
    if (payload.room !== undefined) event.room = String(payload.room).trim();
    if (payload.mapsLink !== undefined) event.mapsLink = String(payload.mapsLink).trim();
    if (payload.onlinePlatform !== undefined) event.onlinePlatform = String(payload.onlinePlatform).trim();
    if (payload.accessibilityInfo !== undefined) event.accessibilityInfo = String(payload.accessibilityInfo).trim();
    if (payload.parkingInfo !== undefined) event.parkingInfo = String(payload.parkingInfo).trim();
    if (payload.mode !== undefined) event.mode = payload.mode;
    if (payload.meetingUrl !== undefined) event.meetingUrl = String(payload.meetingUrl).trim();
    if (payload.organisingDepartmentName !== undefined) {
      event.organisingDepartmentName = String(payload.organisingDepartmentName).trim();
    }
    if (payload.organizerName !== undefined) event.organizerName = String(payload.organizerName).trim();
    if (payload.contactEmail !== undefined) event.contactEmail = String(payload.contactEmail).trim();
    if (payload.contactPhone !== undefined) event.contactPhone = String(payload.contactPhone).trim();
    if (payload.showContactPhonePublicly !== undefined) {
      event.showContactPhonePublicly = Boolean(payload.showContactPhonePublicly);
    }
    if (payload.targetAudience !== undefined) event.targetAudience = String(payload.targetAudience).trim();
    if (payload.requirements !== undefined) event.requirements = String(payload.requirements).trim();
    if (payload.language !== undefined) event.language = String(payload.language).trim();
    if (Array.isArray(payload.tags)) event.tags = payload.tags.map((t) => String(t).trim()).filter(Boolean);
    if (payload.visibility !== undefined) event.visibility = payload.visibility;
    if (payload.audienceRestriction !== undefined) event.audienceRestriction = payload.audienceRestriction;
    if (payload.capacity !== undefined) {
      const cap = Number(payload.capacity);
      if (!Number.isFinite(cap) || cap < 1) throw new EventsHttpError(400, 'Capacity must be at least 1.');
      event.capacity = cap;
    }
    if (payload.waitlistCapacity !== undefined) {
      event.waitlistCapacity = Math.max(0, Number(payload.waitlistCapacity));
    }
    if (payload.registrationOpenDate !== undefined) {
      event.registrationOpenDate = String(payload.registrationOpenDate).trim();
    }
    if (payload.registrationDeadline !== undefined) {
      event.registrationDeadline = String(payload.registrationDeadline).trim();
    }
    if (payload.isPaid !== undefined) event.isPaid = Boolean(payload.isPaid);
    if (payload.feeAmount !== undefined) {
      event.feeAmount = event.isPaid ? Math.max(0, Number(payload.feeAmount)) : 0;
    }
    if (payload.studentFeeAmount !== undefined) {
      event.studentFeeAmount = event.isPaid ? Math.max(0, Number(payload.studentFeeAmount)) : 0;
    }
    if (payload.requiresApproval !== undefined) event.requiresApproval = Boolean(payload.requiresApproval);
    if (payload.allowWaitlist !== undefined) event.allowWaitlist = Boolean(payload.allowWaitlist);
    if (payload.allowSelfCancel !== undefined) event.allowSelfCancel = Boolean(payload.allowSelfCancel);
    if (Array.isArray(payload.reminderHours)) event.reminderHours = payload.reminderHours.map(Number);
    if (payload.confirmationMessage !== undefined) event.confirmationMessage = String(payload.confirmationMessage).trim();
    if (payload.certificateEnabled !== undefined) event.certificateEnabled = Boolean(payload.certificateEnabled);
    if (payload.certificateType !== undefined) event.certificateType = String(payload.certificateType).trim();
    if (payload.certificateMinAttendance !== undefined) {
      event.certificateMinAttendance = Boolean(payload.certificateMinAttendance);
    }
    if (payload.feedbackEnabled !== undefined) event.feedbackEnabled = Boolean(payload.feedbackEnabled);
    if (payload.bannerImageUrl !== undefined) event.bannerImageUrl = String(payload.bannerImageUrl).trim();
    if (payload.featured !== undefined) event.featured = Boolean(payload.featured);

    if (Array.isArray(payload.schedules)) {
      db.collegeEventSchedules = db.collegeEventSchedules.filter((s) => s.eventId !== event.id);
      payload.schedules.forEach((s, index) => {
        if (String(s.title ?? '').trim() && String(s.timeRange ?? '').trim()) {
          db.collegeEventSchedules.push({
            id: `esch-${crypto.randomUUID().slice(0, 8)}`,
            eventId: event.id,
            dayNumber: Math.max(1, Number(s.dayNumber ?? 1)),
            timeRange: String(s.timeRange).trim(),
            title: String(s.title).trim(),
            speakerName: String(s.speakerName ?? '').trim(),
            location: String(s.location ?? event.venue).trim(),
            description: String(s.description ?? '').trim(),
            sortOrder: index + 1,
          });
        }
      });
    }

    if (Array.isArray(payload.speakers)) {
      db.collegeEventSpeakers = db.collegeEventSpeakers.filter((s) => s.eventId !== event.id);
      payload.speakers.forEach((sp, index) => {
        if (String(sp.name ?? '').trim() && String(sp.roleTitle ?? '').trim()) {
          db.collegeEventSpeakers.push({
            id: `espk-${crypto.randomUUID().slice(0, 8)}`,
            eventId: event.id,
            name: String(sp.name).trim(),
            roleTitle: String(sp.roleTitle).trim(),
            speakerRole: (sp.speakerRole ?? 'Guest Speaker') as EventSpeakerRecord['speakerRole'],
            organization: String(sp.organization ?? 'HI-TECH College').trim(),
            bio: String(sp.bio ?? '').trim(),
            photoUrl: String(sp.photoUrl ?? '').trim(),
            confirmationStatus: (sp.confirmationStatus ?? 'CONFIRMED') as EventSpeakerRecord['confirmationStatus'],
            sortOrder: index + 1,
          });
        }
      });
    }

    event.updatedAt = nowIso();
    appendAudit(db, actor, event.id, 'EVENT_UPDATED', `Updated event configuration for "${event.title}".`);
    saveDb(db);
    return event;
  },

  duplicateStaffEvent(actor: EventsActor, sourceEventId: string): CollegeEventRecord {
    const db = getDb();
    const source = db.collegeEvents.find((e) => e.id === sourceEventId);
    if (!source) throw new EventsHttpError(404, 'Source event not found.');

    const newId = `evt-${crypto.randomUUID().slice(0, 8)}`;
    const newCode = allocateEventCode(db);
    const newTitle = `${source.title} (Copy)`;
    const newSlug = ensureUniqueEventSlug(db, `${source.slug}-copy`);
    const ts = nowIso();

    const cloned: CollegeEventRecord = {
      ...source,
      id: newId,
      eventCode: newCode,
      slug: newSlug,
      title: newTitle,
      registeredCount: 0,
      waitlistCount: 0,
      checkedInCount: 0,
      checkedOutCount: 0,
      status: 'DRAFT',
      isPublished: false,
      createdById: actor.id,
      createdByName: actor.fullName,
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      publishedById: null,
      publishedByName: null,
      publishedAt: null,
      cancelledReason: null,
      createdAt: ts,
      updatedAt: ts,
    };

    db.collegeEvents.unshift(cloned);

    const srcSchedules = db.collegeEventSchedules.filter((s) => s.eventId === source.id);
    for (const sc of srcSchedules) {
      db.collegeEventSchedules.push({
        ...sc,
        id: `esch-${crypto.randomUUID().slice(0, 8)}`,
        eventId: newId,
      });
    }
    const srcSpeakers = db.collegeEventSpeakers.filter((s) => s.eventId === source.id);
    for (const sp of srcSpeakers) {
      db.collegeEventSpeakers.push({
        ...sp,
        id: `espk-${crypto.randomUUID().slice(0, 8)}`,
        eventId: newId,
      });
    }

    appendAudit(
      db,
      actor,
      newId,
      'EVENT_DUPLICATED',
      `Duplicated ${source.eventCode} into draft ${newCode} ("${newTitle}").`
    );
    saveDb(db);
    return cloned;
  },

  archiveOrDeleteEvent(actor: EventsActor, eventId: string, hardDelete = false): { archived: boolean; deleted: boolean } {
    const db = getDb();
    const index = db.collegeEvents.findIndex((e) => e.id === eventId);
    if (index === -1) throw new EventsHttpError(404, 'Event not found.');
    const event = db.collegeEvents[index];

    if (hardDelete && event.status === 'DRAFT' && event.registeredCount === 0) {
      db.collegeEvents.splice(index, 1);
      db.collegeEventSchedules = db.collegeEventSchedules.filter((s) => s.eventId !== eventId);
      db.collegeEventSpeakers = db.collegeEventSpeakers.filter((s) => s.eventId !== eventId);
      appendAudit(db, actor, eventId, 'EVENT_DELETED', `Deleted empty draft event "${event.title}".`);
      saveDb(db);
      return { archived: false, deleted: true };
    }

    event.status = 'ARCHIVED';
    event.isPublished = false;
    event.updatedAt = nowIso();
    appendAudit(db, actor, eventId, 'EVENT_ARCHIVED', `Archived event "${event.title}".`);
    saveDb(db);
    return { archived: true, deleted: false };
  },

  replaceEventSchedules(
    actor: EventsActor,
    eventId: string,
    items: Array<Partial<EventScheduleItemRecord>>
  ): EventScheduleItemRecord[] {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    db.collegeEventSchedules = db.collegeEventSchedules.filter((s) => s.eventId !== eventId);
    const created: EventScheduleItemRecord[] = [];
    items.forEach((s, index) => {
      if (String(s.title ?? '').trim() && String(s.timeRange ?? '').trim()) {
        const item: EventScheduleItemRecord = {
          id: `esch-${crypto.randomUUID().slice(0, 8)}`,
          eventId,
          dayNumber: Math.max(1, Number(s.dayNumber ?? 1)),
          timeRange: String(s.timeRange).trim(),
          title: String(s.title).trim(),
          speakerName: String(s.speakerName ?? '').trim(),
          location: String(s.location ?? event.venue).trim(),
          description: String(s.description ?? '').trim(),
          sortOrder: index + 1,
        };
        created.push(item);
        db.collegeEventSchedules.push(item);
      }
    });
    appendAudit(db, actor, eventId, 'EVENT_SCHEDULE_UPDATED', `Updated ${created.length} programme schedule items.`);
    saveDb(db);
    return created;
  },

  replaceEventSpeakers(
    actor: EventsActor,
    eventId: string,
    items: Array<Partial<EventSpeakerRecord>>
  ): EventSpeakerRecord[] {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    db.collegeEventSpeakers = db.collegeEventSpeakers.filter((s) => s.eventId !== eventId);
    const created: EventSpeakerRecord[] = [];
    items.forEach((sp, index) => {
      if (String(sp.name ?? '').trim() && String(sp.roleTitle ?? '').trim()) {
        const speaker: EventSpeakerRecord = {
          id: `espk-${crypto.randomUUID().slice(0, 8)}`,
          eventId,
          name: String(sp.name).trim(),
          roleTitle: String(sp.roleTitle).trim(),
          speakerRole: (sp.speakerRole ?? 'Guest Speaker') as EventSpeakerRecord['speakerRole'],
          organization: String(sp.organization ?? 'HI-TECH College').trim(),
          bio: String(sp.bio ?? '').trim(),
          photoUrl: String(sp.photoUrl ?? '').trim(),
          confirmationStatus: (sp.confirmationStatus ?? 'CONFIRMED') as EventSpeakerRecord['confirmationStatus'],
          sortOrder: index + 1,
        };
        created.push(speaker);
        db.collegeEventSpeakers.push(speaker);
      }
    });
    appendAudit(db, actor, eventId, 'EVENT_SPEAKERS_UPDATED', `Updated ${created.length} event speaker profiles.`);
    saveDb(db);
    return created;
  },

  submitEvent(actor: EventsActor, eventId: string): CollegeEventRecord {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');
    if (!['DRAFT', 'CANCELLED'].includes(event.status)) {
      throw new EventsHttpError(400, `Cannot submit event in ${event.status} state.`);
    }
    event.status = 'PENDING_APPROVAL';
    event.isPublished = false;
    event.updatedAt = nowIso();
    appendAudit(db, actor, eventId, 'EVENT_SUBMITTED', `Submitted "${event.title}" for institutional approval.`);
    saveDb(db);
    return event;
  },

  approveEvent(actor: EventsActor, eventId: string): CollegeEventRecord {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    if (event.createdById === actor.id) {
      throw new EventsHttpError(
        403,
        'Separation of duties enforced: the staff member who created this event cannot approve it.'
      );
    }

    if (!['DRAFT', 'PENDING_APPROVAL'].includes(event.status)) {
      throw new EventsHttpError(400, `Event is already ${event.status}.`);
    }

    event.status = 'APPROVED';
    event.approvedById = actor.id;
    event.approvedByName = actor.fullName;
    event.approvedAt = nowIso();
    event.updatedAt = nowIso();
    appendAudit(db, actor, eventId, 'EVENT_APPROVED', `Approved "${event.title}" for publication.`);
    saveDb(db);
    return event;
  },

  publishEvent(actor: EventsActor, eventId: string): CollegeEventRecord {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');
    if (!['APPROVED', 'PUBLISHED', 'ONGOING'].includes(event.status)) {
      throw new EventsHttpError(
        400,
        'Event must be approved by an authorized reviewer before it can be published.'
      );
    }

    const today = todayDateString();
    event.status = event.eventDate === today ? 'ONGOING' : 'PUBLISHED';
    event.isPublished = true;
    event.publishedById = actor.id;
    event.publishedByName = actor.fullName;
    event.publishedAt = nowIso();
    event.updatedAt = nowIso();
    appendAudit(db, actor, eventId, 'EVENT_PUBLISHED', `Published "${event.title}" to the public website.`);
    saveDb(db);
    return event;
  },

  cancelEvent(actor: EventsActor, eventId: string, reason?: string): CollegeEventRecord {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');
    if (event.status === 'CANCELLED') {
      throw new EventsHttpError(400, 'Event is already cancelled.');
    }

    const cleanReason = String(reason ?? '').trim() || 'Cancelled by college administration.';
    event.status = 'CANCELLED';
    event.cancelledReason = cleanReason;
    event.updatedAt = nowIso();

    const affected = db.collegeEventRegistrations.filter(
      (r) => r.eventId === event.id && !['CANCELLED', 'REJECTED'].includes(r.status)
    );
    for (const reg of affected) {
      queueNotification(db, {
        eventId: event.id,
        registrationId: reg.id,
        channel: 'EMAIL',
        recipientName: reg.fullName,
        recipientTarget: reg.email,
        subject: `Important Notice — Event Cancelled: ${event.title}`,
        message: `Dear ${reg.fullName}, please note that ${event.title} (${event.eventDate}) has been cancelled. Reason: ${cleanReason}`,
      });
    }

    appendAudit(
      db,
      actor,
      eventId,
      'EVENT_CANCELLED',
      `Cancelled "${event.title}" and notified ${affected.length} registrants. Reason: ${cleanReason}`
    );
    saveDb(db);
    return event;
  },

  listEventRegistrations(
    eventId: string,
    filters?: { status?: string; search?: string }
  ) {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    const status = (filters?.status ?? 'ALL').trim().toUpperCase();
    const search = (filters?.search ?? '').trim().toLowerCase();

    return db.collegeEventRegistrations
      .filter((r) => r.eventId === eventId)
      .filter((r) => {
        if (status && status !== 'ALL' && r.status !== status) return false;
        if (search) {
          const hay = `${r.fullName} ${r.email} ${r.phone} ${r.registrationNumber} ${r.organizationOrInstitution} ${r.ticketType}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .map(({ lookupTokenHash: _redacted, ...rest }) => rest);
  },

  addStaffRegistration(
    actor: EventsActor,
    eventId: string,
    payload: {
      fullName: string;
      email: string;
      phone: string;
      participantCategory?: string;
      organizationOrInstitution?: string;
      studentOrStaffNumber?: string;
      attendanceMode?: string;
      ticketType?: string;
      organiserNotes?: string;
      autoConfirm?: boolean;
    }
  ) {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    const fullName = String(payload.fullName ?? '').trim();
    const email = String(payload.email ?? '').trim().toLowerCase();
    const phone = String(payload.phone ?? '').trim() || '+254700000000';
    if (fullName.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new EventsHttpError(400, 'Participant full name and valid email address are required.');
    }

    const existing = db.collegeEventRegistrations.find(
      (r) =>
        r.eventId === event.id &&
        r.email.toLowerCase() === email &&
        r.status !== 'CANCELLED' &&
        r.status !== 'REJECTED'
    );
    if (existing) {
      throw new EventsHttpError(409, `${email} is already registered (${existing.registrationNumber}).`);
    }

    const registrationNumber = allocateEventRegistrationNumber(db);
    const lookupToken = `HTE-TKT-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
    const qrToken = `HTE-QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const ts = nowIso();

    const reg: EventRegistrationRecord = {
      id: `ereg-${crypto.randomUUID().slice(0, 10)}`,
      eventId: event.id,
      registrationNumber,
      lookupTokenHash: hashEventToken(lookupToken),
      qrToken,
      fullName,
      email,
      phone,
      participantCategory: String(payload.participantCategory ?? 'Guest / VIP').trim(),
      organizationOrInstitution: String(payload.organizationOrInstitution ?? 'HI-TECH College').trim(),
      studentOrStaffNumber: String(payload.studentOrStaffNumber ?? '').trim().toUpperCase(),
      attendanceMode: payload.attendanceMode === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
      ticketType: String(payload.ticketType ?? 'Complimentary').trim(),
      paymentStatus: 'PAID',
      amountDue: 0,
      amountPaid: 0,
      specialRequirements: '',
      consentAccepted: true,
      status: payload.autoConfirm === false ? 'PENDING' : 'CONFIRMED',
      checkedIn: false,
      checkedInAt: null,
      checkedInById: null,
      checkedInByName: null,
      checkedOut: false,
      checkedOutAt: null,
      reviewedByName: actor.fullName,
      reviewNote: 'Manually registered by authorized college staff.',
      organiserNotes: String(payload.organiserNotes ?? '').trim(),
      certificateCode: null,
      registeredAt: ts,
      updatedAt: ts,
    };

    db.collegeEventRegistrations.unshift(reg);
    recalculateEventCounters(db, event.id);

    queueNotification(db, {
      eventId: event.id,
      registrationId: reg.id,
      channel: 'EMAIL',
      recipientName: fullName,
      recipientTarget: email,
      subject: `Event Pass Issued: ${event.title}`,
      message: `Hello ${fullName}, staff added your ${reg.ticketType} pass (${registrationNumber}) for ${event.title}. QR Token: ${qrToken}.`,
    });

    appendAudit(
      db,
      actor,
      event.id,
      'REGISTRATION_MANUAL_ADDED',
      `Manually registered ${fullName} (${registrationNumber}) as ${reg.ticketType}.`
    );
    saveDb(db);
    const { lookupTokenHash: _redacted, ...safeReg } = reg;
    return { registration: safeReg, lookupToken };
  },

  bulkRegisterParticipants(
    actor: EventsActor,
    eventId: string,
    rows: Array<{
      fullName: string;
      email: string;
      phone?: string;
      participantCategory?: string;
      ticketType?: string;
      studentOrStaffNumber?: string;
    }>
  ) {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new EventsHttpError(400, 'Provide at least one participant row to import.');
    }

    const added: string[] = [];
    const skipped: Array<{ email: string; reason: string }> = [];

    for (const row of rows) {
      const fullName = String(row.fullName ?? '').trim();
      const email = String(row.email ?? '').trim().toLowerCase();
      if (fullName.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        skipped.push({ email: email || 'invalid', reason: 'Invalid name or email format' });
        continue;
      }
      const dup = db.collegeEventRegistrations.find(
        (r) =>
          r.eventId === event.id &&
          r.email.toLowerCase() === email &&
          r.status !== 'CANCELLED' &&
          r.status !== 'REJECTED'
      );
      if (dup) {
        skipped.push({ email, reason: `Already registered (${dup.registrationNumber})` });
        continue;
      }
      const regNo = allocateEventRegistrationNumber(db);
      const ts = nowIso();
      db.collegeEventRegistrations.push({
        id: `ereg-${crypto.randomUUID().slice(0, 10)}`,
        eventId: event.id,
        registrationNumber: regNo,
        lookupTokenHash: hashEventToken(`HTE-TKT-${crypto.randomBytes(10).toString('hex').toUpperCase()}`),
        qrToken: `HTE-QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        fullName,
        email,
        phone: String(row.phone ?? '+254700000000').trim(),
        participantCategory: String(row.participantCategory ?? 'Student').trim(),
        organizationOrInstitution: 'HI-TECH College',
        studentOrStaffNumber: String(row.studentOrStaffNumber ?? '').trim().toUpperCase(),
        attendanceMode: event.mode === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
        ticketType: String(row.ticketType ?? 'General Admission').trim(),
        paymentStatus: 'PAID',
        amountDue: 0,
        amountPaid: 0,
        specialRequirements: '',
        consentAccepted: true,
        status: 'CONFIRMED',
        checkedIn: false,
        checkedInAt: null,
        checkedInById: null,
        checkedInByName: null,
        checkedOut: false,
        checkedOutAt: null,
        reviewedByName: actor.fullName,
        reviewNote: 'Bulk imported by event staff.',
        organiserNotes: 'Bulk CSV import',
        certificateCode: null,
        registeredAt: ts,
        updatedAt: ts,
      });
      added.push(regNo);
    }

    recalculateEventCounters(db, event.id);
    appendAudit(
      db,
      actor,
      event.id,
      'REGISTRATIONS_BULK_IMPORTED',
      `Bulk imported ${added.length} participants (${skipped.length} skipped).`
    );
    saveDb(db);
    return { addedCount: added.length, addedRegistrationNumbers: added, skipped };
  },

  updateRegistrationNotes(
    actor: EventsActor,
    registrationId: string,
    payload: { organiserNotes?: string; ticketType?: string }
  ) {
    const db = getDb();
    const reg = db.collegeEventRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new EventsHttpError(404, 'Registration not found.');

    if (payload.organiserNotes !== undefined) {
      reg.organiserNotes = String(payload.organiserNotes).trim();
    }
    if (payload.ticketType !== undefined && String(payload.ticketType).trim()) {
      reg.ticketType = String(payload.ticketType).trim();
    }
    reg.updatedAt = nowIso();
    appendAudit(
      db,
      actor,
      reg.eventId,
      'REGISTRATION_NOTES_UPDATED',
      `Updated notes/ticket tier for ${reg.registrationNumber}.`
    );
    saveDb(db);
    const { lookupTokenHash: _redacted, ...safeReg } = reg;
    return safeReg;
  },

  updateRegistrationStatus(
    actor: EventsActor,
    registrationId: string,
    action: 'APPROVE' | 'REJECT' | 'CANCEL',
    note?: string
  ) {
    const db = getDb();
    const reg = db.collegeEventRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new EventsHttpError(404, 'Event registration not found.');
    const event = db.collegeEvents.find((e) => e.id === reg.eventId);
    if (!event) throw new EventsHttpError(404, 'Associated event not found.');

    const cleanNote = String(note ?? '').trim() || null;

    if (action === 'APPROVE') {
      if (reg.status === 'CONFIRMED') {
        throw new EventsHttpError(400, 'Registration is already confirmed.');
      }
      reg.status = 'CONFIRMED';
      reg.reviewedByName = actor.fullName;
      reg.reviewNote = cleanNote ?? 'Approved by event organizer.';
      reg.updatedAt = nowIso();
      recalculateEventCounters(db, event.id);

      queueNotification(db, {
        eventId: event.id,
        registrationId: reg.id,
        channel: 'EMAIL',
        recipientName: reg.fullName,
        recipientTarget: reg.email,
        subject: `Registration Approved: ${event.title}`,
        message: `Your registration (${reg.registrationNumber}) for ${event.title} has been APPROVED and CONFIRMED.`,
      });
    } else if (action === 'REJECT' || action === 'CANCEL') {
      if (reg.checkedIn) {
        throw new EventsHttpError(400, 'Cannot reject or cancel an already checked-in participant.');
      }
      reg.status = action === 'REJECT' ? 'REJECTED' : 'CANCELLED';
      reg.reviewedByName = actor.fullName;
      reg.reviewNote = cleanNote ?? `${action === 'REJECT' ? 'Declined' : 'Cancelled'} by staff.`;
      reg.updatedAt = nowIso();
      recalculateEventCounters(db, event.id);

      queueNotification(db, {
        eventId: event.id,
        registrationId: reg.id,
        channel: 'EMAIL',
        recipientName: reg.fullName,
        recipientTarget: reg.email,
        subject: `Registration Update: ${event.title}`,
        message: `Your registration (${reg.registrationNumber}) status is now ${reg.status}. ${reg.reviewNote}`,
      });

      promoteNextWaitlisted(db, event);
    } else {
      throw new EventsHttpError(400, 'Action must be APPROVE, REJECT, or CANCEL.');
    }

    appendAudit(
      db,
      actor,
      event.id,
      `REGISTRATION_${action}D`,
      `${action} registration ${reg.registrationNumber} (${reg.fullName}).`
    );
    saveDb(db);
    const { lookupTokenHash: _redacted, ...safeReg } = reg;
    return safeReg;
  },

  promoteWaitlistedRegistration(actor: EventsActor, registrationId: string) {
    const db = getDb();
    const reg = db.collegeEventRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new EventsHttpError(404, 'Event registration not found.');
    if (reg.status !== 'WAITLISTED') {
      throw new EventsHttpError(400, 'Only waitlisted registrations can be promoted.');
    }
    const event = db.collegeEvents.find((e) => e.id === reg.eventId);
    if (!event) throw new EventsHttpError(404, 'Associated event not found.');

    reg.status = 'CONFIRMED';
    reg.reviewedByName = actor.fullName;
    reg.reviewNote = 'Manually promoted from waitlist by authorized organizer.';
    reg.updatedAt = nowIso();
    recalculateEventCounters(db, event.id);

    queueNotification(db, {
      eventId: event.id,
      registrationId: reg.id,
      channel: 'EMAIL',
      recipientName: reg.fullName,
      recipientTarget: reg.email,
      subject: `Waitlist Seat Confirmed: ${event.title}`,
      message: `Your registration (${reg.registrationNumber}) has been promoted from the waitlist and is now CONFIRMED.`,
    });

    appendAudit(
      db,
      actor,
      event.id,
      'WAITLIST_PROMOTED',
      `Promoted ${reg.registrationNumber} (${reg.fullName}) from waitlist to CONFIRMED.`
    );
    saveDb(db);
    const { lookupTokenHash: _redacted, ...safeReg } = reg;
    return safeReg;
  },

  checkInParticipant(
    actor: EventsActor,
    payload: {
      qrToken?: string;
      registrationNumber?: string;
      registrationId?: string;
      eventId?: string;
    }
  ) {
    const db = getDb();
    const qrToken = String(payload.qrToken ?? '').trim();
    const regNum = String(payload.registrationNumber ?? '').trim().toUpperCase();
    const regId = String(payload.registrationId ?? '').trim();
    const eventIdFilter = String(payload.eventId ?? '').trim();

    if (!qrToken && !regNum && !regId) {
      throw new EventsHttpError(400, 'Provide a QR token, registration number, or registration ID.');
    }

    const reg = db.collegeEventRegistrations.find((r) => {
      if (qrToken && r.qrToken.toUpperCase() === qrToken.toUpperCase()) return true;
      if (regNum && r.registrationNumber.toUpperCase() === regNum) return true;
      if (regId && r.id === regId) return true;
      return false;
    });

    if (!reg) {
      throw new EventsHttpError(404, 'No matching event registration pass found for this token or number.');
    }
    if (eventIdFilter && reg.eventId !== eventIdFilter) {
      throw new EventsHttpError(
        400,
        `Ticket ${reg.registrationNumber} belongs to a different event.`
      );
    }

    const event = db.collegeEvents.find((e) => e.id === reg.eventId);
    if (!event) {
      throw new EventsHttpError(404, 'Associated event not found.');
    }
    if (event.status === 'CANCELLED') {
      throw new EventsHttpError(409, 'Check-in blocked: this event has been cancelled.');
    }
    if (reg.status !== 'CONFIRMED') {
      throw new EventsHttpError(
        409,
        `Check-in blocked: registration status is ${reg.status}. Only CONFIRMED attendees may check in.`
      );
    }
    if (reg.checkedIn) {
      throw new EventsHttpError(
        409,
        `Duplicate check-in prevented: ${reg.fullName} (${reg.registrationNumber}) was already checked in at ${reg.checkedInAt}.`
      );
    }

    reg.checkedIn = true;
    reg.checkedInAt = nowIso();
    reg.checkedInById = actor.id;
    reg.checkedInByName = actor.fullName;
    reg.updatedAt = nowIso();
    recalculateEventCounters(db, event.id);

    appendAudit(
      db,
      actor,
      event.id,
      'PARTICIPANT_CHECKED_IN',
      `Checked in ${reg.fullName} (${reg.registrationNumber}) via ${qrToken ? 'QR token' : 'registration lookup'}.`
    );
    saveDb(db);

    const { lookupTokenHash: _redacted, ...safeReg } = reg;
    return {
      registration: safeReg,
      eventTitle: event.title,
      checkedInCount: event.checkedInCount,
    };
  },

  checkOutParticipant(
    actor: EventsActor,
    payload: { qrToken?: string; registrationNumber?: string; registrationId?: string; eventId?: string }
  ) {
    const db = getDb();
    const qrToken = String(payload.qrToken ?? '').trim();
    const regNum = String(payload.registrationNumber ?? '').trim().toUpperCase();
    const regId = String(payload.registrationId ?? '').trim();

    const reg = db.collegeEventRegistrations.find((r) => {
      if (qrToken && r.qrToken.toUpperCase() === qrToken.toUpperCase()) return true;
      if (regNum && r.registrationNumber.toUpperCase() === regNum) return true;
      if (regId && r.id === regId) return true;
      return false;
    });
    if (!reg) {
      throw new EventsHttpError(404, 'Matching participant registration not found.');
    }
    if (!reg.checkedIn) {
      throw new EventsHttpError(409, `${reg.fullName} must be checked in before check-out can be recorded.`);
    }
    if (reg.checkedOut) {
      throw new EventsHttpError(409, `${reg.fullName} was already checked out at ${reg.checkedOutAt}.`);
    }

    reg.checkedOut = true;
    reg.checkedOutAt = nowIso();
    reg.updatedAt = nowIso();
    recalculateEventCounters(db, reg.eventId);

    appendAudit(
      db,
      actor,
      reg.eventId,
      'PARTICIPANT_CHECKED_OUT',
      `Recorded departure check-out for ${reg.fullName} (${reg.registrationNumber}).`
    );
    saveDb(db);
    const { lookupTokenHash: _redacted, ...safeReg } = reg;
    return { registration: safeReg };
  },

  getEventAttendanceSummary(eventId: string) {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');
    const regs = db.collegeEventRegistrations.filter((r) => r.eventId === eventId);
    const confirmed = regs.filter((r) => r.status === 'CONFIRMED');
    const checkedIn = confirmed.filter((r) => r.checkedIn);
    const checkedOut = confirmed.filter((r) => r.checkedOut);
    const pendingCheckIn = confirmed.filter((r) => !r.checkedIn);
    return {
      eventId,
      eventTitle: event.title,
      confirmedCount: confirmed.length,
      checkedInCount: checkedIn.length,
      checkedOutCount: checkedOut.length,
      attendanceRatePct: confirmed.length > 0 ? Math.round((checkedIn.length / confirmed.length) * 100) : 0,
      pendingCheckIn: pendingCheckIn.map(({ lookupTokenHash: _r, ...rest }) => rest),
      checkedInList: checkedIn.map(({ lookupTokenHash: _r, ...rest }) => rest),
    };
  },

  // ==========================================================
  // VENUES DIRECTORY & CONFLICT GUARD
  // ==========================================================

  listVenues(): EventVenueRecord[] {
    return getDb().collegeEventVenues;
  },

  createVenue(actor: EventsActor, payload: Partial<EventVenueRecord>): EventVenueRecord {
    const db = getDb();
    const name = String(payload.name ?? '').trim();
    const campus = String(payload.campus ?? '').trim();
    if (!name || !campus) {
      throw new EventsHttpError(400, 'Venue name and campus are required.');
    }
    const venue: EventVenueRecord = {
      id: `venue-${crypto.randomUUID().slice(0, 8)}`,
      name,
      campus,
      building: String(payload.building ?? 'Main Block').trim(),
      venueType: (payload.venueType ?? 'Lecture Hall') as EventVenueRecord['venueType'],
      capacity: Math.max(1, Number(payload.capacity ?? 100)),
      seatingLayout: String(payload.seatingLayout ?? 'Theatre Style').trim(),
      resources: Array.isArray(payload.resources) ? payload.resources.map(String) : [],
      accessibilityFeatures: String(payload.accessibilityFeatures ?? 'Step-free entrance').trim(),
      maintenanceStatus: (payload.maintenanceStatus ?? 'AVAILABLE') as EventVenueRecord['maintenanceStatus'],
    };
    db.collegeEventVenues.push(venue);
    appendAudit(db, actor, 'system', 'VENUE_CREATED', `Added venue "${venue.name}" (${venue.campus}).`);
    saveDb(db);
    return venue;
  },

  updateVenue(actor: EventsActor, venueId: string, payload: Partial<EventVenueRecord>): EventVenueRecord {
    const db = getDb();
    const venue = db.collegeEventVenues.find((v) => v.id === venueId);
    if (!venue) throw new EventsHttpError(404, 'Venue not found.');
    if (payload.name !== undefined) venue.name = String(payload.name).trim();
    if (payload.campus !== undefined) venue.campus = String(payload.campus).trim();
    if (payload.building !== undefined) venue.building = String(payload.building).trim();
    if (payload.venueType !== undefined) venue.venueType = payload.venueType;
    if (payload.capacity !== undefined) venue.capacity = Math.max(1, Number(payload.capacity));
    if (payload.seatingLayout !== undefined) venue.seatingLayout = String(payload.seatingLayout).trim();
    if (Array.isArray(payload.resources)) venue.resources = payload.resources.map(String);
    if (payload.accessibilityFeatures !== undefined) {
      venue.accessibilityFeatures = String(payload.accessibilityFeatures).trim();
    }
    if (payload.maintenanceStatus !== undefined) venue.maintenanceStatus = payload.maintenanceStatus;

    appendAudit(db, actor, 'system', 'VENUE_UPDATED', `Updated venue "${venue.name}" (${venue.maintenanceStatus}).`);
    saveDb(db);
    return venue;
  },

  // ==========================================================
  // PAYMENTS, INVITATIONS, FEEDBACK, CERTIFICATES, MEDIA
  // ==========================================================

  listEventPayments(eventId?: string): EventPaymentRecord[] {
    const db = getDb();
    return eventId
      ? db.collegeEventPayments.filter((p) => p.eventId === eventId)
      : db.collegeEventPayments;
  },

  verifyEventPayment(
    actor: EventsActor,
    paymentId: string,
    transactionRef?: string
  ): EventPaymentRecord {
    const db = getDb();
    const payment = db.collegeEventPayments.find((p) => p.id === paymentId);
    if (!payment) throw new EventsHttpError(404, 'Payment record not found.');
    if (payment.status === 'PAID') {
      throw new EventsHttpError(400, 'Payment is already verified as PAID.');
    }

    const ts = nowIso();
    payment.status = 'PAID';
    if (transactionRef && transactionRef.trim()) {
      payment.transactionRef = transactionRef.trim().toUpperCase();
    }
    payment.verifiedById = actor.id;
    payment.verifiedByName = actor.fullName;
    payment.verifiedAt = ts;

    const reg = db.collegeEventRegistrations.find((r) => r.id === payment.registrationId);
    if (reg) {
      reg.paymentStatus = 'PAID';
      reg.amountPaid = payment.amount;
      reg.updatedAt = ts;
    }

    appendAudit(
      db,
      actor,
      payment.eventId,
      'PAYMENT_VERIFIED',
      `Verified ${payment.currency} ${payment.amount} (${payment.method} Ref: ${payment.transactionRef}) for ${payment.registrationNumber}.`
    );
    saveDb(db);
    return payment;
  },

  refundEventPayment(actor: EventsActor, paymentId: string, reason?: string): EventPaymentRecord {
    const db = getDb();
    const payment = db.collegeEventPayments.find((p) => p.id === paymentId);
    if (!payment) throw new EventsHttpError(404, 'Payment record not found.');
    if (payment.status === 'REFUNDED') {
      throw new EventsHttpError(400, 'Payment has already been refunded.');
    }

    const ts = nowIso();
    const cleanReason = String(reason ?? '').trim() || 'Refund approved by Finance & Bursar office.';
    payment.status = 'REFUNDED';
    payment.refundReason = cleanReason;
    payment.refundedAt = ts;

    const reg = db.collegeEventRegistrations.find((r) => r.id === payment.registrationId);
    if (reg) {
      reg.paymentStatus = 'REFUNDED';
      reg.amountPaid = 0;
      reg.updatedAt = ts;
    }

    appendAudit(
      db,
      actor,
      payment.eventId,
      'PAYMENT_REFUNDED',
      `Issued refund for ${payment.registrationNumber} (${payment.currency} ${payment.amount}). Reason: ${cleanReason}`
    );
    saveDb(db);
    return payment;
  },

  listEventInvitations(eventId: string): EventInvitationRecord[] {
    return getDb().collegeEventInvitations.filter((i) => i.eventId === eventId);
  },

  createEventInvitation(
    actor: EventsActor,
    eventId: string,
    payload: {
      inviteeName: string;
      inviteeEmail: string;
      inviteePhone?: string;
      groupName?: string;
      expiresAt?: string;
    }
  ): EventInvitationRecord {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    const inviteeName = String(payload.inviteeName ?? '').trim();
    const inviteeEmail = String(payload.inviteeEmail ?? '').trim().toLowerCase();
    if (!inviteeName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail)) {
      throw new EventsHttpError(400, 'Invitee name and valid email are required.');
    }

    const code = `HTE-INV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const ts = nowIso();
    const invitation: EventInvitationRecord = {
      id: `einv-${crypto.randomUUID().slice(0, 8)}`,
      eventId,
      invitationCode: code,
      inviteeName,
      inviteeEmail,
      inviteePhone: String(payload.inviteePhone ?? '').trim(),
      groupName: String(payload.groupName ?? 'VIP / Invited Guest').trim(),
      status: 'SENT',
      expiresAt: String(payload.expiresAt ?? `${event.eventDate}T23:59:00.000Z`).trim(),
      convertedRegistrationId: null,
      invitedByName: actor.fullName,
      createdAt: ts,
      updatedAt: ts,
    };

    db.collegeEventInvitations.unshift(invitation);
    queueNotification(db, {
      eventId,
      registrationId: null,
      channel: 'EMAIL',
      recipientName: inviteeName,
      recipientTarget: inviteeEmail,
      subject: `Official Invitation: ${event.title}`,
      message: `Dear ${inviteeName}, you are invited to ${event.title} on ${event.eventDate}. Use personal code ${code} when registering.`,
    });
    appendAudit(
      db,
      actor,
      eventId,
      'INVITATION_SENT',
      `Sent invitation ${code} to ${inviteeName} (${inviteeEmail}).`
    );
    saveDb(db);
    return invitation;
  },

  updateEventInvitationStatus(
    actor: EventsActor,
    invitationId: string,
    status: EventInvitationStatus
  ): EventInvitationRecord {
    const db = getDb();
    const inv = db.collegeEventInvitations.find((i) => i.id === invitationId);
    if (!inv) throw new EventsHttpError(404, 'Invitation not found.');
    inv.status = status;
    inv.updatedAt = nowIso();
    appendAudit(db, actor, inv.eventId, 'INVITATION_UPDATED', `Updated invitation ${inv.invitationCode} to ${status}.`);
    saveDb(db);
    return inv;
  },

  listEventFeedback(eventId: string) {
    const db = getDb();
    const items = db.collegeEventFeedbacks.filter((f) => f.eventId === eventId);
    return {
      items,
      summary: computeFeedbackSummary(db, eventId),
    };
  },

  listEventCertificates(eventId: string): EventCertificateRecord[] {
    return getDb().collegeEventCertificates.filter((c) => c.eventId === eventId);
  },

  generateCertificatesForEvent(
    actor: EventsActor,
    eventId: string,
    onlyCheckedIn = true
  ): { issuedCount: number; certificates: EventCertificateRecord[] } {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    const candidates = db.collegeEventRegistrations.filter((r) => {
      if (r.eventId !== eventId || r.status !== 'CONFIRMED') return false;
      if (onlyCheckedIn && !r.checkedIn) return false;
      const alreadyHas = db.collegeEventCertificates.some(
        (c) => c.eventId === eventId && c.registrationId === r.id && c.status === 'ISSUED'
      );
      return !alreadyHas;
    });

    const newlyIssued: EventCertificateRecord[] = [];
    const ts = nowIso();

    for (const reg of candidates) {
      const certNumber = allocateCertificateNumber(db);
      const verificationCode = `VRF-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${certNumber.slice(-4)}`;
      const cert: EventCertificateRecord = {
        id: `ecert-${crypto.randomUUID().slice(0, 8)}`,
        eventId,
        registrationId: reg.id,
        certificateNumber: certNumber,
        verificationCode,
        participantName: reg.fullName,
        participantEmail: reg.email,
        certificateType: event.certificateType || 'Certificate of Participation',
        status: 'ISSUED',
        issuedAt: ts,
        issuedByName: actor.fullName,
        revokedReason: null,
      };
      reg.certificateCode = certNumber;
      reg.updatedAt = ts;
      db.collegeEventCertificates.unshift(cert);
      newlyIssued.push(cert);

      queueNotification(db, {
        eventId,
        registrationId: reg.id,
        channel: 'EMAIL',
        recipientName: reg.fullName,
        recipientTarget: reg.email,
        subject: `Certificate Issued: ${event.title}`,
        message: `Congratulations ${reg.fullName}! Your ${cert.certificateType} (${certNumber}) is ready. Verify anytime using code ${verificationCode}.`,
      });
    }

    appendAudit(
      db,
      actor,
      eventId,
      'CERTIFICATES_ISSUED',
      `Issued ${newlyIssued.length} verifiable event certificates for "${event.title}".`
    );
    saveDb(db);
    return { issuedCount: newlyIssued.length, certificates: newlyIssued };
  },

  revokeCertificate(
    actor: EventsActor,
    certificateId: string,
    reason?: string
  ): EventCertificateRecord {
    const db = getDb();
    const cert = db.collegeEventCertificates.find((c) => c.id === certificateId);
    if (!cert) throw new EventsHttpError(404, 'Certificate not found.');
    cert.status = 'REVOKED';
    cert.revokedReason = String(reason ?? '').trim() || 'Revoked by authorized Academic Administration.';
    appendAudit(
      db,
      actor,
      cert.eventId,
      'CERTIFICATE_REVOKED',
      `Revoked certificate ${cert.certificateNumber} (${cert.participantName}). Reason: ${cert.revokedReason}`
    );
    saveDb(db);
    return cert;
  },

  listEventMedia(eventId: string): EventMediaRecord[] {
    return getDb().collegeEventMedia.filter((m) => m.eventId === eventId);
  },

  createEventMedia(
    actor: EventsActor,
    eventId: string,
    payload: Partial<EventMediaRecord>
  ): EventMediaRecord {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');
    const title = String(payload.title ?? '').trim();
    const url = String(payload.url ?? 'local:ai-symposium').trim();
    if (!title) throw new EventsHttpError(400, 'Media asset title is required.');

    const rec: EventMediaRecord = {
      id: `emed-${crypto.randomUUID().slice(0, 8)}`,
      eventId,
      title,
      mediaType: (payload.mediaType ?? 'PHOTO') as EventMediaRecord['mediaType'],
      url,
      caption: String(payload.caption ?? '').trim(),
      altText: String(payload.altText ?? title).trim(),
      visibility: (payload.visibility ?? 'PUBLIC') as EventMediaRecord['visibility'],
      consentVerified: payload.consentVerified !== undefined ? Boolean(payload.consentVerified) : true,
      uploadedByName: actor.fullName,
      createdAt: nowIso(),
    };
    db.collegeEventMedia.unshift(rec);
    appendAudit(db, actor, eventId, 'MEDIA_ADDED', `Added ${rec.mediaType} asset "${title}".`);
    saveDb(db);
    return rec;
  },

  updateEventMedia(
    actor: EventsActor,
    mediaId: string,
    payload: Partial<EventMediaRecord>
  ): EventMediaRecord {
    const db = getDb();
    const media = db.collegeEventMedia.find((m) => m.id === mediaId);
    if (!media) throw new EventsHttpError(404, 'Media item not found.');
    if (payload.visibility !== undefined) media.visibility = payload.visibility;
    if (payload.consentVerified !== undefined) media.consentVerified = Boolean(payload.consentVerified);
    if (payload.caption !== undefined) media.caption = String(payload.caption).trim();
    appendAudit(db, actor, media.eventId, 'MEDIA_UPDATED', `Updated media visibility/consent for "${media.title}".`);
    saveDb(db);
    return media;
  },

  // ==========================================================
  // SETTINGS, REPORTS & ANNOUNCEMENTS
  // ==========================================================

  getEventSettings(): EventSettingsRecord {
    return getDb().eventSettings;
  },

  updateEventSettings(
    actor: EventsActor,
    payload: Partial<EventSettingsRecord>
  ): EventSettingsRecord {
    const db = getDb();
    const current = db.eventSettings;
    db.eventSettings = {
      ...current,
      defaultCurrency: String(payload.defaultCurrency ?? current.defaultCurrency).trim().toUpperCase(),
      defaultTimezone: String(payload.defaultTimezone ?? current.defaultTimezone).trim(),
      autoGenerateTickets:
        payload.autoGenerateTickets !== undefined
          ? Boolean(payload.autoGenerateTickets)
          : current.autoGenerateTickets,
      allowGuestRegistration:
        payload.allowGuestRegistration !== undefined
          ? Boolean(payload.allowGuestRegistration)
          : current.allowGuestRegistration,
      requireFeedbackConsent:
        payload.requireFeedbackConsent !== undefined
          ? Boolean(payload.requireFeedbackConsent)
          : current.requireFeedbackConsent,
      defaultReminderHours: Array.isArray(payload.defaultReminderHours)
        ? payload.defaultReminderHours.map(Number)
        : current.defaultReminderHours,
      dataRetentionDays: Math.max(30, Number(payload.dataRetentionDays ?? current.dataRetentionDays)),
      updatedByName: actor.fullName,
      updatedAt: nowIso(),
    };
    appendAudit(db, actor, 'system', 'EVENT_SETTINGS_UPDATED', 'Updated institutional event portal settings.');
    saveDb(db);
    return db.eventSettings;
  },

  getEventsReportsSummary() {
    const dashboard = this.getStaffEventsDashboard();
    const db = getDb();
    const eventPerformance = dashboard.events.map((ev) => {
      const fb = computeFeedbackSummary(db, ev.id);
      const rev = db.collegeEventPayments
        .filter((p) => p.eventId === ev.id && p.status === 'PAID')
        .reduce((s, p) => s + p.amount, 0);
      return {
        eventId: ev.id,
        eventCode: ev.eventCode,
        title: ev.title,
        category: ev.category,
        eventDate: ev.eventDate,
        campus: ev.campus,
        status: ev.status,
        capacity: ev.capacity,
        registeredCount: ev.registeredCount,
        waitlistCount: ev.waitlistCount,
        checkedInCount: ev.checkedInCount,
        occupancyPct: ev.capacity > 0 ? Math.round((ev.registeredCount / ev.capacity) * 100) : 0,
        attendanceRatePct: ev.registeredCount > 0 ? Math.round((ev.checkedInCount / ev.registeredCount) * 100) : 0,
        revenueKes: rev,
        feedbackCount: fb.responseCount,
        averageRating: fb.averageRating,
      };
    });
    return {
      kpis: dashboard.kpis,
      categoryBreakdown: dashboard.categoryBreakdown,
      eventPerformance,
      totalFeedbackCount: db.collegeEventFeedbacks.length,
      totalCertificatesIssued: db.collegeEventCertificates.filter((c) => c.status === 'ISSUED').length,
    };
  },

  exportEventsSummaryCsv(): { fileName: string; csv: string } {
    const summary = this.getEventsReportsSummary();
    const header = [
      'Event Code',
      'Event Title',
      'Category',
      'Date',
      'Campus',
      'Status',
      'Capacity',
      'Registered',
      'Waitlisted',
      'Checked In',
      'Occupancy %',
      'Revenue (KES)',
      'Avg Rating',
    ].map(csvCell);
    const lines = [header.join(',')];
    for (const row of summary.eventPerformance) {
      lines.push(
        [
          row.eventCode,
          row.title,
          row.category,
          row.eventDate,
          row.campus,
          row.status,
          row.capacity,
          row.registeredCount,
          row.waitlistCount,
          row.checkedInCount,
          row.occupancyPct,
          row.revenueKes,
          row.averageRating,
        ]
          .map(csvCell)
          .join(',')
      );
    }
    return {
      fileName: `hitech-events-summary-${todayDateString()}.csv`,
      csv: lines.join('\r\n'),
    };
  },

  sendEventAnnouncement(
    actor: EventsActor,
    eventId: string,
    payload: { subject?: string; message?: string; audience?: string }
  ): { sentCount: number } {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    const subject = String(payload.subject ?? '').trim();
    const message = String(payload.message ?? '').trim();
    const audience = String(payload.audience ?? 'CONFIRMED').toUpperCase();
    if (!subject || !message) {
      throw new EventsHttpError(400, 'Announcement subject and message are required.');
    }

    const targets = db.collegeEventRegistrations.filter((r) => {
      if (r.eventId !== eventId) return false;
      if (audience === 'CONFIRMED') return r.status === 'CONFIRMED';
      if (audience === 'WAITLISTED') return r.status === 'WAITLISTED';
      return r.status !== 'CANCELLED' && r.status !== 'REJECTED';
    });

    for (const r of targets) {
      queueNotification(db, {
        eventId: event.id,
        registrationId: r.id,
        channel: 'EMAIL',
        recipientName: r.fullName,
        recipientTarget: r.email,
        subject: `[${event.title}] ${subject}`,
        message,
      });
    }

    appendAudit(
      db,
      actor,
      event.id,
      'EVENT_ANNOUNCEMENT_SENT',
      `Dispatched "${subject}" notification to ${targets.length} ${audience.toLowerCase()} participants.`
    );
    saveDb(db);
    return { sentCount: targets.length };
  },

  exportEventRegistrationsCsv(eventId: string): { fileName: string; csv: string } {
    const db = getDb();
    const event = db.collegeEvents.find((e) => e.id === eventId);
    if (!event) throw new EventsHttpError(404, 'Event not found.');

    const rows = db.collegeEventRegistrations
      .filter((r) => r.eventId === eventId)
      .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));

    const header = [
      'Registration Number',
      'Full Name',
      'Email',
      'Phone',
      'Category',
      'Ticket Type',
      'Payment Status',
      'Organization / School',
      'Student / Staff Reg No',
      'Attendance Mode',
      'Status',
      'Checked In',
      'Checked In At',
      'Checked Out',
      'Checked Out At',
      'Certificate Code',
      'Special Requirements',
      'Registered At',
    ].map(csvCell);

    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(
        [
          r.registrationNumber,
          r.fullName,
          r.email,
          r.phone,
          r.participantCategory,
          r.ticketType,
          r.paymentStatus,
          r.organizationOrInstitution,
          r.studentOrStaffNumber,
          r.attendanceMode,
          r.status,
          r.checkedIn ? 'YES' : 'NO',
          r.checkedInAt ?? '',
          r.checkedOut ? 'YES' : 'NO',
          r.checkedOutAt ?? '',
          r.certificateCode ?? '',
          r.specialRequirements,
          r.registeredAt,
        ]
          .map(csvCell)
          .join(',')
      );
    }

    return {
      fileName: `${event.slug}-registrations.csv`,
      csv: lines.join('\r\n'),
    };
  },
};

export type EventMode = 'PHYSICAL' | 'ONLINE' | 'HYBRID';

export type EventCategory =
  | 'Academic Summit'
  | 'Conference'
  | 'Seminar'
  | 'Workshop & Training'
  | 'Open Day'
  | 'Graduation'
  | 'Career Fair'
  | 'Exhibition'
  | 'Competition'
  | 'Hackathon'
  | 'Webinar'
  | 'Student Life'
  | 'Orientation'
  | 'Public Lecture'
  | 'Alumni Event'
  | 'Sports Event'
  | 'Cultural Event'
  | 'Staff Meeting'
  | 'Student Meeting'
  | 'Parent Meeting'
  | 'Fundraising';

export const EVENT_CATEGORIES: EventCategory[] = [
  'Academic Summit',
  'Conference',
  'Workshop & Training',
  'Seminar',
  'Open Day',
  'Graduation',
  'Career Fair',
  'Exhibition',
  'Competition',
  'Hackathon',
  'Webinar',
  'Student Life',
  'Orientation',
  'Public Lecture',
  'Alumni Event',
  'Sports Event',
  'Cultural Event',
  'Staff Meeting',
  'Student Meeting',
  'Parent Meeting',
  'Fundraising',
];

export type EventAudienceRestriction =
  | 'PUBLIC'
  | 'STUDENTS_ONLY'
  | 'STAFF_ONLY'
  | 'INVITED_ONLY';

export type EventVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITATION' | 'INTERNAL';

export type CollegeEventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type EventParticipantCategory =
  | 'Student'
  | 'Prospective Student'
  | 'Parent / Guardian'
  | 'Staff Member'
  | 'Alumni'
  | 'Industry Partner'
  | 'General Public';

export type EventRegistrationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'CANCELLED'
  | 'REJECTED';

export type EventPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type EventTicketType =
  | 'General Admission'
  | 'Student Ticket'
  | 'Staff Ticket'
  | 'VIP'
  | 'Speaker'
  | 'Exhibitor'
  | 'Sponsor'
  | 'Complimentary';

export type EventInvitationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export type EventCertificateType =
  | 'Certificate of Participation'
  | 'Certificate of Attendance'
  | 'Certificate of Completion'
  | 'Certificate of Achievement'
  | 'Certificate of Presentation'
  | 'Certificate of Training';

export interface CollegeEventRecord {
  id: string;
  eventCode: string;
  slug: string;
  title: string;
  category: EventCategory | string;
  shortDescription: string;
  fullDescription: string;
  eventDate: string; // YYYY-MM-DD (Start Date)
  endDate: string; // YYYY-MM-DD
  startTime: string; // e.g. 09:00 AM
  endTime: string; // e.g. 04:00 PM
  timezone: string;
  isMultiDay: boolean;
  recurrencePattern: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  campus: string;
  venueId: string | null;
  venue: string;
  building: string;
  room: string;
  mapsLink: string;
  onlinePlatform: string;
  accessibilityInfo: string;
  parkingInfo: string;
  mode: EventMode;
  meetingUrl: string;
  organisingDepartmentId: string | null;
  organisingDepartmentName: string;
  organizerName: string;
  contactEmail: string;
  contactPhone: string;
  showContactPhonePublicly: boolean;
  targetAudience: string;
  requirements: string;
  language: string;
  tags: string[];
  visibility: EventVisibility;
  audienceRestriction: EventAudienceRestriction;
  capacity: number;
  waitlistCapacity: number;
  registeredCount: number;
  waitlistCount: number;
  checkedInCount: number;
  checkedOutCount: number;
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
  certificateType: EventCertificateType | string;
  certificateMinAttendance: boolean;
  feedbackEnabled: boolean;
  bannerImageUrl: string;
  featured: boolean;
  status: CollegeEventStatus;
  isPublished: boolean;
  createdById: string;
  createdByName: string;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  publishedById: string | null;
  publishedByName: string | null;
  publishedAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventScheduleItemRecord {
  id: string;
  eventId: string;
  dayNumber: number;
  timeRange: string;
  title: string;
  speakerName: string;
  location: string;
  description: string;
  sortOrder: number;
}

export interface EventSpeakerRecord {
  id: string;
  eventId: string;
  name: string;
  roleTitle: string;
  speakerRole:
    | 'Keynote Speaker'
    | 'Guest Speaker'
    | 'Facilitator'
    | 'Trainer'
    | 'Moderator'
    | 'Panelist'
    | 'Host';
  organization: string;
  bio: string;
  photoUrl: string;
  confirmationStatus: 'INVITED' | 'CONFIRMED' | 'DECLINED';
  sortOrder: number;
}

export interface EventRegistrationRecord {
  id: string;
  eventId: string;
  registrationNumber: string; // HTE-EVT-YYYY-0001
  lookupTokenHash: string;
  qrToken: string; // HTE-QR-XXXXXXXXXXXX
  fullName: string;
  email: string;
  phone: string;
  participantCategory: EventParticipantCategory | string;
  organizationOrInstitution: string;
  studentOrStaffNumber: string;
  attendanceMode: 'PHYSICAL' | 'ONLINE';
  ticketType: EventTicketType | string;
  paymentStatus: EventPaymentStatus;
  amountDue: number;
  amountPaid: number;
  specialRequirements: string;
  consentAccepted: boolean;
  status: EventRegistrationStatus;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedInById: string | null;
  checkedInByName: string | null;
  checkedOut: boolean;
  checkedOutAt: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
  organiserNotes: string;
  certificateCode: string | null;
  registeredAt: string;
  updatedAt: string;
}

export interface EventVenueRecord {
  id: string;
  name: string;
  campus: string;
  building: string;
  venueType: 'Auditorium' | 'Lecture Hall' | 'Laboratory' | 'Workshop' | 'Boardroom' | 'Outdoor';
  capacity: number;
  seatingLayout: string;
  resources: string[];
  accessibilityFeatures: string;
  maintenanceStatus: 'AVAILABLE' | 'MAINTENANCE' | 'RESTRICTED';
}

export interface EventVenueConflict {
  conflictingEventId: string;
  conflictingEventTitle: string;
  eventDate: string;
  timeWindow: string;
  venue: string;
  reason: string;
}

export interface EventPaymentRecord {
  id: string;
  eventId: string;
  registrationId: string;
  registrationNumber: string;
  participantName: string;
  participantEmail: string;
  ticketType: string;
  amount: number;
  currency: string;
  method: 'MPESA' | 'BANK_TRANSFER' | 'CASH_BURSAR' | 'WAIVER';
  transactionRef: string;
  status: EventPaymentStatus;
  verifiedById: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  refundReason: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface EventInvitationRecord {
  id: string;
  eventId: string;
  invitationCode: string; // HTE-INV-XXXX
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone: string;
  groupName: string;
  status: EventInvitationStatus;
  expiresAt: string;
  convertedRegistrationId: string | null;
  invitedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFeedbackRecord {
  id: string;
  eventId: string;
  registrationId: string | null;
  respondentName: string;
  isAnonymous: boolean;
  overallRating: number; // 1..5
  speakerRating: number; // 1..5
  organisationRating: number; // 1..5
  venueRating: number; // 1..5
  recommendNps: number; // 0..10
  comments: string;
  futureTopicInterest: string;
  createdAt: string;
}

export interface EventCertificateRecord {
  id: string;
  eventId: string;
  registrationId: string;
  certificateNumber: string; // HTE-CERT-2026-XXXX
  verificationCode: string;
  participantName: string;
  participantEmail: string;
  certificateType: EventCertificateType | string;
  status: 'ISSUED' | 'REVOKED';
  issuedAt: string;
  issuedByName: string;
  revokedReason: string | null;
}

export interface EventMediaRecord {
  id: string;
  eventId: string;
  title: string;
  mediaType: 'PHOTO' | 'VIDEO' | 'POSTER' | 'BROCHURE' | 'PRESENTATION';
  url: string;
  caption: string;
  altText: string;
  visibility: 'PUBLIC' | 'STAFF_ONLY';
  consentVerified: boolean;
  uploadedByName: string;
  createdAt: string;
}

export interface EventSettingsRecord {
  defaultCurrency: string;
  defaultTimezone: string;
  autoGenerateTickets: boolean;
  allowGuestRegistration: boolean;
  requireFeedbackConsent: boolean;
  defaultReminderHours: number[];
  dataRetentionDays: number;
  updatedByName: string;
  updatedAt: string;
}

export interface EventNotificationRecord {
  id: string;
  eventId: string;
  registrationId: string | null;
  channel: 'EMAIL' | 'SMS' | 'PORTAL';
  recipientName: string;
  recipientTarget: string;
  subject: string;
  message: string;
  status: 'DISPATCHED';
  createdAt: string;
}

export interface EventAuditLogRecord {
  id: string;
  eventId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface PublicEventSummary extends CollegeEventRecord {
  availableSeats: number;
  isRegistrationOpen: boolean;
  isToday: boolean;
  isPast: boolean;
  registrationClosedReason: string | null;
}

export interface PublicEventDetail extends PublicEventSummary {
  schedules: EventScheduleItemRecord[];
  speakers: EventSpeakerRecord[];
  publicMedia: EventMediaRecord[];
  feedbackSummary: {
    responseCount: number;
    averageRating: number;
    npsScore: number;
  };
}

export interface PublicRegistrationTicketView {
  id: string;
  eventId: string;
  registrationNumber: string;
  qrToken: string;
  fullName: string;
  email: string;
  phone: string;
  participantCategory: string;
  organizationOrInstitution: string;
  studentOrStaffNumber: string;
  attendanceMode: 'PHYSICAL' | 'ONLINE';
  ticketType: string;
  paymentStatus: EventPaymentStatus;
  amountDue: number;
  amountPaid: number;
  specialRequirements: string;
  status: EventRegistrationStatus;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedOut: boolean;
  checkedOutAt: string | null;
  certificateCode: string | null;
  registeredAt: string;
  event: {
    id: string;
    eventCode: string;
    slug: string;
    title: string;
    category: string;
    eventDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    campus: string;
    venue: string;
    mode: EventMode;
    meetingUrl: string;
    organisingDepartmentName: string;
    contactEmail: string;
    contactPhone: string;
    isPaid: boolean;
    feeAmount: number;
    feeCurrency: string;
    allowSelfCancel: boolean;
    feedbackEnabled: boolean;
    certificateEnabled: boolean;
    status: CollegeEventStatus;
  };
}

export interface EventsDashboardKpis {
  totalEvents: number;
  draftEvents: number;
  pendingEventApprovals: number;
  publishedEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  activeRegistrations: number;
  confirmedAttendees: number;
  pendingRegistrationApprovals: number;
  waitlistedParticipants: number;
  checkedInAttendees: number;
  checkedOutAttendees: number;
  noShowParticipants: number;
  cancelledRegistrations: number;
  totalRevenueKes: number;
  outstandingFeesKes: number;
}

export interface EventsDashboardPayload {
  kpis: EventsDashboardKpis;
  events: PublicEventSummary[];
  recentRegistrations: Array<Omit<EventRegistrationRecord, 'lookupTokenHash'> & { eventTitle: string }>;
  capacityAlerts: Array<{
    eventId: string;
    title: string;
    eventDate: string;
    occupancyPct: number;
    availableSeats: number;
    waitlistCount: number;
  }>;
  deadlineAlerts: Array<{
    eventId: string;
    title: string;
    eventDate: string;
    registrationDeadline: string;
    hoursRemaining: number;
  }>;
  categoryBreakdown: Array<{ category: string; eventCount: number; registrations: number }>;
  recentNotifications: EventNotificationRecord[];
  auditLogs: EventAuditLogRecord[];
}

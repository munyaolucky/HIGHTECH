import type {
  CollegeEventRecord,
  EventAuditLogRecord,
  EventCertificateRecord,
  EventFeedbackRecord,
  EventInvitationRecord,
  EventInvitationStatus,
  EventMediaRecord,
  EventNotificationRecord,
  EventPaymentRecord,
  EventRegistrationRecord,
  EventScheduleItemRecord,
  EventSettingsRecord,
  EventSpeakerRecord,
  EventVenueConflict,
  EventVenueRecord,
  EventsDashboardKpis,
  EventsDashboardPayload,
  PublicEventDetail,
  PublicEventSummary,
  PublicRegistrationTicketView,
} from '../../../server/modules/events/events.types';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });
  const payload = (await res.json()) as { success: boolean; data?: T; error?: string };
  if (!res.ok || !payload.success) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return payload.data as T;
}

const TICKET_TOKEN_STORAGE_KEY = 'hitech_event_ticket_tokens_v1';

export function saveEventTicketToken(registrationId: string, token: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(sessionStorage.getItem(TICKET_TOKEN_STORAGE_KEY) || '{}') as Record<
      string,
      string
    >;
    existing[registrationId] = token;
    sessionStorage.setItem(TICKET_TOKEN_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage unavailability
  }
}

export function getSavedEventTicketToken(registrationId: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = JSON.parse(sessionStorage.getItem(TICKET_TOKEN_STORAGE_KEY) || '{}') as Record<
      string,
      string
    >;
    return existing[registrationId];
  } catch {
    return undefined;
  }
}

export type {
  CollegeEventRecord,
  EventAuditLogRecord,
  EventCertificateRecord,
  EventFeedbackRecord,
  EventInvitationRecord,
  EventInvitationStatus,
  EventMediaRecord,
  EventNotificationRecord,
  EventPaymentRecord,
  EventRegistrationRecord,
  EventScheduleItemRecord,
  EventSettingsRecord,
  EventSpeakerRecord,
  EventVenueConflict,
  EventVenueRecord,
  EventsDashboardKpis,
  EventsDashboardPayload,
  PublicEventDetail,
  PublicEventSummary,
  PublicRegistrationTicketView,
};

export interface TicketOrCertVerificationResult {
  kind: 'TICKET' | 'CERTIFICATE';
  valid: boolean;
  status: string;
  holderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventVenue?: string;
  eventStatus?: string;
  registrationNumber?: string;
  qrToken?: string;
  participantCategory?: string;
  ticketType?: string;
  attendanceMode?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  certificateNumber?: string;
  verificationCode?: string;
  certificateType?: string;
  issuedAt?: string;
  issuedByName?: string;
  revokedReason?: string | null;
}

export interface StudentPortalPassItem {
  id: string;
  registrationNumber: string;
  qrToken: string;
  status: string;
  ticketType: string;
  attendanceMode: string;
  checkedIn: boolean;
  checkedOut: boolean;
  certificateCode: string | null;
  certificateStatus: string | null;
  registeredAt: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  feedbackEnabled: boolean;
}

export const publicEventsApi = {
  list(params?: {
    search?: string;
    category?: string;
    mode?: string;
    dateFilter?: string;
    feeFilter?: string;
    campus?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.category && params.category !== 'ALL') qs.set('category', params.category);
    if (params?.mode && params.mode !== 'ALL') qs.set('mode', params.mode);
    if (params?.dateFilter && params.dateFilter !== 'ALL') qs.set('dateFilter', params.dateFilter);
    if (params?.feeFilter && params.feeFilter !== 'ALL') qs.set('feeFilter', params.feeFilter);
    if (params?.campus && params.campus !== 'ALL') qs.set('campus', params.campus);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return requestJson<PublicEventSummary[]>(`/api/public/events${suffix}`);
  },

  getDetail(slugOrId: string) {
    return requestJson<PublicEventDetail>(`/api/public/events/${encodeURIComponent(slugOrId)}`);
  },

  getAvailability(slugOrId: string) {
    return requestJson<{
      eventId: string;
      eventCode: string;
      slug: string;
      title: string;
      capacity: number;
      waitlistCapacity: number;
      registeredCount: number;
      waitlistCount: number;
      availableSeats: number;
      allowWaitlist: boolean;
      isRegistrationOpen: boolean;
      registrationClosedReason: string | null;
      isPaid: boolean;
      feeAmount: number;
      studentFeeAmount: number;
      feeCurrency: string;
      requiresApproval: boolean;
      audienceRestriction: string;
    }>(`/api/public/events/${encodeURIComponent(slugOrId)}/availability`);
  },

  register(
    eventId: string,
    payload: {
      fullName: string;
      email: string;
      phone: string;
      participantCategory: string;
      organizationOrInstitution?: string;
      studentOrStaffNumber?: string;
      attendanceMode: 'PHYSICAL' | 'ONLINE';
      ticketType?: string;
      paymentMethod?: string;
      paymentRef?: string;
      specialRequirements?: string;
      consentAccepted: boolean;
      invitationCode?: string;
    }
  ) {
    return requestJson<{
      registration: PublicRegistrationTicketView;
      lookupToken: string;
      message: string;
    }>(`/api/public/events/${encodeURIComponent(eventId)}/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTicket(registrationId: string, token: string) {
    return requestJson<PublicRegistrationTicketView>(
      `/api/public/events/registration/${encodeURIComponent(registrationId)}?token=${encodeURIComponent(token)}`
    );
  },

  cancelTicket(registrationId: string, token: string, reason?: string) {
    return requestJson<{
      ticket: PublicRegistrationTicketView;
      promotedRegistrationNumber: string | null;
    }>(`/api/public/events/registration/${encodeURIComponent(registrationId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ token, reason }),
    });
  },

  verifyTicketOrCertificate(code: string) {
    return requestJson<TicketOrCertVerificationResult>(
      `/api/public/events/ticket/${encodeURIComponent(code.trim())}/verify`
    );
  },

  submitFeedback(
    eventIdOrSlug: string,
    payload: {
      respondentName?: string;
      registrationNumber?: string;
      isAnonymous?: boolean;
      overallRating: number;
      speakerRating: number;
      organisationRating: number;
      venueRating: number;
      recommendNps: number;
      comments?: string;
      futureTopicInterest?: string;
    }
  ) {
    return requestJson<EventFeedbackRecord>(
      `/api/public/events/${encodeURIComponent(eventIdOrSlug)}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  getStudentEventsAndPasses(identifier: string) {
    return requestJson<{
      upcomingEvents: PublicEventSummary[];
      myRegistrations: StudentPortalPassItem[];
    }>(`/api/public/events/student-passes?identifier=${encodeURIComponent(identifier)}`);
  },
};

export const staffEventsApi = {
  getDashboard() {
    return requestJson<EventsDashboardPayload>('/api/events/dashboard');
  },

  getEventDetail(eventId: string) {
    return requestJson<{
      event: PublicEventSummary;
      schedules: EventScheduleItemRecord[];
      speakers: EventSpeakerRecord[];
      registrations: Omit<EventRegistrationRecord, 'lookupTokenHash'>[];
      payments: EventPaymentRecord[];
      invitations: EventInvitationRecord[];
      feedback: EventFeedbackRecord[];
      feedbackSummary: { responseCount: number; averageRating: number; npsScore: number };
      certificates: EventCertificateRecord[];
      media: EventMediaRecord[];
      notifications: EventNotificationRecord[];
      auditLogs: EventAuditLogRecord[];
    }>(`/api/events/${encodeURIComponent(eventId)}`);
  },

  checkVenueConflict(params: {
    venueId?: string | null;
    venueName?: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    excludeEventId?: string;
  }) {
    const qs = new URLSearchParams({
      eventDate: params.eventDate,
      startTime: params.startTime,
      endTime: params.endTime,
    });
    if (params.venueId) qs.set('venueId', params.venueId);
    if (params.venueName) qs.set('venueName', params.venueName);
    if (params.excludeEventId) qs.set('excludeEventId', params.excludeEventId);
    return requestJson<EventVenueConflict[]>(`/api/events/venues/conflict-check?${qs.toString()}`);
  },

  createEvent(
    payload: Partial<CollegeEventRecord> & {
      schedules?: Array<Partial<EventScheduleItemRecord>>;
      speakers?: Array<Partial<EventSpeakerRecord>>;
      submitForApproval?: boolean;
      ignoreVenueConflict?: boolean;
    }
  ) {
    return requestJson<CollegeEventRecord>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateEvent(
    eventId: string,
    payload: Partial<CollegeEventRecord> & {
      schedules?: Array<Partial<EventScheduleItemRecord>>;
      speakers?: Array<Partial<EventSpeakerRecord>>;
    }
  ) {
    return requestJson<CollegeEventRecord>(`/api/events/${encodeURIComponent(eventId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  duplicateEvent(eventId: string) {
    return requestJson<CollegeEventRecord>(`/api/events/${encodeURIComponent(eventId)}/duplicate`, {
      method: 'POST',
    });
  },

  archiveOrDeleteEvent(eventId: string, hardDelete = false) {
    return requestJson<{ archived: boolean; deleted: boolean }>(
      `/api/events/${encodeURIComponent(eventId)}${hardDelete ? '?hard=true' : ''}`,
      { method: 'DELETE' }
    );
  },

  saveSchedules(eventId: string, items: Array<Partial<EventScheduleItemRecord>>) {
    return requestJson<EventScheduleItemRecord[]>(
      `/api/events/${encodeURIComponent(eventId)}/schedules`,
      {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }
    );
  },

  saveSpeakers(eventId: string, items: Array<Partial<EventSpeakerRecord>>) {
    return requestJson<EventSpeakerRecord[]>(
      `/api/events/${encodeURIComponent(eventId)}/speakers`,
      {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }
    );
  },

  submitEvent(eventId: string) {
    return requestJson<CollegeEventRecord>(
      `/api/events/${encodeURIComponent(eventId)}/submit`,
      { method: 'POST' }
    );
  },

  approveEvent(eventId: string) {
    return requestJson<CollegeEventRecord>(
      `/api/events/${encodeURIComponent(eventId)}/approve`,
      { method: 'POST' }
    );
  },

  publishEvent(eventId: string) {
    return requestJson<CollegeEventRecord>(
      `/api/events/${encodeURIComponent(eventId)}/publish`,
      { method: 'POST' }
    );
  },

  cancelEvent(eventId: string, reason: string) {
    return requestJson<CollegeEventRecord>(
      `/api/events/${encodeURIComponent(eventId)}/cancel`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    );
  },

  addStaffRegistration(
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
    return requestJson<{
      registration: Omit<EventRegistrationRecord, 'lookupTokenHash'>;
      lookupToken: string;
    }>(`/api/events/${encodeURIComponent(eventId)}/registrations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  bulkRegisterParticipants(
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
    return requestJson<{
      addedCount: number;
      addedRegistrationNumbers: string[];
      skipped: Array<{ email: string; reason: string }>;
    }>(`/api/events/${encodeURIComponent(eventId)}/registrations/bulk`, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  updateRegistrationNotes(regId: string, payload: { organiserNotes?: string; ticketType?: string }) {
    return requestJson<Omit<EventRegistrationRecord, 'lookupTokenHash'>>(
      `/api/events/registrations/${encodeURIComponent(regId)}/notes`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },

  updateRegistrationStatus(
    regId: string,
    action: 'APPROVE' | 'REJECT' | 'CANCEL',
    note?: string
  ) {
    return requestJson<Omit<EventRegistrationRecord, 'lookupTokenHash'>>(
      `/api/events/registrations/${encodeURIComponent(regId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ action, note }),
      }
    );
  },

  promoteWaitlisted(regId: string) {
    return requestJson<Omit<EventRegistrationRecord, 'lookupTokenHash'>>(
      `/api/events/registrations/${encodeURIComponent(regId)}/promote`,
      { method: 'POST' }
    );
  },

  checkIn(payload: {
    qrToken?: string;
    registrationNumber?: string;
    registrationId?: string;
    eventId?: string;
  }) {
    return requestJson<{
      registration: Omit<EventRegistrationRecord, 'lookupTokenHash'>;
      eventTitle: string;
      checkedInCount: number;
    }>('/api/events/check-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  checkOut(payload: {
    qrToken?: string;
    registrationNumber?: string;
    registrationId?: string;
    eventId?: string;
  }) {
    return requestJson<{ registration: Omit<EventRegistrationRecord, 'lookupTokenHash'> }>(
      '/api/events/check-out',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  listVenues() {
    return requestJson<EventVenueRecord[]>('/api/events/venues');
  },

  createVenue(payload: Partial<EventVenueRecord>) {
    return requestJson<EventVenueRecord>('/api/events/venues', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateVenue(venueId: string, payload: Partial<EventVenueRecord>) {
    return requestJson<EventVenueRecord>(`/api/events/venues/${encodeURIComponent(venueId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  listEventPayments(eventId: string) {
    return requestJson<EventPaymentRecord[]>(`/api/events/${encodeURIComponent(eventId)}/payments`);
  },

  verifyPayment(paymentId: string, transactionRef?: string) {
    return requestJson<EventPaymentRecord>(
      `/api/events/payments/${encodeURIComponent(paymentId)}/verify`,
      {
        method: 'POST',
        body: JSON.stringify({ transactionRef }),
      }
    );
  },

  refundPayment(paymentId: string, reason?: string) {
    return requestJson<EventPaymentRecord>(
      `/api/events/payments/${encodeURIComponent(paymentId)}/refund`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  },

  listInvitations(eventId: string) {
    return requestJson<EventInvitationRecord[]>(`/api/events/${encodeURIComponent(eventId)}/invitations`);
  },

  createInvitation(
    eventId: string,
    payload: {
      inviteeName: string;
      inviteeEmail: string;
      inviteePhone?: string;
      groupName?: string;
    }
  ) {
    return requestJson<EventInvitationRecord>(
      `/api/events/${encodeURIComponent(eventId)}/invitations`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  updateInvitationStatus(invId: string, status: EventInvitationStatus) {
    return requestJson<EventInvitationRecord>(`/api/events/invitations/${encodeURIComponent(invId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  listCertificates(eventId: string) {
    return requestJson<EventCertificateRecord[]>(
      `/api/events/${encodeURIComponent(eventId)}/certificates`
    );
  },

  generateCertificates(eventId: string, onlyCheckedIn = true) {
    return requestJson<{ issuedCount: number; certificates: EventCertificateRecord[] }>(
      `/api/events/${encodeURIComponent(eventId)}/certificates/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ onlyCheckedIn }),
      }
    );
  },

  revokeCertificate(certId: string, reason: string) {
    return requestJson<EventCertificateRecord>(
      `/api/events/certificates/${encodeURIComponent(certId)}/revoke`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  },

  listMedia(eventId: string) {
    return requestJson<EventMediaRecord[]>(`/api/events/${encodeURIComponent(eventId)}/media`);
  },

  createMedia(eventId: string, payload: Partial<EventMediaRecord>) {
    return requestJson<EventMediaRecord>(`/api/events/${encodeURIComponent(eventId)}/media`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateMedia(mediaId: string, payload: Partial<EventMediaRecord>) {
    return requestJson<EventMediaRecord>(`/api/events/media/${encodeURIComponent(mediaId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getSettings() {
    return requestJson<EventSettingsRecord>('/api/events/settings');
  },

  updateSettings(payload: Partial<EventSettingsRecord>) {
    return requestJson<EventSettingsRecord>('/api/events/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getReportsSummary() {
    return requestJson<{
      kpis: EventsDashboardKpis;
      categoryBreakdown: Array<{ category: string; eventCount: number; registrations: number }>;
      eventPerformance: Array<{
        eventId: string;
        eventCode: string;
        title: string;
        category: string;
        eventDate: string;
        campus: string;
        status: string;
        capacity: number;
        registeredCount: number;
        waitlistCount: number;
        checkedInCount: number;
        occupancyPct: number;
        attendanceRatePct: number;
        revenueKes: number;
        feedbackCount: number;
        averageRating: number;
      }>;
      totalFeedbackCount: number;
      totalCertificatesIssued: number;
    }>('/api/events/reports/summary');
  },

  sendAnnouncement(
    eventId: string,
    payload: { subject: string; message: string; audience: 'CONFIRMED' | 'WAITLISTED' | 'ALL' }
  ) {
    return requestJson<{ sentCount: number }>(
      `/api/events/${encodeURIComponent(eventId)}/notifications`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },
};

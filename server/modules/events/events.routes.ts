import { Router, type Request, type Response } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth.ts';
import { STAFF_PERMISSIONS } from '../staff/staff.permissions.ts';
import { EventsHttpError, eventsService, type EventsActor } from './events.service.ts';

function toEventsActor(req: Request): EventsActor {
  if (!req.staffUser) {
    throw new EventsHttpError(401, 'Authenticated staff session is required.');
  }
  return {
    id: req.staffUser.id,
    fullName: req.staffUser.fullName,
    role: req.staffUser.role,
    permissions: req.staffUser.permissions,
  };
}

function handleEventsError(res: Response, err: unknown): void {
  if (err instanceof EventsHttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected events error.';
  res.status(500).json({ success: false, error: message });
}

// ==========================================================
// PUBLIC EVENTS ROUTES (/api/public/events)
// ==========================================================
export const publicEventsRoutes = Router();

publicEventsRoutes.get('/', (req, res) => {
  try {
    const data = eventsService.listPublicEvents({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      mode: req.query.mode as string | undefined,
      dateFilter: req.query.dateFilter as string | undefined,
      feeFilter: req.query.feeFilter as string | undefined,
      campus: req.query.campus as string | undefined,
      featured: req.query.featured as string | undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.get('/student-passes', (req, res) => {
  try {
    const identifier =
      (req.query.identifier as string | undefined) ||
      (req.query.regNo as string | undefined) ||
      (req.query.email as string | undefined) ||
      '';
    const data = eventsService.listStudentPortalEventsAndTickets(identifier);
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.get('/ticket/:token/verify', (req, res) => {
  try {
    const data = eventsService.verifyPublicTicketOrCertificate(req.params.token);
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.get('/certificates/:code/verify', (req, res) => {
  try {
    const data = eventsService.verifyPublicTicketOrCertificate(req.params.code);
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.get('/registration/:registrationId', (req, res) => {
  try {
    const token =
      (req.query.token as string | undefined) ||
      (req.headers['x-registration-token'] as string | undefined);
    const data = eventsService.getPublicRegistrationByToken(req.params.registrationId, token);
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.post('/registration/:registrationId/cancel', (req, res) => {
  try {
    const token =
      (req.body?.token as string | undefined) ||
      (req.query.token as string | undefined) ||
      (req.headers['x-registration-token'] as string | undefined);
    const data = eventsService.cancelPublicRegistration(
      req.params.registrationId,
      token,
      req.body?.reason
    );
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.get('/:slugOrId/availability', (req, res) => {
  try {
    const data = eventsService.getPublicEventAvailability(req.params.slugOrId);
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.get('/:slugOrId/ics', (req, res) => {
  try {
    const { fileName, ics } = eventsService.generateEventIcsCalendar(req.params.slugOrId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(ics);
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.post('/:eventId/register', (req, res) => {
  try {
    const result = eventsService.registerForPublicEvent(req.params.eventId, req.body || {});
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.post('/:eventId/feedback', (req, res) => {
  try {
    const data = eventsService.submitPublicFeedback(req.params.eventId, req.body || {});
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

publicEventsRoutes.get('/:slugOrId', (req, res) => {
  try {
    const data = eventsService.getPublicEventBySlugOrId(req.params.slugOrId);
    res.json({ success: true, data });
  } catch (err) {
    handleEventsError(res, err);
  }
});

// ==========================================================
// STAFF EVENTS MANAGEMENT & CHECK-IN ROUTES (/api/events)
// ==========================================================
export const staffEventsRoutes = Router();
staffEventsRoutes.use(requireAuth);

staffEventsRoutes.get(
  '/dashboard',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (_req, res) => {
    try {
      const data = eventsService.getStaffEventsDashboard();
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/venues',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (_req, res) => {
    try {
      res.json({ success: true, data: eventsService.listVenues() });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/venues',
  requirePermission(STAFF_PERMISSIONS.EVENT_VENUE_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.createVenue(toEventsActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.patch(
  '/venues/:venueId',
  requirePermission(STAFF_PERMISSIONS.EVENT_VENUE_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.updateVenue(toEventsActor(req), req.params.venueId, req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/venues/conflict-check',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (req, res) => {
    try {
      const data = eventsService.checkVenueConflict({
        venueId: req.query.venueId as string | undefined,
        venueName: req.query.venueName as string | undefined,
        eventDate: String(req.query.eventDate ?? ''),
        startTime: String(req.query.startTime ?? '09:00 AM'),
        endTime: String(req.query.endTime ?? '04:00 PM'),
        excludeEventId: req.query.excludeEventId as string | undefined,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/settings',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (_req, res) => {
    try {
      res.json({ success: true, data: eventsService.getEventSettings() });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.put(
  '/settings',
  requirePermission(STAFF_PERMISSIONS.EVENT_SETTINGS_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.updateEventSettings(toEventsActor(req), req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/reports/summary',
  requirePermission(STAFF_PERMISSIONS.EVENT_REPORT_VIEW),
  (_req, res) => {
    try {
      res.json({ success: true, data: eventsService.getEventsReportsSummary() });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/reports/export',
  requirePermission(STAFF_PERMISSIONS.EVENT_REPORT_EXPORT),
  (_req, res) => {
    try {
      const { fileName, csv } = eventsService.exportEventsSummaryCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csv);
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/check-in',
  requirePermission(STAFF_PERMISSIONS.EVENT_CHECKIN),
  (req, res) => {
    try {
      const data = eventsService.checkInParticipant(toEventsActor(req), req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/check-out',
  requirePermission(STAFF_PERMISSIONS.EVENT_CHECKIN),
  (req, res) => {
    try {
      const data = eventsService.checkOutParticipant(toEventsActor(req), req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.patch(
  '/registrations/:regId/notes',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_EDIT),
  (req, res) => {
    try {
      const data = eventsService.updateRegistrationNotes(
        toEventsActor(req),
        req.params.regId,
        req.body || {}
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/registrations/:regId/approve',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_APPROVE),
  (req, res) => {
    try {
      const data = eventsService.updateRegistrationStatus(
        toEventsActor(req),
        req.params.regId,
        'APPROVE',
        req.body?.note
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/registrations/:regId/reject',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_APPROVE),
  (req, res) => {
    try {
      const data = eventsService.updateRegistrationStatus(
        toEventsActor(req),
        req.params.regId,
        'REJECT',
        req.body?.note
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/registrations/:regId/cancel',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_APPROVE),
  (req, res) => {
    try {
      const data = eventsService.updateRegistrationStatus(
        toEventsActor(req),
        req.params.regId,
        'CANCEL',
        req.body?.note
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.patch(
  '/registrations/:regId',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_APPROVE),
  (req, res) => {
    try {
      const action = String(req.body?.action ?? '').toUpperCase() as
        | 'APPROVE'
        | 'REJECT'
        | 'CANCEL';
      const data = eventsService.updateRegistrationStatus(
        toEventsActor(req),
        req.params.regId,
        action,
        req.body?.note
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/registrations/:regId/promote',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_APPROVE),
  (req, res) => {
    try {
      const data = eventsService.promoteWaitlistedRegistration(
        toEventsActor(req),
        req.params.regId
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/payments/:paymentId/verify',
  requirePermission(STAFF_PERMISSIONS.EVENT_PAYMENT_VERIFY),
  (req, res) => {
    try {
      const data = eventsService.verifyEventPayment(
        toEventsActor(req),
        req.params.paymentId,
        req.body?.transactionRef
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/payments/:paymentId/refund',
  requirePermission(STAFF_PERMISSIONS.EVENT_PAYMENT_REFUND),
  (req, res) => {
    try {
      const data = eventsService.refundEventPayment(
        toEventsActor(req),
        req.params.paymentId,
        req.body?.reason
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.patch(
  '/invitations/:invId',
  requirePermission(STAFF_PERMISSIONS.EVENT_INVITATION_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.updateEventInvitationStatus(
        toEventsActor(req),
        req.params.invId,
        req.body?.status
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/certificates/:certId/revoke',
  requirePermission(STAFF_PERMISSIONS.EVENT_CERTIFICATE_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.revokeCertificate(
        toEventsActor(req),
        req.params.certId,
        req.body?.reason
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.patch(
  '/media/:mediaId',
  requirePermission(STAFF_PERMISSIONS.EVENT_MEDIA_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.updateEventMedia(
        toEventsActor(req),
        req.params.mediaId,
        req.body || {}
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (req, res) => {
    try {
      const data = eventsService.listStaffEvents({
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/',
  requirePermission(STAFF_PERMISSIONS.EVENT_CREATE),
  (req, res) => {
    try {
      const data = eventsService.createStaffEvent(toEventsActor(req), req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (req, res) => {
    try {
      const data = eventsService.getStaffEventDetail(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.put(
  '/:id',
  requirePermission(STAFF_PERMISSIONS.EVENT_EDIT),
  (req, res) => {
    try {
      const data = eventsService.updateStaffEvent(toEventsActor(req), req.params.id, req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.patch(
  '/:id',
  requirePermission(STAFF_PERMISSIONS.EVENT_EDIT),
  (req, res) => {
    try {
      const data = eventsService.updateStaffEvent(toEventsActor(req), req.params.id, req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.delete(
  '/:id',
  requirePermission(STAFF_PERMISSIONS.EVENT_DELETE),
  (req, res) => {
    try {
      const hardDelete = req.query.hard === 'true';
      const data = eventsService.archiveOrDeleteEvent(toEventsActor(req), req.params.id, hardDelete);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/duplicate',
  requirePermission(STAFF_PERMISSIONS.EVENT_CREATE),
  (req, res) => {
    try {
      const data = eventsService.duplicateStaffEvent(toEventsActor(req), req.params.id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.put(
  '/:id/schedules',
  requirePermission(STAFF_PERMISSIONS.EVENT_EDIT),
  (req, res) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const data = eventsService.replaceEventSchedules(toEventsActor(req), req.params.id, items);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.put(
  '/:id/speakers',
  requirePermission(STAFF_PERMISSIONS.EVENT_EDIT),
  (req, res) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const data = eventsService.replaceEventSpeakers(toEventsActor(req), req.params.id, items);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/submit',
  requirePermission(STAFF_PERMISSIONS.EVENT_SUBMIT),
  (req, res) => {
    try {
      const data = eventsService.submitEvent(toEventsActor(req), req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/approve',
  requirePermission(STAFF_PERMISSIONS.EVENT_APPROVE),
  (req, res) => {
    try {
      const data = eventsService.approveEvent(toEventsActor(req), req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/publish',
  requirePermission(STAFF_PERMISSIONS.EVENT_PUBLISH),
  (req, res) => {
    try {
      const data = eventsService.publishEvent(toEventsActor(req), req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/cancel',
  requirePermission(STAFF_PERMISSIONS.EVENT_CANCEL),
  (req, res) => {
    try {
      const data = eventsService.cancelEvent(toEventsActor(req), req.params.id, req.body?.reason);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/registrations',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_VIEW),
  (req, res) => {
    try {
      const data = eventsService.listEventRegistrations(req.params.id, {
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/registrations',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_CREATE),
  (req, res) => {
    try {
      const data = eventsService.addStaffRegistration(toEventsActor(req), req.params.id, req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/registrations/bulk',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_CREATE),
  (req, res) => {
    try {
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
      const data = eventsService.bulkRegisterParticipants(toEventsActor(req), req.params.id, rows);
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/attendance',
  requirePermission(STAFF_PERMISSIONS.EVENT_ATTENDANCE_VIEW),
  (req, res) => {
    try {
      const data = eventsService.getEventAttendanceSummary(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/payments',
  requirePermission(STAFF_PERMISSIONS.EVENT_PAYMENT_VIEW),
  (req, res) => {
    try {
      res.json({ success: true, data: eventsService.listEventPayments(req.params.id) });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/invitations',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (req, res) => {
    try {
      res.json({ success: true, data: eventsService.listEventInvitations(req.params.id) });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/invitations',
  requirePermission(STAFF_PERMISSIONS.EVENT_INVITATION_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.createEventInvitation(toEventsActor(req), req.params.id, req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/certificates',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (req, res) => {
    try {
      res.json({ success: true, data: eventsService.listEventCertificates(req.params.id) });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/certificates/generate',
  requirePermission(STAFF_PERMISSIONS.EVENT_CERTIFICATE_MANAGE),
  (req, res) => {
    try {
      const onlyCheckedIn = req.body?.onlyCheckedIn !== false;
      const data = eventsService.generateCertificatesForEvent(
        toEventsActor(req),
        req.params.id,
        onlyCheckedIn
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/feedback',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (req, res) => {
    try {
      res.json({ success: true, data: eventsService.listEventFeedback(req.params.id) });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/media',
  requirePermission(STAFF_PERMISSIONS.EVENT_VIEW),
  (req, res) => {
    try {
      res.json({ success: true, data: eventsService.listEventMedia(req.params.id) });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/media',
  requirePermission(STAFF_PERMISSIONS.EVENT_MEDIA_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.createEventMedia(toEventsActor(req), req.params.id, req.body || {});
      res.status(201).json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/audit',
  requirePermission(STAFF_PERMISSIONS.EVENT_AUDIT_VIEW),
  (req, res) => {
    try {
      const detail = eventsService.getStaffEventDetail(req.params.id);
      res.json({ success: true, data: detail.auditLogs });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.post(
  '/:id/notifications',
  requirePermission(STAFF_PERMISSIONS.EVENT_NOTIFICATION_MANAGE),
  (req, res) => {
    try {
      const data = eventsService.sendEventAnnouncement(
        toEventsActor(req),
        req.params.id,
        req.body || {}
      );
      res.json({ success: true, data });
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

staffEventsRoutes.get(
  '/:id/export',
  requirePermission(STAFF_PERMISSIONS.EVENT_REGISTRATION_EXPORT),
  (req, res) => {
    try {
      const { fileName, csv } = eventsService.exportEventRegistrationsCsv(req.params.id);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csv);
    } catch (err) {
      handleEventsError(res, err);
    }
  }
);

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getDb, saveDb, type PortalDatabase } from '../server/data/store.ts';
import {
  ROLE_TO_STAFF_PERMISSIONS,
  STAFF_PERMISSIONS,
} from '../server/modules/staff/staff.permissions.ts';
import {
  EventsHttpError,
  eventsService,
  type EventsActor,
} from '../server/modules/events/events.service.ts';
import { STAFF_ACCOUNTS } from '../src/config/staff-navigation.ts';
import EventsPage from '../src/website/events/EventsPage.tsx';
import EventDetailPage from '../src/website/events/EventDetailPage.tsx';
import EventRegistrationPage from '../src/website/events/EventRegistrationPage.tsx';
import EventRegistrationConfirmationPage from '../src/website/events/EventRegistrationConfirmationPage.tsx';
import StaffEventsWorkspace from '../src/modules/staff/events/StaffEventsWorkspace.tsx';

let dbSnapshot: PortalDatabase | null = null;

test.before(() => {
  dbSnapshot = structuredClone(getDb());
});

test.after(() => {
  if (dbSnapshot) {
    saveDb(dbSnapshot);
  }
});

const COMMS_ACTOR: EventsActor = {
  id: 'usr-comms-001',
  fullName: 'N. Muthoni',
  role: 'COMMUNICATIONS_OFFICER',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.COMMUNICATIONS_OFFICER],
};

const PRINCIPAL_ACTOR: EventsActor = {
  id: 'usr-principal-001',
  fullName: 'Dr. Samuel Karanja',
  role: 'PRINCIPAL',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.PRINCIPAL],
};

const RECEPTIONIST_ACTOR: EventsActor = {
  id: 'usr-rec-001',
  fullName: 'S. Akinyi',
  role: 'RECEPTIONIST',
  permissions: [...ROLE_TO_STAFF_PERMISSIONS.RECEPTIONIST],
};

test('Public events listing excludes unpublished drafts & supports filtering', () => {
  const allPublic = eventsService.listPublicEvents();
  assert.ok(allPublic.length >= 5, 'Should return seeded published events');
  assert.equal(
    allPublic.some((e) => e.id === 'evt-alumni-founders-draft'),
    false,
    'Unpublished PENDING_APPROVAL event must never leak to public list'
  );

  const onlineOnly = eventsService.listPublicEvents({ mode: 'ONLINE' });
  assert.ok(onlineOnly.length >= 1);
  assert.ok(onlineOnly.every((e) => e.mode === 'ONLINE'));

  const paidOnly = eventsService.listPublicEvents({ feeFilter: 'PAID' });
  assert.ok(paidOnly.length >= 1);
  assert.ok(paidOnly.every((e) => e.isPaid && e.feeAmount > 0));

  const todayOnly = eventsService.listPublicEvents({ dateFilter: 'TODAY' });
  assert.ok(todayOnly.some((e) => e.id === 'evt-cyber-career-clinic'));
});

test('Public registration validates duplicates, restricted audience, token security, and waitlist promotion', () => {
  // Duplicate email rejection
  assert.throws(
    () =>
      eventsService.registerForPublicEvent('evt-ai-symposium-2026', {
        fullName: 'Duplicate User',
        email: 'amina.wanjiku@student.hitech.ac.ke',
        phone: '+254711000222',
        participantCategory: 'Student',
        attendanceMode: 'PHYSICAL',
        consentAccepted: true,
      }),
    (err: unknown) => err instanceof EventsHttpError && err.statusCode === 409
  );

  // Restricted STUDENTS_ONLY rejection without valid HCA/STU number
  assert.throws(
    () =>
      eventsService.registerForPublicEvent('evt-graduation-2026', {
        fullName: 'Outside Visitor',
        email: 'outside.visitor@example.com',
        phone: '+254711000333',
        participantCategory: 'General Public',
        studentOrStaffNumber: '',
        attendanceMode: 'PHYSICAL',
        consentAccepted: true,
      }),
    (err: unknown) => err instanceof EventsHttpError && err.statusCode === 403
  );

  // Create tiny 1-seat event, approve + publish, test capacity -> waitlist -> auto promotion on cancel
  const futureDate = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  const created = eventsService.createStaffEvent(COMMS_ACTOR, {
    title: 'Small Capacity Robotics Lab Clinic',
    category: 'Workshop & Training',
    shortDescription: 'Intensive 1-seat test lab',
    fullDescription: 'Hands-on test clinic',
    eventDate: futureDate,
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    venue: 'Lab R1',
    mode: 'PHYSICAL',
    capacity: 1,
    allowWaitlist: true,
    allowSelfCancel: true,
    requiresApproval: false,
    registrationDeadline: `${futureDate}T09:00:00.000Z`,
  });

  // Separation of duties check: creator cannot self-approve
  assert.throws(
    () => eventsService.approveEvent(COMMS_ACTOR, created.id),
    (err: unknown) => err instanceof EventsHttpError && err.statusCode === 403
  );

  eventsService.submitEvent(COMMS_ACTOR, created.id);
  eventsService.approveEvent(PRINCIPAL_ACTOR, created.id);
  eventsService.publishEvent(COMMS_ACTOR, created.id);

  // Register first seat -> CONFIRMED
  const reg1 = eventsService.registerForPublicEvent(created.id, {
    fullName: 'First Seat',
    email: 'first.seat@example.com',
    phone: '+254701001001',
    participantCategory: 'Student',
    attendanceMode: 'PHYSICAL',
    consentAccepted: true,
  });
  assert.equal(reg1.registration.status, 'CONFIRMED');
  assert.match(reg1.registration.registrationNumber, /^HTE-EVT-\d{4}-\d{4}$/);
  assert.match(reg1.registration.qrToken, /^HTE-QR-/);

  // Token security check
  assert.throws(
    () => eventsService.getPublicRegistrationByToken(reg1.registration.id, ''),
    (err: unknown) => err instanceof EventsHttpError && err.statusCode === 401
  );
  assert.throws(
    () => eventsService.getPublicRegistrationByToken(reg1.registration.id, 'WRONG-TOKEN'),
    (err: unknown) => err instanceof EventsHttpError && err.statusCode === 403
  );
  const loadedTicket = eventsService.getPublicRegistrationByToken(
    reg1.registration.id,
    reg1.lookupToken
  );
  assert.equal(loadedTicket.registrationNumber, reg1.registration.registrationNumber);

  // Second registration hits capacity -> WAITLISTED
  const reg2 = eventsService.registerForPublicEvent(created.id, {
    fullName: 'Second Seat Waitlist',
    email: 'second.seat@example.com',
    phone: '+254701001002',
    participantCategory: 'Student',
    attendanceMode: 'PHYSICAL',
    consentAccepted: true,
  });
  assert.equal(reg2.registration.status, 'WAITLISTED');

  // Cancel first registration -> second registration automatically promoted to CONFIRMED
  const cancelRes = eventsService.cancelPublicRegistration(
    reg1.registration.id,
    reg1.lookupToken,
    'Unable to attend'
  );
  assert.equal(cancelRes.ticket.status, 'CANCELLED');
  assert.equal(cancelRes.promotedRegistrationNumber, reg2.registration.registrationNumber);

  const promotedTicket = eventsService.getPublicRegistrationByToken(
    reg2.registration.id,
    reg2.lookupToken
  );
  assert.equal(promotedTicket.status, 'CONFIRMED');

  // Check-In via QR token works once and blocks duplicate check-in
  const checkIn = eventsService.checkInParticipant(RECEPTIONIST_ACTOR, {
    qrToken: reg2.registration.qrToken,
    eventId: created.id,
  });
  assert.equal(checkIn.registration.checkedIn, true);

  assert.throws(
    () =>
      eventsService.checkInParticipant(RECEPTIONIST_ACTOR, {
        qrToken: reg2.registration.qrToken,
        eventId: created.id,
      }),
    (err: unknown) => err instanceof EventsHttpError && err.statusCode === 409
  );
});

test('CSV export neutralizes spreadsheet formula injection', () => {
  const created = eventsService.createStaffEvent(COMMS_ACTOR, {
    title: 'CSV Safety Audit Event',
    category: 'Seminar',
    shortDescription: 'CSV check',
    fullDescription: 'CSV check',
    eventDate: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    startTime: '09:00 AM',
    endTime: '11:00 AM',
    venue: 'Hall B',
    mode: 'PHYSICAL',
    capacity: 20,
    registrationDeadline: new Date(Date.now() + 24 * 86400000).toISOString(),
  });
  eventsService.approveEvent(PRINCIPAL_ACTOR, created.id);
  eventsService.publishEvent(COMMS_ACTOR, created.id);

  eventsService.registerForPublicEvent(created.id, {
    fullName: '=cmd|"/C calc"!A0',
    email: 'formula.safe@example.com',
    phone: '+254712999888',
    participantCategory: 'General Public',
    attendanceMode: 'PHYSICAL',
    consentAccepted: true,
  });

  const { csv } = eventsService.exportEventRegistrationsCsv(created.id);
  assert.ok(csv.includes("'=cmd|"), 'CSV must prefix dangerous leading formula characters');
});

test('RBAC role assignments & SSR UI rendering contain zero animate-pulse or inline styles', () => {
  assert.ok(ROLE_TO_STAFF_PERMISSIONS.COMMUNICATIONS_OFFICER.includes(STAFF_PERMISSIONS.EVENT_PUBLISH));
  assert.ok(!ROLE_TO_STAFF_PERMISSIONS.COMMUNICATIONS_OFFICER.includes(STAFF_PERMISSIONS.EVENT_APPROVE));
  assert.ok(ROLE_TO_STAFF_PERMISSIONS.RECEPTIONIST.includes(STAFF_PERMISSIONS.EVENT_CHECKIN));
  assert.ok(!ROLE_TO_STAFF_PERMISSIONS.RECEPTIONIST.includes(STAFF_PERMISSIONS.EVENT_PUBLISH));

  const renders = [
    renderToStaticMarkup(
      React.createElement(EventsPage, {
        onSelectEvent: () => {},
        onRegisterEvent: () => {},
      })
    ),
    renderToStaticMarkup(
      React.createElement(EventDetailPage, {
        slug: 'hi-tech-innovation-ai-symposium-2026',
        onBackToEvents: () => {},
        onRegisterEvent: () => {},
      })
    ),
    renderToStaticMarkup(
      React.createElement(EventRegistrationPage, {
        eventId: 'evt-ai-symposium-2026',
        onBackToEvent: () => {},
        onBackToEvents: () => {},
        onRegistrationSuccess: () => {},
      })
    ),
    renderToStaticMarkup(
      React.createElement(EventRegistrationConfirmationPage, {
        registrationId: 'ereg-seed-001',
        initialToken: 'HTE-TKT-DEMO-0001',
        onBackToEvents: () => {},
        onSelectEvent: () => {},
      })
    ),
    renderToStaticMarkup(
      React.createElement(StaffEventsWorkspace, {
        user: STAFF_ACCOUNTS.COMMUNICATIONS_OFFICER,
      })
    ),
  ];

  for (const html of renders) {
    assert.ok(html.length > 50, 'Rendered HTML should be non-empty');
    assert.equal(html.includes('animate-pulse'), false, 'Forbidden animate-pulse found in SSR HTML');
    assert.equal(html.includes('style="'), false, 'Forbidden inline style found in SSR HTML');
  }
});

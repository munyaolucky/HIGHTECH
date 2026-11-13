import {
  AnnouncementAudience,
  BedStatus,
  Hostel,
  HostelAllocation,
  HostelAnnouncement,
  HostelApplication,
  HostelBed,
  HostelCharge,
  HostelMaintenanceRequest,
  HostelOperatorRole,
  HostelRoom,
  HostelVisitor,
  OccupancyPolicy,
  StudentServiceRequest,
  SupportRequestCategory,
  SupportRequestStatus,
} from '../types/hostels';

const STORAGE_KEY = 'hitech_hostels_services_v1';

interface HostelsState {
  hostels: Hostel[];
  rooms: HostelRoom[];
  beds: HostelBed[];
  applications: HostelApplication[];
  allocations: HostelAllocation[];
  maintenance: HostelMaintenanceRequest[];
  visitors: HostelVisitor[];
  charges: HostelCharge[];
  supportRequests: StudentServiceRequest[];
  announcements: HostelAnnouncement[];
  auditLog: { id: string; actor: string; action: string; timestamp: string }[];
}

export function getNairobiTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

const INITIAL_STATE: HostelsState = {
  hostels: [
    {
      id: 'hst-nyayo',
      code: 'HST-NRB-01',
      name: 'Nyayo Innovation Hall',
      branch: 'Nairobi Main Campus',
      occupancyPolicy: 'DESIGNATED_STUDENT_GROUP',
      shortDescription: 'Quiet study wing near Nairobi CBD labs with 24/7 fibre Wi-Fi and CCTV.',
      wardenName: 'Mr. Peter Kariuki',
      active: true,
    },
    {
      id: 'hst-westlands',
      code: 'HST-WST-01',
      name: 'Parklands Scholars Residence',
      branch: 'Westlands Technology Park Campus',
      occupancyPolicy: 'ACCESSIBILITY_FOCUSED',
      shortDescription: 'Step-free accessible residence adjacent to the AI & Innovation Hub.',
      wardenName: 'Ms. Grace Wanjiru',
      active: true,
    },
    {
      id: 'hst-staff',
      code: 'HST-STF-01',
      name: 'Senior Visiting Faculty Annex',
      branch: 'Nairobi Main Campus',
      occupancyPolicy: 'STAFF_ONLY',
      shortDescription: 'Restricted staff quarters for visiting trainers and examiners.',
      wardenName: 'HR Facilities Desk',
      active: true,
    },
  ],
  rooms: [
    { id: 'rm-101', hostelId: 'hst-nyayo', roomCode: 'A-101', floor: 'Floor 1', capacity: 2 },
    { id: 'rm-102', hostelId: 'hst-nyayo', roomCode: 'A-102', floor: 'Floor 1', capacity: 2 },
    { id: 'rm-201', hostelId: 'hst-westlands', roomCode: 'W-201', floor: 'Floor 2', capacity: 2 },
    { id: 'rm-s01', hostelId: 'hst-staff', roomCode: 'S-01', floor: 'Ground', capacity: 1 },
  ],
  beds: [
    { id: 'bed-101a', hostelId: 'hst-nyayo', roomId: 'rm-101', bedCode: 'A-101-B1', status: 'OCCUPIED' },
    { id: 'bed-101b', hostelId: 'hst-nyayo', roomId: 'rm-101', bedCode: 'A-101-B2', status: 'AVAILABLE' },
    { id: 'bed-102a', hostelId: 'hst-nyayo', roomId: 'rm-102', bedCode: 'A-102-B1', status: 'RESERVED' },
    { id: 'bed-102b', hostelId: 'hst-nyayo', roomId: 'rm-102', bedCode: 'A-102-B2', status: 'AVAILABLE' },
    { id: 'bed-201a', hostelId: 'hst-westlands', roomId: 'rm-201', bedCode: 'W-201-B1', status: 'AVAILABLE' },
    { id: 'bed-201b', hostelId: 'hst-westlands', roomId: 'rm-201', bedCode: 'W-201-B2', status: 'MAINTENANCE' },
    { id: 'bed-s01a', hostelId: 'hst-staff', roomId: 'rm-s01', bedCode: 'S-01-B1', status: 'AVAILABLE' },
  ],
  applications: [
    {
      id: 'happ-1',
      reference: 'HAPP-2026-011',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      branch: 'Nairobi Main Campus',
      hostelId: 'hst-nyayo',
      startDate: '2026-01-10',
      endDate: '2026-12-20',
      reason: 'Full-year DICT Level 6 lab residency',
      status: 'ALLOCATED',
      reviewedBy: 'Hostel Officer (J. Mutua)',
      createdAt: '2026-01-05T08:30:00Z',
    },
    {
      id: 'happ-2',
      reference: 'HAPP-2026-019',
      studentRegNo: 'HCA/STU/2026/014',
      studentName: 'Faith Chebet Korir',
      branch: 'Nairobi Main Campus',
      hostelId: 'hst-nyayo',
      startDate: '2026-05-01',
      endDate: '2026-12-18',
      reason: 'Trimester 2/3 evening & Saturday lab sessions',
      status: 'APPROVED',
      reviewedBy: 'Hostel Officer (J. Mutua)',
      createdAt: '2026-04-12T10:15:00Z',
    },
  ],
  allocations: [
    {
      id: 'halloc-1',
      applicationId: 'happ-1',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      hostelId: 'hst-nyayo',
      roomId: 'rm-101',
      bedId: 'bed-101a',
      startDate: '2026-01-10',
      endDate: '2026-12-20',
      status: 'CHECKED_IN',
      checkedInBy: 'Hostel Officer (J. Mutua)',
      checkedInAt: '2026-01-10T11:20:00Z',
    },
    {
      id: 'halloc-2',
      applicationId: 'happ-3',
      studentRegNo: 'HCA/STU/2026/022',
      studentName: 'Samuel Mwangi Njoroge',
      hostelId: 'hst-nyayo',
      roomId: 'rm-102',
      bedId: 'bed-102a',
      startDate: '2026-05-01',
      endDate: '2026-12-20',
      status: 'RESERVED',
    },
  ],
  maintenance: [
    {
      id: 'hmnt-1',
      reference: 'MNT-2026-004',
      hostelId: 'hst-westlands',
      roomId: 'rm-201',
      bedId: 'bed-201b',
      reportedByRegNo: 'STAFF-WST',
      reportedByName: 'Warden Grace Wanjiru',
      issueTitle: 'Adjustable desk lamp & reading socket replacement',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      createdAt: '2026-10-20T09:00:00Z',
    },
  ],
  visitors: [
    {
      id: 'hvis-1',
      hostelId: 'hst-nyayo',
      allocationId: 'halloc-1',
      residentRegNo: 'HCA/STU/2026/001',
      residentName: 'Brian Omondi Otieno',
      visitorName: 'Mary Achieng Otieno',
      visitorIdNo: 'ID-29844120',
      expectedDate: getNairobiTodayDate(),
      purpose: 'Parent weekend check-in & study supplies drop-off',
      status: 'EXPECTED',
    },
  ],
  charges: [
    {
      id: 'hchg-1',
      chargeRef: 'HCHG-2026-010',
      allocationId: 'halloc-1',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      description: 'Nyayo Innovation Hall — Term 3 Accommodation Fee',
      amount: 14500,
      currency: 'KES',
      status: 'DRAFT',
      createdByActorId: 'actor-hostel-1',
      createdByName: 'Hostel Officer (J. Mutua)',
      createdAt: '2026-10-25T14:00:00Z',
    },
  ],
  supportRequests: [
    {
      id: 'wsr-1',
      caseRef: 'WEL-2026-041',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      branch: 'Nairobi Main Campus',
      category: 'COUNSELLING',
      restricted: true,
      subject: 'Confidential wellness counselling check-in',
      description: 'Requesting a private session with campus counsellor regarding exam workload anxiety.',
      status: 'OPEN',
      updates: [],
      createdAt: '2026-11-01T10:15:00Z',
    },
    {
      id: 'wsr-2',
      caseRef: 'WEL-2026-038',
      studentRegNo: 'HCA/STU/2026/014',
      studentName: 'Faith Chebet Korir',
      branch: 'Nairobi Main Campus',
      category: 'ACCOMMODATION_WELFARE',
      restricted: false,
      subject: 'Late lab shuttle escort pass inquiry',
      description: 'Requesting security escort schedule information after 8pm Cisco practicals.',
      status: 'ASSIGNED',
      assignedToActorId: 'actor-welfare-1',
      assignedToName: 'Student Services Officer (L. Wambui)',
      updates: [
        {
          id: 'wupd-1',
          author: 'Student Services Officer (L. Wambui)',
          note: 'Security desk walk-safe escort hours confirmed: 7:30 PM – 10:00 PM daily.',
          createdAt: '2026-10-28T13:10:00Z',
        },
      ],
      createdAt: '2026-10-28T09:00:00Z',
    },
  ],
  announcements: [
    {
      id: 'hann-1',
      title: 'Nyayo Innovation Hall Fibre Maintenance Window',
      body: 'Scheduled router upgrade on Saturday 06:00–07:00 EAT. Backup study lounge remains open.',
      branch: 'Nairobi Main Campus',
      hostelId: 'hst-nyayo',
      audience: 'HOSTEL_RESIDENTS',
      active: true,
      publishedBy: 'Hostel Officer (J. Mutua)',
      publishedAt: '2026-10-30T08:00:00Z',
    },
    {
      id: 'hann-2',
      title: 'Nairobi Campus Wellness Drop-In Hours',
      body: 'Student counselling & health referral desk open Mon–Fri 08:30–16:30 EAT at Block B.',
      branch: 'Nairobi Main Campus',
      audience: 'ALL_STUDENTS',
      active: true,
      publishedBy: 'Student Services Officer (L. Wambui)',
      publishedAt: '2026-10-24T09:00:00Z',
    },
  ],
  auditLog: [
    {
      id: 'haud-1',
      actor: 'Hostel Officer (J. Mutua)',
      action: 'Created accommodation charge draft HCHG-2026-010 (pending independent Finance approval).',
      timestamp: '2026-10-25T14:00:00Z',
    },
  ],
};

function loadState(): HostelsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as HostelsState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: HostelsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function appendAudit(state: HostelsState, actor: string, action: string) {
  state.auditLog.unshift({
    id: `haud-${Date.now()}`,
    actor,
    action,
    timestamp: new Date().toISOString(),
  });
}

export const hostelsService = {
  getState(): HostelsState {
    return loadState();
  },

  /** Student-facing catalogue excludes STAFF_ONLY residences and sensitive operational fields */
  getHostelsForRole(role: HostelOperatorRole): Hostel[] {
    const state = loadState();
    if (role === 'STUDENT') {
      return state.hostels.filter((h) => h.active && h.occupancyPolicy !== 'STAFF_ONLY');
    }
    return state.hostels;
  },

  createHostel(input: {
    code: string;
    name: string;
    branch: string;
    occupancyPolicy: OccupancyPolicy;
    shortDescription: string;
    wardenName: string;
    actor: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    if (state.hostels.some((h) => h.code.toLowerCase() === input.code.trim().toLowerCase())) {
      return { ok: false, error: 'Hostel code must be unique.' };
    }
    const hostel: Hostel = {
      id: `hst-${Date.now()}`,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      branch: input.branch,
      occupancyPolicy: input.occupancyPolicy,
      shortDescription: input.shortDescription.trim(),
      wardenName: input.wardenName.trim(),
      active: true,
    };
    state.hostels.push(hostel);
    appendAudit(state, input.actor, `Registered residence ${hostel.code} (${hostel.occupancyPolicy}).`);
    saveState(state);
    return { ok: true };
  },

  addRoomAndBed(input: {
    hostelId: string;
    roomCode: string;
    floor: string;
    bedCode: string;
    actor: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    let room = state.rooms.find(
      (r) => r.hostelId === input.hostelId && r.roomCode.toLowerCase() === input.roomCode.trim().toLowerCase()
    );
    if (!room) {
      room = {
        id: `rm-${Date.now()}`,
        hostelId: input.hostelId,
        roomCode: input.roomCode.trim().toUpperCase(),
        floor: input.floor.trim() || 'Floor 1',
        capacity: 1,
      };
      state.rooms.push(room);
    }
    if (
      state.beds.some(
        (b) => b.roomId === room!.id && b.bedCode.toLowerCase() === input.bedCode.trim().toLowerCase()
      )
    ) {
      return { ok: false, error: 'Duplicate bed code inside the selected room is rejected.' };
    }
    state.beds.push({
      id: `bed-${Date.now()}`,
      hostelId: input.hostelId,
      roomId: room.id,
      bedCode: input.bedCode.trim().toUpperCase(),
      status: 'AVAILABLE',
    });
    room.capacity = state.beds.filter((b) => b.roomId === room!.id).length;
    appendAudit(state, input.actor, `Added bed ${input.bedCode.toUpperCase()} in room ${room.roomCode}.`);
    saveState(state);
    return { ok: true };
  },

  updateBedStatus(bedId: string, nextStatus: BedStatus, actor: string): { ok: boolean; error?: string } {
    const state = loadState();
    const bed = state.beds.find((b) => b.id === bedId);
    if (!bed) return { ok: false, error: 'Bed not found.' };
    if (nextStatus === 'MAINTENANCE' || nextStatus === 'OUT_OF_SERVICE') {
      const conflict = state.allocations.find(
        (a) => a.bedId === bedId && (a.status === 'RESERVED' || a.status === 'CHECKED_IN')
      );
      if (conflict) {
        return {
          ok: false,
          error: `Cannot set ${bed.bedCode} to ${nextStatus}: conflicts with active/reserved allocation for ${conflict.studentRegNo}.`,
        };
      }
    }
    bed.status = nextStatus;
    appendAudit(state, actor, `Updated bed ${bed.bedCode} status to ${nextStatus}.`);
    saveState(state);
    return { ok: true };
  },

  submitApplication(input: {
    studentRegNo: string;
    studentName: string;
    branch: string;
    hostelId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const hostel = state.hostels.find((h) => h.id === input.hostelId);
    if (!hostel || !hostel.active) return { ok: false, error: 'Selected residence is inactive or missing.' };
    if (hostel.occupancyPolicy === 'STAFF_ONLY') {
      return { ok: false, error: 'STAFF_ONLY residences cannot be selected for student applications.' };
    }
    if (!input.startDate || !input.endDate || input.startDate > input.endDate) {
      return { ok: false, error: 'Start date must be on or before end date.' };
    }
    const app: HostelApplication = {
      id: `happ-${Date.now()}`,
      reference: `HAPP-2026-${String(state.applications.length + 21).padStart(3, '0')}`,
      studentRegNo: input.studentRegNo,
      studentName: input.studentName,
      branch: input.branch,
      hostelId: input.hostelId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason.trim(),
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    state.applications.unshift(app);
    appendAudit(state, input.studentRegNo, `Submitted accommodation application ${app.reference}.`);
    saveState(state);
    return { ok: true };
  },

  reviewApplication(
    applicationId: string,
    decision: 'APPROVED' | 'WAITLISTED' | 'REJECTED',
    actor: string,
    reviewNote: string
  ): { ok: boolean; error?: string } {
    const state = loadState();
    const app = state.applications.find((a) => a.id === applicationId);
    if (!app) return { ok: false, error: 'Application not found.' };
    app.status = decision;
    app.reviewedBy = actor;
    app.reviewNote = reviewNote.trim();
    appendAudit(state, actor, `Marked application ${app.reference} as ${decision}.`);
    saveState(state);
    return { ok: true };
  },

  allocateBed(input: {
    applicationId: string;
    bedId: string;
    startDate: string;
    endDate: string;
    actor: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const app = state.applications.find((a) => a.id === input.applicationId);
    if (!app) return { ok: false, error: 'Application not found.' };
    if (app.status !== 'APPROVED') {
      return { ok: false, error: 'Only APPROVED applications may be allocated a bed.' };
    }
    const bed = state.beds.find((b) => b.id === input.bedId);
    if (!bed) return { ok: false, error: 'Bed not found.' };
    const hostel = state.hostels.find((h) => h.id === bed.hostelId);
    if (!hostel || hostel.occupancyPolicy === 'STAFF_ONLY') {
      return { ok: false, error: 'Cannot allocate a STAFF_ONLY bed to a student application.' };
    }
    if (bed.status === 'MAINTENANCE' || bed.status === 'OUT_OF_SERVICE') {
      return { ok: false, error: `Bed ${bed.bedCode} is not serviceable (${bed.status}).` };
    }
    if (input.startDate > input.endDate) {
      return { ok: false, error: 'Allocation date range is invalid.' };
    }

    // Overlap check on bed and student (inclusive)
    const bedOverlap = state.allocations.find(
      (al) =>
        al.bedId === bed.id &&
        al.status !== 'CANCELLED' &&
        al.status !== 'CHECKED_OUT' &&
        datesOverlap(al.startDate, al.endDate, input.startDate, input.endDate)
    );
    if (bedOverlap) {
      return {
        ok: false,
        error: `Overlap conflict: Bed ${bed.bedCode} is already allocated (${bedOverlap.startDate} to ${bedOverlap.endDate}).`,
      };
    }

    const studentOverlap = state.allocations.find(
      (al) =>
        al.studentRegNo === app.studentRegNo &&
        al.status !== 'CANCELLED' &&
        al.status !== 'CHECKED_OUT' &&
        datesOverlap(al.startDate, al.endDate, input.startDate, input.endDate)
    );
    if (studentOverlap) {
      return {
        ok: false,
        error: `Overlap conflict: Student ${app.studentRegNo} already holds an active/reserved bed during those dates.`,
      };
    }

    const allocation: HostelAllocation = {
      id: `halloc-${Date.now()}`,
      applicationId: app.id,
      studentRegNo: app.studentRegNo,
      studentName: app.studentName,
      hostelId: bed.hostelId,
      roomId: bed.roomId,
      bedId: bed.id,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'RESERVED',
    };
    state.allocations.unshift(allocation);
    app.status = 'ALLOCATED';
    bed.status = 'RESERVED';
    appendAudit(
      state,
      input.actor,
      `Allocated bed ${bed.bedCode} to ${app.studentRegNo} (${input.startDate} to ${input.endDate}).`
    );
    saveState(state);
    return { ok: true };
  },

  checkInAllocation(allocationId: string, actor: string): { ok: boolean; error?: string } {
    const state = loadState();
    const alloc = state.allocations.find((a) => a.id === allocationId);
    if (!alloc) return { ok: false, error: 'Allocation not found.' };
    const today = getNairobiTodayDate();
    if (today < alloc.startDate) {
      return {
        ok: false,
        error: `Check-in blocked until stay start date (${alloc.startDate}, Africa/Nairobi).`,
      };
    }
    if (today > alloc.endDate) {
      return { ok: false, error: 'Stay window has expired.' };
    }
    const bed = state.beds.find((b) => b.id === alloc.bedId);
    if (bed?.status === 'OCCUPIED') {
      return { ok: false, error: 'Bed currently has another active resident checked in.' };
    }
    alloc.status = 'CHECKED_IN';
    alloc.checkedInBy = actor;
    alloc.checkedInAt = new Date().toISOString();
    if (bed) bed.status = 'OCCUPIED';
    appendAudit(state, actor, `Checked in ${alloc.studentRegNo} to bed ${bed?.bedCode ?? alloc.bedId}.`);
    saveState(state);
    return { ok: true };
  },

  checkOutAllocation(allocationId: string, actor: string): { ok: boolean; error?: string } {
    const state = loadState();
    const alloc = state.allocations.find((a) => a.id === allocationId);
    if (!alloc || alloc.status !== 'CHECKED_IN') {
      return { ok: false, error: 'Only CHECKED_IN allocations can check out.' };
    }
    alloc.status = 'CHECKED_OUT';
    alloc.checkedOutBy = actor;
    alloc.checkedOutAt = new Date().toISOString();

    const bed = state.beds.find((b) => b.id === alloc.bedId);
    if (bed) {
      const hasUpcoming = state.allocations.some(
        (other) => other.id !== alloc.id && other.bedId === bed.id && other.status === 'RESERVED'
      );
      bed.status = hasUpcoming ? 'RESERVED' : 'AVAILABLE';
    }
    appendAudit(state, actor, `Checked out ${alloc.studentRegNo}; preserved upcoming reservation if any.`);
    saveState(state);
    return { ok: true };
  },

  reportMaintenance(input: {
    studentRegNo: string;
    studentName: string;
    issueTitle: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    isStaff: boolean;
    hostelId?: string;
    roomId?: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    let hostelId = input.hostelId;
    let roomId = input.roomId;
    let bedId: string | undefined;

    if (!input.isStaff) {
      const activeAlloc = state.allocations.find(
        (a) =>
          a.studentRegNo === input.studentRegNo &&
          (a.status === 'CHECKED_IN' || a.status === 'RESERVED')
      );
      if (!activeAlloc) {
        return {
          ok: false,
          error: 'Students can only submit maintenance for a room/bed where they hold a current allocation.',
        };
      }
      hostelId = activeAlloc.hostelId;
      roomId = activeAlloc.roomId;
      bedId = activeAlloc.bedId;
    }

    if (!hostelId || !roomId) return { ok: false, error: 'Select a hostel and room.' };

    state.maintenance.unshift({
      id: `hmnt-${Date.now()}`,
      reference: `MNT-2026-${String(state.maintenance.length + 10).padStart(3, '0')}`,
      hostelId,
      roomId,
      bedId,
      reportedByRegNo: input.studentRegNo,
      reportedByName: input.studentName,
      issueTitle: input.issueTitle.trim(),
      priority: input.priority,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    });
    appendAudit(state, input.studentName, `Submitted maintenance ticket: ${input.issueTitle.trim()}`);
    saveState(state);
    return { ok: true };
  },

  registerVisitor(input: {
    residentRegNo: string;
    visitorName: string;
    visitorIdNo: string;
    expectedDate: string;
    purpose: string;
    actor: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const alloc = state.allocations.find(
      (a) =>
        a.studentRegNo === input.residentRegNo &&
        (a.status === 'CHECKED_IN' || a.status === 'RESERVED') &&
        input.expectedDate >= a.startDate &&
        input.expectedDate <= a.endDate
    );
    if (!alloc) {
      return {
        ok: false,
        error: 'Resident has no active allocation covering the expected visit date.',
      };
    }
    state.visitors.unshift({
      id: `hvis-${Date.now()}`,
      hostelId: alloc.hostelId,
      allocationId: alloc.id,
      residentRegNo: alloc.studentRegNo,
      residentName: alloc.studentName,
      visitorName: input.visitorName.trim(),
      visitorIdNo: input.visitorIdNo.trim(),
      expectedDate: input.expectedDate,
      purpose: input.purpose.trim(),
      status: 'EXPECTED',
    });
    appendAudit(state, input.actor, `Registered visitor ${input.visitorName.trim()} for ${alloc.studentRegNo}.`);
    saveState(state);
    return { ok: true };
  },

  transitionVisitor(visitorId: string, next: 'CHECKED_IN' | 'CHECKED_OUT', actor: string): { ok: boolean; error?: string } {
    const state = loadState();
    const vis = state.visitors.find((v) => v.id === visitorId);
    if (!vis) return { ok: false, error: 'Visitor not found.' };
    if (next === 'CHECKED_IN' && vis.status !== 'EXPECTED') {
      return { ok: false, error: 'Only EXPECTED visitors can be checked in.' };
    }
    if (next === 'CHECKED_OUT' && vis.status !== 'CHECKED_IN') {
      return { ok: false, error: 'Only CHECKED_IN visitors can be checked out.' };
    }
    vis.status = next;
    if (next === 'CHECKED_IN') vis.checkedInAt = new Date().toISOString();
    if (next === 'CHECKED_OUT') vis.checkedOutAt = new Date().toISOString();
    appendAudit(state, actor, `Visitor ${vis.visitorName} marked ${next}.`);
    saveState(state);
    return { ok: true };
  },

  createDraftCharge(input: {
    allocationId: string;
    description: string;
    amount: number;
    actorId: string;
    actorName: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const alloc = state.allocations.find((a) => a.id === input.allocationId);
    if (!alloc) return { ok: false, error: 'Allocation not found.' };
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, error: 'Charge amount must be greater than zero.' };
    }
    const charge: HostelCharge = {
      id: `hchg-${Date.now()}`,
      chargeRef: `HCHG-2026-${String(state.charges.length + 11).padStart(3, '0')}`,
      allocationId: alloc.id,
      studentRegNo: alloc.studentRegNo,
      studentName: alloc.studentName,
      description: input.description.trim(),
      amount: Math.round(input.amount),
      currency: 'KES',
      status: 'DRAFT',
      createdByActorId: input.actorId,
      createdByName: input.actorName,
      createdAt: new Date().toISOString(),
    };
    state.charges.unshift(charge);
    appendAudit(state, input.actorName, `Created draft accommodation charge ${charge.chargeRef} (KES ${charge.amount}).`);
    saveState(state);
    return { ok: true };
  },

  approveCharge(
    chargeId: string,
    financeActorId: string,
    financeActorName: string
  ): { ok: boolean; error?: string } {
    const state = loadState();
    const charge = state.charges.find((c) => c.id === chargeId);
    if (!charge) return { ok: false, error: 'Charge not found.' };
    if (charge.status !== 'DRAFT') return { ok: false, error: 'Only DRAFT charges can be approved.' };
    if (charge.createdByActorId === financeActorId) {
      return {
        ok: false,
        error: 'Separation of duties violation: Charge creator cannot approve their own accommodation charge.',
      };
    }
    charge.status = 'APPROVED';
    charge.approvedByActorId = financeActorId;
    charge.approvedByName = financeActorName;
    appendAudit(state, financeActorName, `Approved charge ${charge.chargeRef}.`);
    saveState(state);
    return { ok: true };
  },

  generateDraftInvoice(chargeId: string, financeActorName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const charge = state.charges.find((c) => c.id === chargeId);
    if (!charge) return { ok: false, error: 'Charge not found.' };
    if (charge.status !== 'APPROVED') {
      return { ok: false, error: 'Charge must be approved by Finance before generating a draft invoice.' };
    }
    charge.status = 'INVOICED';
    charge.draftInvoiceRef = `DRAFT-INV-${charge.chargeRef.replace('HCHG-', '')}`;
    appendAudit(state, financeActorName, `Created Finance draft invoice ${charge.draftInvoiceRef}.`);
    saveState(state);
    return { ok: true };
  },

  submitSupportRequest(input: {
    studentRegNo: string;
    studentName: string;
    branch: string;
    category: SupportRequestCategory;
    explicitSensitive: boolean;
    subject: string;
    description: string;
  }): { ok: boolean } {
    const state = loadState();
    const restricted =
      input.explicitSensitive ||
      input.category === 'COUNSELLING' ||
      input.category === 'HEALTH_REFERRAL';
    const caseRef = `WEL-2026-${String(state.supportRequests.length + 50).padStart(3, '0')}`;
    state.supportRequests.unshift({
      id: `wsr-${Date.now()}`,
      caseRef,
      studentRegNo: input.studentRegNo,
      studentName: input.studentName,
      branch: input.branch,
      category: input.category,
      restricted,
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: 'OPEN',
      updates: [],
      createdAt: new Date().toISOString(),
    });
    appendAudit(
      state,
      input.studentRegNo,
      `Submitted welfare case ${caseRef} (${restricted ? 'RESTRICTED' : 'STANDARD'}).`
    );
    saveState(state);
    return { ok: true };
  },

  assignSupportRequest(
    requestId: string,
    handlerActorId: string,
    handlerName: string
  ): { ok: boolean; error?: string } {
    const state = loadState();
    const req = state.supportRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: 'Support case not found.' };
    req.assignedToActorId = handlerActorId;
    req.assignedToName = handlerName;
    if (req.status === 'OPEN') req.status = 'ASSIGNED';
    appendAudit(state, handlerName, `Assigned support case ${req.caseRef} to ${handlerName}.`);
    saveState(state);
    return { ok: true };
  },

  addSupportUpdate(
    requestId: string,
    author: string,
    note: string,
    nextStatus?: SupportRequestStatus
  ): { ok: boolean; error?: string } {
    const state = loadState();
    const req = state.supportRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: 'Support case not found.' };
    if (note.trim()) {
      req.updates.push({
        id: `wupd-${Date.now()}`,
        author,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      });
    }
    if (nextStatus) req.status = nextStatus;
    appendAudit(state, author, `Updated case ${req.caseRef}${nextStatus ? ` -> ${nextStatus}` : ''}.`);
    saveState(state);
    return { ok: true };
  },

  publishAnnouncement(input: {
    title: string;
    body: string;
    branch: string;
    hostelId?: string;
    audience: AnnouncementAudience;
    actor: string;
  }): { ok: boolean } {
    const state = loadState();
    state.announcements.unshift({
      id: `hann-${Date.now()}`,
      title: input.title.trim(),
      body: input.body.trim(),
      branch: input.branch,
      hostelId: input.hostelId || undefined,
      audience: input.audience,
      active: true,
      publishedBy: input.actor,
      publishedAt: new Date().toISOString(),
    });
    appendAudit(state, input.actor, `Published announcement "${input.title.trim()}" (${input.audience}).`);
    saveState(state);
    return { ok: true };
  },
};

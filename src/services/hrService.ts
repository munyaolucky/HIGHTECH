import {
  StaffAttendanceRecord,
  StaffAttendanceStatus,
  StaffContract,
  StaffEmploymentStatus,
  StaffEmploymentType,
  StaffLeaveRequest,
  StaffLeaveType,
  StaffMember,
  StaffWorkload,
  StaffWorkloadType,
} from '../types/hr';

const STORAGE_KEY = 'hitech_hr_staff_v1';

interface HRState {
  staff: StaffMember[];
  contracts: StaffContract[];
  leaveRequests: StaffLeaveRequest[];
  attendance: StaffAttendanceRecord[];
  workloads: StaffWorkload[];
  auditLog: { id: string; actor: string; action: string; timestamp: string }[];
}

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

const INITIAL_STATE: HRState = {
  staff: [
    {
      id: 'stf-1',
      userId: 'usr-lecturer-kamau',
      employeeNumber: 'HCA/STAFF/2026/001',
      fullName: 'Eng. Peter Kamau Njoroge',
      email: 'pkamau@hitech.ac.ke',
      branch: 'Nairobi Main Campus',
      department: 'School of Computing & Informatics',
      jobTitle: 'Senior ICT & AI Lecturer',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2024-01-08',
      workLocation: 'Academic Towers Floor 4, Lab 3',
      linkedDocumentRefs: ['DOC-HR-2026-001 (Academic Credentials)', 'DOC-HR-2026-004 (TVETA Trainer License)'],
    },
    {
      id: 'stf-2',
      userId: 'usr-hr-primary',
      employeeNumber: 'HCA/STAFF/2026/002',
      fullName: 'Beatrice Wanjiku Mwangi',
      email: 'bwmwangi@hitech.ac.ke',
      branch: 'Nairobi Main Campus',
      department: 'Human Resources & Administration',
      jobTitle: 'Human Resources Officer',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2023-06-01',
      workLocation: 'Admin Suite 2B',
      linkedDocumentRefs: ['DOC-HR-2026-007 (IHRM Practising Certificate)'],
    },
    {
      id: 'stf-3',
      userId: 'usr-trainer-aisha',
      employeeNumber: 'HCA/STAFF/2026/003',
      fullName: 'Aisha Hassan Mohamed',
      email: 'amohamed@hitech.ac.ke',
      branch: 'Mombasa Coastal Campus',
      department: 'School of Business Studies',
      jobTitle: 'KASNEB & Business Trainer',
      employmentType: 'CONTRACT',
      status: 'PROBATION',
      joiningDate: '2026-08-01',
      probationEndDate: '2027-01-31',
      workLocation: 'Mombasa Moi Avenue Block',
      linkedDocumentRefs: ['DOC-HR-2026-012 (CPA-K Certificate)'],
    },
  ],
  contracts: [
    {
      id: 'cnt-1',
      contractNumber: 'CNT-2026-001',
      staffId: 'stf-1',
      staffName: 'Eng. Peter Kamau Njoroge',
      position: 'Senior ICT & AI Lecturer',
      employmentType: 'FULL_TIME',
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      monthlySalaryKes: 145000,
      status: 'ACTIVE',
      createdByUserId: 'usr-hr-primary',
      createdByName: 'Beatrice Wanjiku (HR Officer)',
      reviewedByUserId: 'usr-hr-reviewer',
      reviewedByName: 'Dr. Samuel Karanja (Principal)',
      reviewNote: 'Verified workload alignment and TVETA accreditation.',
    },
    {
      id: 'cnt-2',
      contractNumber: 'CNT-2026-008',
      staffId: 'stf-3',
      staffName: 'Aisha Hassan Mohamed',
      position: 'KASNEB & Business Trainer',
      employmentType: 'CONTRACT',
      startDate: '2026-08-01',
      endDate: '2027-07-31',
      monthlySalaryKes: 98000,
      status: 'SUBMITTED',
      createdByUserId: 'usr-hr-primary',
      createdByName: 'Beatrice Wanjiku (HR Officer)',
    },
  ],
  leaveRequests: [
    {
      id: 'lv-1',
      reference: 'LVE-2026-014',
      staffId: 'stf-1',
      staffName: 'Eng. Peter Kamau Njoroge',
      leaveType: 'ANNUAL',
      startDate: '2026-12-14',
      endDate: '2026-12-18',
      requestedDays: 5,
      reason: 'Post-trimester family travel after exam moderation',
      status: 'SUBMITTED',
      createdAt: '2026-11-01T08:00:00Z',
    },
  ],
  attendance: [
    {
      id: 'att-1',
      staffId: 'stf-1',
      staffName: 'Eng. Peter Kamau Njoroge',
      date: new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
      status: 'PRESENT',
      checkIn: '07:52',
      checkOut: '16:45',
      note: 'Morning DICT-L6 lab practicals + afternoon project supervision',
    },
  ],
  workloads: [
    {
      id: 'wkl-1',
      staffId: 'stf-1',
      staffName: 'Eng. Peter Kamau Njoroge',
      workloadType: 'TEACHING',
      courseOfferingCode: 'DICT-L6 / CS-204',
      title: 'Web Applications & Relational Databases (DICT Term 2)',
      weeklyHours: 16,
      startDate: '2026-09-01',
      endDate: '2026-12-15',
      status: 'ACTIVE',
    },
    {
      id: 'wkl-2',
      staffId: 'stf-1',
      staffName: 'Eng. Peter Kamau Njoroge',
      workloadType: 'SUPERVISION',
      title: 'AI/ML Capstone Project Moderation Committee',
      weeklyHours: 4,
      startDate: '2026-09-01',
      endDate: '2026-12-20',
      status: 'ACTIVE',
    },
  ],
  auditLog: [
    {
      id: 'hra-1',
      actor: 'Beatrice Wanjiku (HR Officer)',
      action: 'Submitted contract CNT-2026-008 for independent review.',
      timestamp: '2026-10-30T11:20:00Z',
    },
  ],
};

function loadState(): HRState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as HRState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: HRState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function logAudit(state: HRState, actor: string, action: string) {
  state.auditLog.unshift({
    id: `hra-${Date.now()}`,
    actor,
    action,
    timestamp: new Date().toISOString(),
  });
}

export const hrService = {
  getState(): HRState {
    return loadState();
  },

  createStaffProfile(input: {
    employeeNumber: string;
    fullName: string;
    email: string;
    branch: string;
    department: string;
    jobTitle: string;
    employmentType: StaffEmploymentType;
    joiningDate: string;
    workLocation: string;
    actor: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    if (
      state.staff.some(
        (s) => s.employeeNumber.toLowerCase() === input.employeeNumber.trim().toLowerCase()
      )
    ) {
      return { ok: false, error: 'Employee number already exists in staff registry.' };
    }
    const staff: StaffMember = {
      id: `stf-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      employeeNumber: input.employeeNumber.trim().toUpperCase(),
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      branch: input.branch,
      department: input.department.trim(),
      jobTitle: input.jobTitle.trim(),
      employmentType: input.employmentType,
      status: 'ACTIVE',
      joiningDate: input.joiningDate,
      workLocation: input.workLocation.trim(),
      linkedDocumentRefs: [],
    };
    state.staff.unshift(staff);
    logAudit(state, input.actor, `Onboarded staff profile ${staff.employeeNumber} (${staff.fullName}).`);
    saveState(state);
    return { ok: true };
  },

  updateStaffStatus(staffId: string, status: StaffEmploymentStatus, actor: string): { ok: boolean } {
    const state = loadState();
    const staff = state.staff.find((s) => s.id === staffId);
    if (!staff) return { ok: false };
    staff.status = status;
    // Transactional rule: terminating staff automatically terminates active contracts
    if (status === 'TERMINATED') {
      state.contracts.forEach((c) => {
        if (c.staffId === staff.id && c.status === 'ACTIVE') {
          c.status = 'TERMINATED';
        }
      });
    }
    logAudit(
      state,
      actor,
      `Updated ${staff.employeeNumber} status to ${status}${status === 'TERMINATED' ? ' (active contracts terminated)' : ''}.`
    );
    saveState(state);
    return { ok: true };
  },

  createContractDraft(input: {
    staffId: string;
    position: string;
    employmentType: StaffEmploymentType;
    startDate: string;
    endDate: string;
    monthlySalaryKes: number;
    creatorUserId: string;
    creatorName: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const staff = state.staff.find((s) => s.id === input.staffId);
    if (!staff) return { ok: false, error: 'Staff profile not found.' };
    if (input.startDate > input.endDate) {
      return { ok: false, error: 'Contract start date must be on or before end date.' };
    }
    const contract: StaffContract = {
      id: `cnt-${Date.now()}`,
      contractNumber: `CNT-2026-${String(state.contracts.length + 10).padStart(3, '0')}`,
      staffId: staff.id,
      staffName: staff.fullName,
      position: input.position.trim(),
      employmentType: input.employmentType,
      startDate: input.startDate,
      endDate: input.endDate,
      monthlySalaryKes: Math.max(0, Math.round(input.monthlySalaryKes)),
      status: 'DRAFT',
      createdByUserId: input.creatorUserId,
      createdByName: input.creatorName,
    };
    state.contracts.unshift(contract);
    logAudit(state, input.creatorName, `Drafted contract ${contract.contractNumber} for ${staff.fullName}.`);
    saveState(state);
    return { ok: true };
  },

  submitContract(contractId: string, actor: string): { ok: boolean; error?: string } {
    const state = loadState();
    const contract = state.contracts.find((c) => c.id === contractId);
    if (!contract || contract.status !== 'DRAFT') {
      return { ok: false, error: 'Only DRAFT contracts can be submitted.' };
    }
    contract.status = 'SUBMITTED';
    logAudit(state, actor, `Submitted contract ${contract.contractNumber} for independent review.`);
    saveState(state);
    return { ok: true };
  },

  reviewContract(input: {
    contractId: string;
    decision: 'APPROVE' | 'REJECT';
    reviewerUserId: string;
    reviewerName: string;
    note: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const contract = state.contracts.find((c) => c.id === input.contractId);
    if (!contract) return { ok: false, error: 'Contract not found.' };
    if (contract.status !== 'SUBMITTED') {
      return { ok: false, error: 'Contract must be SUBMITTED before review.' };
    }
    const staff = state.staff.find((s) => s.id === contract.staffId);
    if (contract.createdByUserId === input.reviewerUserId || staff?.userId === input.reviewerUserId) {
      return {
        ok: false,
        error: 'Independent reviewer rule: Neither contract creator nor employee may approve/reject.',
      };
    }
    if (input.decision === 'REJECT' && !input.note.trim()) {
      return { ok: false, error: 'Rejection requires an explanatory reason.' };
    }
    contract.status = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    contract.reviewedByUserId = input.reviewerUserId;
    contract.reviewedByName = input.reviewerName;
    contract.reviewNote = input.note.trim();
    logAudit(state, input.reviewerName, `${input.decision}D contract ${contract.contractNumber}.`);
    saveState(state);
    return { ok: true };
  },

  activateContract(contractId: string, actor: string): { ok: boolean; error?: string } {
    const state = loadState();
    const contract = state.contracts.find((c) => c.id === contractId);
    if (!contract || contract.status !== 'APPROVED') {
      return { ok: false, error: 'Only APPROVED contracts may be activated.' };
    }
    const overlap = state.contracts.find(
      (c) =>
        c.id !== contract.id &&
        c.staffId === contract.staffId &&
        c.status === 'ACTIVE' &&
        datesOverlap(c.startDate, c.endDate, contract.startDate, contract.endDate)
    );
    if (overlap) {
      return {
        ok: false,
        error: `Overlap conflict with active contract ${overlap.contractNumber} (${overlap.startDate} to ${overlap.endDate}).`,
      };
    }
    contract.status = 'ACTIVE';
    logAudit(state, actor, `Activated contract ${contract.contractNumber} for ${contract.staffName}.`);
    saveState(state);
    return { ok: true };
  },

  submitLeaveRequest(input: {
    staffId: string;
    leaveType: StaffLeaveType;
    startDate: string;
    endDate: string;
    requestedDays: number;
    reason: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const staff = state.staff.find((s) => s.id === input.staffId);
    if (!staff) return { ok: false, error: 'Staff record not found.' };
    if (input.startDate > input.endDate) {
      return { ok: false, error: 'Leave end date must be on or after start date.' };
    }
    if (input.requestedDays <= 0 || Math.round(input.requestedDays * 2) !== input.requestedDays * 2) {
      return { ok: false, error: 'Requested days must be in half-day (0.5) increments.' };
    }
    const overlap = state.leaveRequests.find(
      (l) =>
        l.staffId === staff.id &&
        (l.status === 'SUBMITTED' || l.status === 'APPROVED') &&
        datesOverlap(l.startDate, l.endDate, input.startDate, input.endDate)
    );
    if (overlap) {
      return {
        ok: false,
        error: `Overlapping leave request (${overlap.reference}: ${overlap.startDate} to ${overlap.endDate}).`,
      };
    }
    state.leaveRequests.unshift({
      id: `lv-${Date.now()}`,
      reference: `LVE-2026-${String(state.leaveRequests.length + 20).padStart(3, '0')}`,
      staffId: staff.id,
      staffName: staff.fullName,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      requestedDays: input.requestedDays,
      reason: input.reason.trim(),
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    });
    logAudit(state, staff.fullName, `Submitted ${input.leaveType} leave request (${input.requestedDays} days).`);
    saveState(state);
    return { ok: true };
  },

  reviewLeaveRequest(input: {
    leaveId: string;
    decision: 'APPROVE' | 'REJECT';
    reviewerUserId: string;
    reviewerName: string;
    note: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const req = state.leaveRequests.find((l) => l.id === input.leaveId);
    if (!req) return { ok: false, error: 'Leave request not found.' };
    const staff = state.staff.find((s) => s.id === req.staffId);
    if (staff?.userId === input.reviewerUserId) {
      return { ok: false, error: 'Self-approval blocked: Employees cannot review their own leave request.' };
    }
    if (input.decision === 'REJECT' && !input.note.trim()) {
      return { ok: false, error: 'Rejecting leave requires an explanatory note.' };
    }
    req.status = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    req.reviewedByName = input.reviewerName;
    req.reviewNote = input.note.trim();
    logAudit(state, input.reviewerName, `${req.status} leave request ${req.reference}.`);
    saveState(state);
    return { ok: true };
  },

  cancelOwnLeaveRequest(leaveId: string, actorUserId: string, actorName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const req = state.leaveRequests.find((l) => l.id === leaveId);
    if (!req) return { ok: false, error: 'Leave request not found.' };
    const staff = state.staff.find((s) => s.id === req.staffId);
    if (staff?.userId !== actorUserId) {
      return { ok: false, error: 'Only the leave owner can cancel a submitted request.' };
    }
    if (req.status !== 'SUBMITTED') {
      return { ok: false, error: 'Only SUBMITTED leave requests can be cancelled.' };
    }
    req.status = 'CANCELLED';
    logAudit(state, actorName, `Cancelled leave request ${req.reference}.`);
    saveState(state);
    return { ok: true };
  },

  recordAttendance(input: {
    staffId: string;
    date: string;
    status: StaffAttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    note?: string;
    actor: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const staff = state.staff.find((s) => s.id === input.staffId);
    if (!staff) return { ok: false, error: 'Staff member not found.' };
    if (input.checkIn && input.checkOut && input.checkOut <= input.checkIn) {
      return { ok: false, error: 'Check-out time must be strictly after check-in time.' };
    }
    const existing = state.attendance.find(
      (a) => a.staffId === staff.id && a.date === input.date
    );
    if (existing) {
      existing.status = input.status;
      existing.checkIn = input.checkIn;
      existing.checkOut = input.checkOut;
      existing.note = input.note?.trim();
    } else {
      state.attendance.unshift({
        id: `att-${Date.now()}`,
        staffId: staff.id,
        staffName: staff.fullName,
        date: input.date,
        status: input.status,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        note: input.note?.trim(),
      });
    }
    logAudit(state, input.actor, `Recorded attendance for ${staff.employeeNumber} on ${input.date}: ${input.status}.`);
    saveState(state);
    return { ok: true };
  },

  assignWorkload(input: {
    staffId: string;
    workloadType: StaffWorkloadType;
    courseOfferingCode?: string;
    title: string;
    weeklyHours: number;
    startDate: string;
    endDate: string;
    actor: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const staff = state.staff.find((s) => s.id === input.staffId);
    if (!staff) return { ok: false, error: 'Staff profile not found.' };
    if (input.startDate > input.endDate) {
      return { ok: false, error: 'Workload start date must precede end date.' };
    }
    state.workloads.unshift({
      id: `wkl-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.fullName,
      workloadType: input.workloadType,
      courseOfferingCode: input.courseOfferingCode?.trim() || undefined,
      title: input.title.trim(),
      weeklyHours: Math.max(1, input.weeklyHours),
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'ACTIVE',
    });
    logAudit(state, input.actor, `Assigned ${input.weeklyHours} hrs/wk workload to ${staff.fullName}.`);
    saveState(state);
    return { ok: true };
  },
};

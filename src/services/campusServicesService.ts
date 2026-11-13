import {
  AdmissionsEnquiry,
  CampusAppointment,
  CampusServiceDefinition,
  ComplianceObligation,
  CrmEnquiryStage,
  DataQualityFinding,
  DigitalCredential,
  InstitutionalPolicy,
  PublicCredentialVerificationResult,
} from '../types/campusServices';

const STORAGE_KEY = 'hitech_campus_services_v1';

interface CampusServicesState {
  credentials: DigitalCredential[];
  enquiries: AdmissionsEnquiry[];
  lastPublicEnquiryMs: number;
  services: CampusServiceDefinition[];
  appointments: CampusAppointment[];
  policies: InstitutionalPolicy[];
  obligations: ComplianceObligation[];
  dataQualityFindings: DataQualityFinding[];
}

export function computeChecksumChar(payload: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    sum = (sum + payload.charCodeAt(i) * (i + 7)) % alphabet.length;
  }
  return alphabet[sum];
}

export function generateChecksummedCredentialCode(year: number, seq: number): string {
  const core = `HTC-${year}-${String(seq).padStart(4, '0')}`;
  return `${core}-${computeChecksumChar(core)}7`;
}

const INITIAL_STATE: CampusServicesState = {
  credentials: [
    {
      id: 'cred-1',
      verificationCode: generateChecksummedCredentialCode(2026, 8419),
      studentRegNo: 'HCA/STU/2026/001',
      firstName: 'Brian',
      lastName: 'Otieno',
      programme: 'Diploma in ICT (DICT Level 6)',
      awardType: 'OFFICIAL_TRANSCRIPT',
      issueDate: '2026-10-12',
      completionDate: '2026-10-05',
      status: 'ISSUED',
      requestedByUserId: 'usr-staff-req',
      requestedByName: 'M. Kariuki (Records Clerk)',
      approvedByUserId: 'usr-registrar-app',
      approvedByName: 'H. Oduor (Chief Registrar)',
      verificationCount: 7,
      lastVerifiedAt: '2026-11-08T13:15:00Z',
    },
    {
      id: 'cred-2',
      verificationCode: generateChecksummedCredentialCode(2026, 8422),
      studentRegNo: 'HCA/ALU/2024/089',
      firstName: 'Kevin',
      lastName: 'Tanui',
      programme: 'Diploma in Cyber Security & Digital Forensics',
      awardType: 'DIPLOMA_CERTIFICATE',
      issueDate: '2026-09-20',
      completionDate: '2026-08-30',
      status: 'ISSUED',
      requestedByUserId: 'usr-staff-req',
      requestedByName: 'M. Kariuki (Records Clerk)',
      approvedByUserId: 'usr-registrar-app',
      approvedByName: 'H. Oduor (Chief Registrar)',
      verificationCount: 12,
      lastVerifiedAt: '2026-11-10T09:20:00Z',
    },
    {
      id: 'cred-3',
      verificationCode: generateChecksummedCredentialCode(2026, 8451),
      studentRegNo: 'HCA/STU/2026/014',
      firstName: 'Faith',
      lastName: 'Korir',
      programme: 'Diploma in Artificial Intelligence & Machine Learning',
      awardType: 'CDACC_COMPETENCY',
      issueDate: '2026-11-05',
      completionDate: '2026-10-30',
      status: 'REQUESTED',
      requestedByUserId: 'usr-staff-req',
      requestedByName: 'M. Kariuki (Records Clerk)',
      verificationCount: 0,
    },
  ],
  enquiries: [
    {
      id: 'enq-1',
      reference: 'ENQ-2026-0301',
      fullName: 'Daniel Kipchoge',
      email: 'dkipchoge@example.co.ke',
      phone: '+254712889900',
      programmeInterest: 'Diploma in Artificial Intelligence & Machine Learning',
      preferredCampus: 'Westlands Technology Park Campus',
      intake: 'January 2027 Intake',
      message: 'Seeking evening schedule and KASNEB/AI tuition installment structure.',
      consentGiven: true,
      stage: 'FOLLOW_UP',
      followUpDate: '2026-11-18',
      contactLogs: [
        {
          id: 'cl-1',
          actor: 'Admissions Advisor (A. Mutua)',
          note: 'Shared fee prospectus & Westlands lab tour invite.',
          createdAt: '2026-11-06T11:20:00Z',
        },
      ],
      createdAt: '2026-11-05T14:10:00Z',
    },
  ],
  lastPublicEnquiryMs: 0,
  services: [
    {
      id: 'srv-reg',
      code: 'SRV-REG-01',
      name: 'Transcript Collection & Academic Clearance',
      office: 'Registrar Desk — Academic Towers Ground Floor',
      campus: 'Nairobi Main Campus',
      officeHoursEAT: '08:30 – 16:00 EAT',
      slotMinutes: 30,
      dailyLimitPerStudent: 1,
      availableSlots: ['09:00 EAT', '09:30 EAT', '10:30 EAT', '14:00 EAT', '15:00 EAT'],
    },
    {
      id: 'srv-fin',
      code: 'SRV-FIN-02',
      name: 'HELB / CDF Bursary & Fee Reconciliation Clinic',
      office: 'Finance Bursar Suite 1A',
      campus: 'Nairobi Main Campus',
      officeHoursEAT: '09:00 – 15:30 EAT',
      slotMinutes: 30,
      dailyLimitPerStudent: 1,
      availableSlots: ['09:00 EAT', '11:00 EAT', '14:30 EAT'],
    },
  ],
  appointments: [
    {
      id: 'apt-1',
      bookingRef: 'APT-2026-0092',
      serviceId: 'srv-reg',
      serviceName: 'Transcript Collection & Academic Clearance',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      date: '2026-11-19',
      timeSlot: '09:30 EAT',
      status: 'BOOKED',
    },
  ],
  policies: [
    {
      id: 'pol-1',
      code: 'POL-ODPC-2026',
      title: 'Student & Guardian Data Protection & Retention Policy (DPA 2019)',
      ownerRole: 'Data Protection / Registrar Office',
      version: 'v2.1',
      status: 'APPROVED',
      creatorUserId: 'usr-staff-req',
      approvedByName: 'Dr. Samuel Karanja (Principal)',
      acknowledgements: [
        {
          userId: 'usr-stu-001',
          userName: 'Brian Omondi Otieno',
          acknowledgedAt: '2026-10-01T08:00:00Z',
        },
      ],
    },
    {
      id: 'pol-2',
      code: 'POL-AI-GOV-2026',
      title: 'Academic Integrity & Authorized AI Tools Assessment Charter',
      ownerRole: 'Examination Board',
      version: 'v1.0',
      status: 'PENDING_APPROVAL',
      creatorUserId: 'usr-staff-req',
      acknowledgements: [],
    },
  ],
  obligations: [
    {
      id: 'obl-1',
      regulator: 'TVETA',
      obligationTitle: 'Annual Computing Lab Safety & Trainer License Renewal',
      dueDate: '2026-12-31',
      status: 'COMPLIANT',
      evidenceRef: 'DOC-2026-001 (QMS Manual)',
    },
    {
      id: 'obl-2',
      regulator: 'ODPC_KENYA',
      obligationTitle: 'Annual Data Protection Registration & Privacy Notice Review',
      dueDate: '2026-12-15',
      status: 'UNDER_REVIEW',
      evidenceRef: 'COOKIE-POLICY-2026-11-v1',
    },
  ],
  dataQualityFindings: [
    {
      id: 'dq-1',
      severity: 'WARNING',
      ruleName: 'Missing Next-of-Kin Phone Formatting (+254)',
      recordRef: 'HCA/STU/2026/019',
      detail: 'Guardian telephone uses 9-digit local format without country prefix.',
    },
    {
      id: 'dq-2',
      severity: 'CRITICAL',
      ruleName: 'Potential Duplicate National ID Across Applicant & Active Student',
      recordRef: 'APP-2026-0842 / HCA/STU/2026/014',
      detail: 'Read-only inspection flagged matching National ID across intake cohorts; verify before merge.',
    },
  ],
};

function loadState(): CampusServicesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as CampusServicesState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: CampusServicesState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const campusServicesService = {
  getState(): CampusServicesState {
    return loadState();
  },

  /** Privacy-minimized public verification per IMPLEMENTATION-STATUS.md (First name + Last Initial ONLY) */
  verifyPublicCredential(code: string): PublicCredentialVerificationResult {
    const state = loadState();
    const normalized = code.trim().toUpperCase();
    const cred = state.credentials.find(
      (c) =>
        c.verificationCode.toUpperCase() === normalized &&
        (c.status === 'ISSUED' || c.status === 'REVOKED' || c.status === 'REPLACED')
    );
    if (!cred) return { found: false };

    cred.verificationCount += 1;
    cred.lastVerifiedAt = new Date().toISOString();
    saveState(state);

    return {
      found: true,
      maskedHolderName: `${cred.firstName} ${cred.lastName.charAt(0)}.`,
      programme: cred.programme,
      awardType: cred.awardType.replace(/_/g, ' '),
      issueDate: cred.issueDate,
      completionDate: cred.completionDate,
      status: cred.status,
      verificationCode: cred.verificationCode,
      verificationCount: cred.verificationCount,
    };
  },

  requestCredential(input: {
    studentRegNo: string;
    firstName: string;
    lastName: string;
    programme: string;
    awardType: DigitalCredential['awardType'];
    requestorUserId: string;
    requestorName: string;
  }): { ok: boolean; code?: string } {
    const state = loadState();
    const seq = 8460 + state.credentials.length;
    const code = generateChecksummedCredentialCode(2026, seq);
    state.credentials.unshift({
      id: `cred-${Date.now()}`,
      verificationCode: code,
      studentRegNo: input.studentRegNo.trim().toUpperCase(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      programme: input.programme,
      awardType: input.awardType,
      issueDate: new Date().toISOString().slice(0, 10),
      completionDate: '2026-10-30',
      status: 'REQUESTED',
      requestedByUserId: input.requestorUserId,
      requestedByName: input.requestorName,
      verificationCount: 0,
    });
    saveState(state);
    return { ok: true, code };
  },

  approveAndIssueCredential(
    credId: string,
    approverUserId: string,
    approverName: string
  ): { ok: boolean; error?: string } {
    const state = loadState();
    const cred = state.credentials.find((c) => c.id === credId);
    if (!cred) return { ok: false, error: 'Credential record not found.' };
    if (cred.requestedByUserId === approverUserId) {
      return {
        ok: false,
        error: 'Separation of duties violation: Credential requestor cannot approve/issue their own request.',
      };
    }
    cred.status = 'ISSUED';
    cred.approvedByUserId = approverUserId;
    cred.approvedByName = approverName;
    saveState(state);
    return { ok: true };
  },

  revokeOrReplaceCredential(
    credId: string,
    mode: 'REVOKED' | 'REPLACED',
    reason: string,
    approverName: string
  ): { ok: boolean; error?: string; replacementCode?: string } {
    const state = loadState();
    const cred = state.credentials.find((c) => c.id === credId);
    if (!cred || cred.status !== 'ISSUED') {
      return { ok: false, error: 'Only ISSUED credentials may be revoked or replaced.' };
    }
    if (!reason.trim()) return { ok: false, error: 'Provide an official audit reason.' };
    cred.status = mode;
    cred.revokedReason = reason.trim();

    let replacementCode: string | undefined;
    if (mode === 'REPLACED') {
      replacementCode = generateChecksummedCredentialCode(2026, 8500 + state.credentials.length);
      cred.replacedByCode = replacementCode;
      state.credentials.unshift({
        id: `cred-${Date.now()}`,
        verificationCode: replacementCode,
        studentRegNo: cred.studentRegNo,
        firstName: cred.firstName,
        lastName: cred.lastName,
        programme: cred.programme,
        awardType: cred.awardType,
        issueDate: new Date().toISOString().slice(0, 10),
        completionDate: cred.completionDate,
        status: 'ISSUED',
        requestedByUserId: cred.requestedByUserId,
        requestedByName: cred.requestedByName,
        approvedByName: approverName,
        verificationCount: 0,
      });
    }
    saveState(state);
    return { ok: true, replacementCode };
  },

  submitPublicEnquiry(input: {
    fullName: string;
    email: string;
    phone: string;
    programmeInterest: string;
    preferredCampus: string;
    intake: string;
    message: string;
    consentGiven: boolean;
    honeypot: string;
  }): { ok: boolean; error?: string; reference?: string } {
    if (input.honeypot.trim() !== '') {
      return { ok: false, error: 'Automated spam submission rejected.' };
    }
    if (!input.consentGiven) {
      return { ok: false, error: 'Explicit privacy consent is required before submitting an enquiry.' };
    }
    const state = loadState();
    const now = Date.now();
    if (now - state.lastPublicEnquiryMs < 8000) {
      return { ok: false, error: 'Rate limit: please wait a few seconds between enquiries.' };
    }

    const dup = state.enquiries.find(
      (e) =>
        e.email.toLowerCase() === input.email.trim().toLowerCase() ||
        e.phone.trim() === input.phone.trim()
    );

    const reference = `ENQ-2026-${String(302 + state.enquiries.length).padStart(4, '0')}`;
    state.enquiries.unshift({
      id: `enq-${now}`,
      reference,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      programmeInterest: input.programmeInterest,
      preferredCampus: input.preferredCampus,
      intake: input.intake,
      message: input.message.trim(),
      consentGiven: true,
      stage: 'NEW',
      duplicateWarning: dup
        ? `Matches existing enquiry ${dup.reference} (${dup.email})`
        : undefined,
      contactLogs: [],
      createdAt: new Date().toISOString(),
    });
    state.lastPublicEnquiryMs = now;
    saveState(state);
    return { ok: true, reference };
  },

  updateEnquiryStage(
    enquiryId: string,
    stage: CrmEnquiryStage,
    note: string,
    actor: string
  ): { ok: boolean } {
    const state = loadState();
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq) return { ok: false };
    enq.stage = stage;
    if (note.trim()) {
      enq.contactLogs.unshift({
        id: `cl-${Date.now()}`,
        actor,
        note: `[Stage -> ${stage}] ${note.trim()}`,
        createdAt: new Date().toISOString(),
      });
    }
    saveState(state);
    return { ok: true };
  },

  bookAppointment(input: {
    serviceId: string;
    studentRegNo: string;
    studentName: string;
    date: string;
    timeSlot: string;
  }): { ok: boolean; error?: string; bookingRef?: string } {
    const state = loadState();
    const srv = state.services.find((s) => s.id === input.serviceId);
    if (!srv) return { ok: false, error: 'Service not found.' };

    const sameDayCount = state.appointments.filter(
      (a) =>
        a.serviceId === srv.id &&
        a.studentRegNo === input.studentRegNo &&
        a.date === input.date &&
        a.status !== 'CANCELLED'
    ).length;
    if (sameDayCount >= srv.dailyLimitPerStudent) {
      return {
        ok: false,
        error: `Daily booking limit (${srv.dailyLimitPerStudent}/day) reached for ${srv.name} on ${input.date}.`,
      };
    }

    const slotTaken = state.appointments.some(
      (a) =>
        a.serviceId === srv.id &&
        a.date === input.date &&
        a.timeSlot === input.timeSlot &&
        a.status !== 'CANCELLED'
    );
    if (slotTaken) {
      return { ok: false, error: `Time slot ${input.timeSlot} on ${input.date} is already booked.` };
    }

    const bookingRef = `APT-2026-${String(93 + state.appointments.length).padStart(4, '0')}`;
    state.appointments.unshift({
      id: `apt-${Date.now()}`,
      bookingRef,
      serviceId: srv.id,
      serviceName: srv.name,
      studentRegNo: input.studentRegNo,
      studentName: input.studentName,
      date: input.date,
      timeSlot: input.timeSlot,
      status: 'BOOKED',
    });
    saveState(state);
    return { ok: true, bookingRef };
  },

  transitionAppointment(
    appointmentId: string,
    status: CampusAppointment['status'],
    outcomeNote?: string
  ): { ok: boolean } {
    const state = loadState();
    const apt = state.appointments.find((a) => a.id === appointmentId);
    if (!apt) return { ok: false };
    apt.status = status;
    if (outcomeNote) apt.outcomeNote = outcomeNote;
    saveState(state);
    return { ok: true };
  },

  approvePolicy(
    policyId: string,
    approverUserId: string,
    approverName: string
  ): { ok: boolean; error?: string } {
    const state = loadState();
    const pol = state.policies.find((p) => p.id === policyId);
    if (!pol) return { ok: false, error: 'Policy not found.' };
    if (pol.creatorUserId === approverUserId) {
      return { ok: false, error: 'Policy creator cannot approve their own policy.' };
    }
    pol.status = 'APPROVED';
    pol.approvedByName = approverName;
    saveState(state);
    return { ok: true };
  },

  acknowledgePolicy(policyId: string, userId: string, userName: string): { ok: boolean } {
    const state = loadState();
    const pol = state.policies.find((p) => p.id === policyId);
    if (!pol || pol.status !== 'APPROVED') return { ok: false };
    if (!pol.acknowledgements.some((a) => a.userId === userId)) {
      pol.acknowledgements.push({
        userId,
        userName,
        acknowledgedAt: new Date().toISOString(),
      });
      saveState(state);
    }
    return { ok: true };
  },
};

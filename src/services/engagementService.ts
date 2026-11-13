import {
  CareerApplication,
  CareerEmployer,
  CareerOpportunity,
  GuardianInvitation,
  GuardianLink,
  GuardianScope,
  NotificationCategory,
  NotificationItem,
  NotificationOutboxItem,
  NotificationPreference,
  ParentComplaint,
  ParentMeetingRequest,
} from '../types/campusOps';

const STORAGE_KEY = 'hitech_engagement_hub_v1';

interface EngagementState {
  studentGuardianSharingEnabled: boolean;
  notifications: NotificationItem[];
  preferences: NotificationPreference[];
  outbox: NotificationOutboxItem[];
  invitations: GuardianInvitation[];
  guardianLinks: GuardianLink[];
  meetings: ParentMeetingRequest[];
  complaints: ParentComplaint[];
  employers: CareerEmployer[];
  opportunities: CareerOpportunity[];
  applications: CareerApplication[];
}

const INITIAL_STATE: EngagementState = {
  studentGuardianSharingEnabled: true,
  notifications: [
    {
      id: 'ntf-1',
      recipientId: 'HCA/STU/2026/001',
      category: 'ACADEMIC',
      title: 'Trimester 2 CAT & Practical Timetable Released',
      message: 'Your KNEC/CDACC practical lab sessions start Monday 10 Nov at Academic Towers Lab 3.',
      read: false,
      createdAt: '2026-11-10T07:30:00Z',
    },
    {
      id: 'ntf-2',
      recipientId: 'HCA/STU/2026/001',
      category: 'SECURITY',
      title: 'Security Notice: Portal Sign-In Verified',
      message: 'A new session was initialized for HCA/STU/2026/001. Security notices stay enabled in-app.',
      read: true,
      createdAt: '2026-11-08T14:20:00Z',
    },
  ],
  preferences: [
    { category: 'ACADEMIC', inApp: true, emailOptIn: false, smsOptIn: false },
    { category: 'FINANCE', inApp: true, emailOptIn: true, smsOptIn: false },
    { category: 'WELFARE', inApp: true, emailOptIn: false, smsOptIn: false },
    { category: 'CAREERS', inApp: true, emailOptIn: true, smsOptIn: false },
    { category: 'SECURITY', inApp: true, emailOptIn: false, smsOptIn: false },
  ],
  outbox: [
    {
      id: 'out-1',
      channel: 'EMAIL',
      recipientAddress: 'brian.otieno@student.hitech.ac.ke',
      subject: 'Fee Statement & M-Pesa Reconciliation Receipt',
      status: 'QUEUED',
      createdAt: '2026-11-09T11:00:00Z',
    },
  ],
  invitations: [
    {
      id: 'ginv-1',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      parentEmail: 'mary.otieno@example.co.ke',
      scopes: ['OVERVIEW', 'ATTENDANCE', 'FEES'],
      tokenPreview: 'htc-inv-8f32a90b',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
  ],
  guardianLinks: [
    {
      id: 'glnk-1',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      parentName: 'Joseph Otieno',
      parentEmail: 'joseph.otieno@example.co.ke',
      scopes: ['OVERVIEW', 'ACADEMICS', 'FEES'],
      consentExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
    },
  ],
  meetings: [
    {
      id: 'pmt-1',
      studentRegNo: 'HCA/STU/2026/001',
      parentEmail: 'joseph.otieno@example.co.ke',
      topic: 'Trimester 2 Industrial Attachment Placement Briefing',
      preferredDate: '2026-11-22',
      status: 'SCHEDULED',
    },
  ],
  complaints: [],
  employers: [
    {
      id: 'emp-saf',
      name: 'Safaricom Cloud & Digital Labs',
      industry: 'Telecommunications & Fintech',
      branchScope: 'Nairobi Main Campus',
      contactEmail: 'earlycareers@safaricom-partner.example',
      status: 'VERIFIED',
    },
    {
      id: 'emp-ke',
      name: 'Konza Techno Systems Ltd',
      industry: 'Enterprise Software & Cybersecurity',
      branchScope: 'Westlands Technology Park Campus',
      contactEmail: 'talent@konzatech.example',
      status: 'VERIFIED',
    },
  ],
  opportunities: [
    {
      id: 'opp-1',
      employerId: 'emp-saf',
      employerName: 'Safaricom Cloud & Digital Labs',
      title: 'Junior Cloud & Linux Operations Industrial Attachment (3 Months)',
      employmentType: 'ATTACHMENT',
      location: 'Westlands, Nairobi (Hybrid)',
      applicationMode: 'INTERNAL_PLATFORM',
      deadline: '2026-12-15',
      status: 'OPEN',
    },
    {
      id: 'opp-2',
      employerId: 'emp-ke',
      employerName: 'Konza Techno Systems Ltd',
      title: 'SOC Analyst Trainee (External Employer Portal)',
      employmentType: 'GRADUATE_TRAINEE',
      location: 'Nairobi / Konza Technopolis',
      applicationMode: 'EXTERNAL_LINK',
      externalUrl: 'https://careers.konzatech.example/soc-trainee',
      deadline: '2026-12-30',
      status: 'OPEN',
    },
  ],
  applications: [],
};

function loadState(): EngagementState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as EngagementState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: EngagementState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const engagementService = {
  getState(): EngagementState {
    return loadState();
  },

  markNotificationRead(id: string): void {
    const state = loadState();
    const item = state.notifications.find((n) => n.id === id);
    if (item) item.read = true;
    saveState(state);
  },

  markAllRead(): void {
    const state = loadState();
    state.notifications.forEach((n) => {
      n.read = true;
    });
    saveState(state);
  },

  updatePreference(category: NotificationCategory, channel: 'inApp' | 'emailOptIn' | 'smsOptIn', value: boolean): void {
    const state = loadState();
    const pref = state.preferences.find((p) => p.category === category);
    if (!pref) return;
    if (category === 'SECURITY' && channel === 'inApp') {
      pref.inApp = true; // Security notices remain enabled in-app
    } else {
      pref[channel] = value;
    }
    saveState(state);
  },

  broadcastNotification(input: { category: NotificationCategory; title: string; message: string }): { ok: boolean } {
    const state = loadState();
    state.notifications.unshift({
      id: `ntf-${Date.now()}`,
      recipientId: 'HCA/STU/2026/001',
      category: input.category,
      title: input.title.trim(),
      message: input.message.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    });
    const pref = state.preferences.find((p) => p.category === input.category);
    if (pref?.emailOptIn) {
      state.outbox.unshift({
        id: `out-${Date.now()}-e`,
        channel: 'EMAIL',
        recipientAddress: 'brian.otieno@student.hitech.ac.ke',
        subject: input.title.trim(),
        status: 'QUEUED',
        createdAt: new Date().toISOString(),
      });
    }
    if (pref?.smsOptIn) {
      state.outbox.unshift({
        id: `out-${Date.now()}-s`,
        channel: 'SMS',
        recipientAddress: '+254712345678',
        subject: input.title.trim(),
        status: 'QUEUED',
        createdAt: new Date().toISOString(),
      });
    }
    saveState(state);
    return { ok: true };
  },

  setGuardianConsentEnabled(enabled: boolean): void {
    const state = loadState();
    state.studentGuardianSharingEnabled = enabled;
    if (!enabled) {
      state.guardianLinks.forEach((l) => {
        if (l.status === 'ACTIVE') {
          l.status = 'REVOKED';
          l.scopes = [];
          l.revokedReason = 'Student withdrew institutional guardian sharing consent.';
        }
      });
    }
    saveState(state);
  },

  inviteGuardian(parentEmail: string, scopes: GuardianScope[]): { ok: boolean; error?: string } {
    const state = loadState();
    if (!state.studentGuardianSharingEnabled) {
      return { ok: false, error: 'Enable guardian sharing consent before sending an invitation.' };
    }
    if (!parentEmail.includes('@')) return { ok: false, error: 'Enter a valid guardian email.' };
    if (parentEmail.toLowerCase().includes('brian.otieno')) {
      return { ok: false, error: 'Self-invitation rejected: student cannot invite their own email.' };
    }
    if (scopes.length === 0) return { ok: false, error: 'Select at least one data scope.' };
    state.invitations.unshift({
      id: `ginv-${Date.now()}`,
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      parentEmail: parentEmail.trim().toLowerCase(),
      scopes,
      tokenPreview: `htc-inv-${Math.random().toString(16).slice(2, 10)}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true };
  },

  acceptInvitation(invitationId: string, parentName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const inv = state.invitations.find((i) => i.id === invitationId);
    if (!inv || inv.status !== 'PENDING') return { ok: false, error: 'Invitation is no longer pending.' };
    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      inv.status = 'EXPIRED';
      saveState(state);
      return { ok: false, error: '7-day invitation token has expired.' };
    }
    inv.status = 'ACCEPTED';
    const existing = state.guardianLinks.find((l) => l.parentEmail === inv.parentEmail);
    if (existing) {
      existing.status = 'ACTIVE';
      existing.scopes = [...inv.scopes];
      existing.consentExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      existing.revokedReason = undefined;
    } else {
      state.guardianLinks.unshift({
        id: `glnk-${Date.now()}`,
        studentRegNo: inv.studentRegNo,
        studentName: inv.studentName,
        parentName: parentName.trim() || 'Verified Parent',
        parentEmail: inv.parentEmail,
        scopes: [...inv.scopes],
        consentExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      });
    }
    saveState(state);
    return { ok: true };
  },

  revokeGuardianLink(linkId: string, reason: string): { ok: boolean; error?: string } {
    const state = loadState();
    const link = state.guardianLinks.find((l) => l.id === linkId);
    if (!link) return { ok: false, error: 'Guardian link not found.' };
    if (!reason.trim()) return { ok: false, error: 'Revocation requires an audited reason.' };
    link.status = 'REVOKED';
    link.scopes = [];
    link.revokedReason = reason.trim();
    saveState(state);
    return { ok: true };
  },

  requestParentMeeting(parentEmail: string, topic: string, preferredDate: string): { ok: boolean; error?: string } {
    const state = loadState();
    const active = state.guardianLinks.some(
      (l) => l.parentEmail === parentEmail && l.status === 'ACTIVE' && new Date(l.consentExpiresAt).getTime() > Date.now()
    );
    if (!active) return { ok: false, error: 'Active unexpired guardian link required.' };
    state.meetings.unshift({
      id: `pmt-${Date.now()}`,
      studentRegNo: 'HCA/STU/2026/001',
      parentEmail,
      topic: topic.trim(),
      preferredDate,
      status: 'REQUESTED',
    });
    saveState(state);
    return { ok: true };
  },

  applyInternalOpportunity(opportunityId: string, coverLetter: string): { ok: boolean; error?: string } {
    const state = loadState();
    const opp = state.opportunities.find((o) => o.id === opportunityId);
    if (!opp || opp.status !== 'OPEN') return { ok: false, error: 'Opportunity is not OPEN.' };
    if (opp.applicationMode !== 'INTERNAL_PLATFORM') {
      return { ok: false, error: 'External opportunities must be submitted on the employer external portal.' };
    }
    if (
      state.applications.some(
        (a) => a.opportunityId === opportunityId && a.studentRegNo === 'HCA/STU/2026/001'
      )
    ) {
      return { ok: false, error: 'Duplicate application prevented: you have already applied.' };
    }
    state.applications.unshift({
      id: `capp-${Date.now()}`,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Brian Omondi Otieno',
      coverLetter: coverLetter.trim(),
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true };
  },

  updateApplicationStatus(appId: string, status: CareerApplication['status'], notes: string): { ok: boolean } {
    const state = loadState();
    const app = state.applications.find((a) => a.id === appId);
    if (!app) return { ok: false };
    app.status = status;
    app.reviewNotes = notes.trim();
    saveState(state);
    return { ok: true };
  },

  verifyEmployer(employerId: string, status: 'VERIFIED' | 'SUSPENDED'): void {
    const state = loadState();
    const emp = state.employers.find((e) => e.id === employerId);
    if (emp) emp.status = status;
    saveState(state);
  },
};

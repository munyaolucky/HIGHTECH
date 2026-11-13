import {
  AISupportConversation,
  AISupportKnowledgeArticle,
  AISupportMessage,
  AISupportQuotaTracker,
  GeneralSupportTicket,
  KnowledgeVisibility,
  SupportAssistantRole,
  SupportAuditEntry,
  SupportTicketCategory,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../types/aiSupportCentre';

const STORAGE_KEY = 'hitech_ai_support_centre_v1';

export interface AssistantPersonaMeta {
  role: SupportAssistantRole;
  userId: string;
  name: string;
  title: string;
  focusAreas: string;
  quickPrompts: string[];
}

export const ASSISTANT_PERSONAS: Record<SupportAssistantRole, AssistantPersonaMeta> = {
  STUDENT: {
    role: 'STUDENT',
    userId: 'usr-stu-001',
    name: 'Brian Omondi Otieno (HCA/STU/2026/001)',
    title: 'Student Academic & Learning Assistant',
    focusAreas: 'Unit registration, CDACC/KNEC exam prep, M-Pesa fee billing, library loans & CBT',
    quickPrompts: [
      'How do I prepare and register for TVET CDACC & KNEC examinations?',
      'How does M-Pesa Paybill fee settlement and official receipt verification work?',
      'What are the portal rules for library borrowing and e-book downloads?',
    ],
  },
  LECTURER: {
    role: 'LECTURER',
    userId: 'usr-lect-001',
    name: 'Eng. Peter Kamau Njoroge (HCA/STAFF/2026/001)',
    title: 'Lecturer Lesson Planning & Assessment Assistant',
    focusAreas: 'Lesson pacing, 18/63 CBT question authoring, marking moderation & attendance',
    quickPrompts: [
      'What are the moderation rules before releasing CBT or practical exam marks?',
      'How should lecturers structure competency-based practical rubrics?',
      'How does attendance rate calculation treat PRESENT, LATE, and EXCUSED records?',
    ],
  },
  REGISTRAR: {
    role: 'REGISTRAR',
    userId: 'usr-reg-001',
    name: 'H. Oduor (Chief Registrar)',
    title: 'Registrar Admissions & Academic Records Assistant',
    focusAreas: 'Admissions document verification checklist, HCA numbering & transcript issuance',
    quickPrompts: [
      'What documents must be verified or formally waived before issuing an admission offer?',
      'How does the atomic HCA/<TYPE>/<YEAR>/<SEQ> numbering standard work?',
      'How are official transcripts (TRX) verified and protected against tampering?',
    ],
  },
  FINANCE_OFFICER: {
    role: 'FINANCE_OFFICER',
    userId: 'usr-fin-001',
    name: 'D. Kiprop (Finance Officer)',
    title: 'Finance Fee Structure, Ledger & Billing Assistant',
    focusAreas: 'Service rates, maker-checker hostel charges, M-Pesa reconciliation & multi-currency rules',
    quickPrompts: [
      'What are the maker-checker separation rules for accommodation charges and refunds?',
      'How does HI-TECH separate KES and USD totals in executive financial reporting?',
    ],
  },
  HR_OFFICER: {
    role: 'HR_OFFICER',
    userId: 'usr-hr-primary',
    name: 'Beatrice Wanjiku (HR Officer)',
    title: 'HR Staff Policy & Contracts Assistant',
    focusAreas: 'Contract independent review, half-day leave overlap rules & staff termination cascades',
    quickPrompts: [
      'What independent reviewer guardrails apply to staff contracts and leave approvals?',
      'What happens to active contracts when a staff profile is marked TERMINATED?',
    ],
  },
  LIBRARIAN: {
    role: 'LIBRARIAN',
    userId: 'usr-lib-001',
    name: 'R. Achieng (Senior Librarian)',
    title: 'Librarian Research & Digital Repository Assistant',
    focusAreas: 'Dewey classification, digital licensing, Document Centre public allowlists',
    quickPrompts: [
      'Which Document Centre categories are permitted under PUBLIC or BROAD access policies?',
      'How are physical book barcodes and overdue library fines tracked?',
    ],
  },
  IT_SUPPORT: {
    role: 'IT_SUPPORT',
    userId: 'usr-it-001',
    name: 'K. Mutiso (IT & Support Officer)',
    title: 'IT Support & General Help Desk Assistant',
    focusAreas: 'Account recovery, MFA/session policy, PII redaction, SLA ticket triage & internal notes',
    quickPrompts: [
      'Which Help Centre ticket details are hidden from non-support requesters?',
      'How does the AI Support Centre redact personal emails and Kenyan ID numbers?',
    ],
  },
};

interface SupportCentreState {
  articles: AISupportKnowledgeArticle[];
  conversations: AISupportConversation[];
  quota: AISupportQuotaTracker;
  tickets: GeneralSupportTicket[];
  auditLog: SupportAuditEntry[];
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const INITIAL_STATE: SupportCentreState = {
  articles: [
    {
      id: 'kba-1',
      slug: 'student-cdacc-knec-exam-registration',
      title: 'TVET CDACC & KNEC Examination Registration & Moderation Policy',
      summary: 'Eligibility, practical attendance threshold, and moderation controls for external examinations.',
      body:
        'Students must maintain at least 80% attendance and complete Unit Registration before examination scheduling. All CAT and CBT results undergo independent Chief Examiner moderation before official release to the Student Portal and Transcript engine (TRX).',
      category: 'Academics & Exams',
      visibility: 'ALL_AUTHENTICATED',
      allowedRoles: ['STUDENT', 'LECTURER', 'REGISTRAR'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['cdacc', 'knec', 'exam', 'cbc', 'cbt', 'registration', 'moderation', 'results'],
      citations: ['HI-TECH Academic Examination Handbook §4.2', 'TVETA Assessment SOP 2026'],
      status: 'PUBLISHED',
      authorUserId: 'usr-reg-001',
      authorName: 'H. Oduor (Registrar)',
      reviewedByUserId: 'usr-lect-001',
      reviewedByName: 'Eng. Peter Kamau',
      updatedAt: '2026-10-18T09:00:00Z',
    },
    {
      id: 'kba-2',
      slug: 'mpesa-fees-and-maker-checker-billing',
      title: 'M-Pesa Fee Settlement, Official Receipts & Maker-Checker Separation',
      summary: 'Paybill settlement workflow, multi-currency segregation, and accommodation billing approval.',
      body:
        'Fee payments via M-Pesa STK Push or Paybill generate an immutable receipt (RCT-2026-XXXX) matched against student registration numbers. Hostel accommodation charges created by Hostel Officers require approval by a separate Finance Officer before generating draft invoices. Executive financial summaries strictly separate KES and USD currency groups.',
      category: 'Finance & Billing',
      visibility: 'ALL_AUTHENTICATED',
      allowedRoles: ['STUDENT', 'FINANCE_OFFICER', 'REGISTRAR'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['mpesa', 'fee', 'fees', 'receipt', 'invoice', 'kes', 'usd', 'maker', 'checker', 'currency'],
      citations: ['Finance Operations Manual §2.4', 'Hostels Billing Control §6.1'],
      status: 'PUBLISHED',
      authorUserId: 'usr-fin-001',
      authorName: 'D. Kiprop (Finance Officer)',
      reviewedByUserId: 'usr-reg-001',
      reviewedByName: 'H. Oduor (Registrar)',
      updatedAt: '2026-10-20T10:30:00Z',
    },
    {
      id: 'kba-3',
      slug: 'library-borrowing-and-document-policies',
      title: 'Digital Library Licensing & Document Centre Category Allowlists',
      summary: 'Loan rules, digital downloads, and strict Document Centre broad/public visibility boundaries.',
      body:
        'Physical books use barcode circulation tracking (14-day student loan period). In the Document Centre, uploads default to OWNER_ONLY and PENDING_REVIEW. Broad policies (AUTHENTICATED, STAFF_ONLY) are permitted only in academics, library, website-media, and policies-forms; PUBLIC is restricted strictly to library, website-media, and policies-forms.',
      category: 'Library & Documents',
      visibility: 'ALL_AUTHENTICATED',
      allowedRoles: ['STUDENT', 'LIBRARIAN', 'LECTURER', 'REGISTRAR'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['library', 'ebook', 'borrow', 'loan', 'document', 'public', 'owner_only', 'allowlist'],
      citations: ['Library Circulation Rules §3', 'Document Centre Policy §5'],
      status: 'PUBLISHED',
      authorUserId: 'usr-lib-001',
      authorName: 'R. Achieng (Librarian)',
      reviewedByUserId: 'usr-reg-001',
      reviewedByName: 'H. Oduor (Registrar)',
      updatedAt: '2026-10-21T11:15:00Z',
    },
    {
      id: 'kba-4',
      slug: 'lecturer-cbt-moderation-and-attendance-formula',
      title: 'Lecturer Assessment Moderation & Attendance Rate Formula (Staff Guide)',
      summary: 'Competency rubric standards, CBT question versioning, and institutional attendance KPI calculation.',
      body:
        'Trainers must submit CBT questions and practical rubrics through independent peer review before exam scheduling. Attendance percentage across the institution is calculated on records as (PRESENT + LATE) / (Total records minus EXCUSED), computed against Africa/Nairobi calendar dates.',
      category: 'Faculty & Academics',
      visibility: 'STAFF_ONLY',
      allowedRoles: ['LECTURER', 'REGISTRAR', 'IT_SUPPORT'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['lecturer', 'trainer', 'cbt', 'rubric', 'moderation', 'attendance', 'present', 'late', 'excused'],
      citations: ['Faculty Quality Guidelines §7.1'],
      status: 'PUBLISHED',
      authorUserId: 'usr-lect-001',
      authorName: 'Eng. Peter Kamau',
      reviewedByUserId: 'usr-reg-001',
      reviewedByName: 'H. Oduor (Registrar)',
      updatedAt: '2026-10-22T08:40:00Z',
    },
    {
      id: 'kba-5',
      slug: 'registrar-admissions-checklist-and-hca-numbering',
      title: 'Admissions Document Verification Gate & Central HCA Numbering Standard',
      summary: 'Checklist waiver controls and atomic HCA/<TYPE>/<YEAR>/<SEQ> issuance rules.',
      body:
        'Applicants cannot transition to an admission offer until every required KCSE/National ID checklist item is verified or formally waived with an audited reason. Upon acceptance and activation, Central Registration Generator issues sequential atomic identifiers matching HCA/STU/2026/XXX, HCA/STAFF/2026/XXX, or TRX-2026-XXXX.',
      category: 'Admissions & Records',
      visibility: 'ROLE_RESTRICTED',
      allowedRoles: ['REGISTRAR', 'IT_SUPPORT'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['admissions', 'checklist', 'waive', 'offer', 'hca', 'numbering', 'trx', 'transcript'],
      citations: ['Registrar Standards Manual §1.2'],
      status: 'PUBLISHED',
      authorUserId: 'usr-reg-001',
      authorName: 'H. Oduor (Registrar)',
      reviewedByUserId: 'usr-it-001',
      reviewedByName: 'K. Mutiso (IT Support)',
      updatedAt: '2026-10-24T13:00:00Z',
    },
    {
      id: 'kba-6',
      slug: 'hr-contracts-leave-and-termination-cascade',
      title: 'HR Independent Contract Review, Leave Overlap & Termination Cascade',
      summary: 'Confidential HR compliance rules separating creator, employee, and reviewer.',
      body:
        'Neither the contract creator nor the employee concerned may approve or reject an employment contract. Leave requests operate in half-day (0.5) increments and reject overlaps against submitted or approved leave. Marking a staff profile as TERMINATED immediately transitions all ACTIVE contracts for that employee to TERMINATED.',
      category: 'Human Resources',
      visibility: 'ROLE_RESTRICTED',
      allowedRoles: ['HR_OFFICER', 'REGISTRAR'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['hr', 'contract', 'reviewer', 'leave', 'half-day', 'overlap', 'terminated', 'staff'],
      citations: ['HR Policy Manual §3.8'],
      status: 'PUBLISHED',
      authorUserId: 'usr-hr-primary',
      authorName: 'Beatrice Wanjiku (HR Officer)',
      reviewedByUserId: 'usr-reg-001',
      reviewedByName: 'H. Oduor (Registrar)',
      updatedAt: '2026-10-25T15:00:00Z',
    },
    {
      id: 'kba-7',
      slug: 'it-support-internal-notes-and-pii-redaction',
      title: 'Help Centre Internal Notes Filtering & AI PII Redaction Guardrails',
      summary: 'Privacy rules for support tickets, ticket priority assignment, and redaction of sensitive strings.',
      body:
        'General Help Centre tickets automatically compute priority on the server; requesters cannot self-assign URGENT priority. Internal staff notes attached to a ticket are stripped from requester API responses. Before dispatching questions to AI models, the AI Support Centre redacts emails, Kenyan phone numbers, and National ID digit strings.',
      category: 'IT & Security',
      visibility: 'ROLE_RESTRICTED',
      allowedRoles: ['IT_SUPPORT', 'REGISTRAR'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['internal', 'notes', 'ticket', 'priority', 'redact', 'pii', 'email', 'id', 'phone'],
      citations: ['Information Security & Support SOP §9'],
      status: 'PUBLISHED',
      authorUserId: 'usr-it-001',
      authorName: 'K. Mutiso (IT Support)',
      reviewedByUserId: 'usr-reg-001',
      reviewedByName: 'H. Oduor (Registrar)',
      updatedAt: '2026-10-26T16:10:00Z',
    },
    {
      id: 'kba-8',
      slug: 'draft-hostel-winter-policy',
      title: 'Draft: Peak Trimester Hostel Key-Return Compliance Addendum',
      summary: 'Draft update pending independent review before publication to student knowledge base.',
      body:
        'Residents checking out at trimester close must return room keys to the block warden before final clearance.',
      category: 'Campus Operations',
      visibility: 'ALL_AUTHENTICATED',
      allowedRoles: ['STUDENT', 'IT_SUPPORT'],
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: ['hostel', 'key', 'checkout'],
      citations: ['Hostel SOP Draft'],
      status: 'PENDING_REVIEW',
      authorUserId: 'usr-it-001',
      authorName: 'K. Mutiso (IT Support)',
      updatedAt: '2026-11-05T10:00:00Z',
    },
  ],
  conversations: [
    {
      id: 'conv-stu-1',
      ownerUserId: 'usr-stu-001',
      ownerName: 'Brian Omondi Otieno',
      ownerRole: 'STUDENT',
      title: 'CDACC Examination & Library Loan Rules',
      status: 'OPEN',
      messages: [
        {
          id: 'm1',
          role: 'USER',
          content: 'How do I prepare and register for TVET CDACC & KNEC examinations?',
          redactedQuery: 'How do I prepare and register for TVET CDACC & KNEC examinations?',
          redactionsApplied: [],
          mode: 'KNOWLEDGE_ONLY',
          createdAt: '2026-11-10T09:15:00Z',
        },
        {
          id: 'm2',
          role: 'ASSISTANT',
          content:
            'Based on approved institutional policy: Students must maintain at least 80% attendance and complete Unit Registration before examination scheduling. All CAT and CBT results undergo independent Chief Examiner moderation before official release to the Student Portal and Transcript engine (TRX).',
          citedArticles: [
            {
              id: 'kba-1',
              slug: 'student-cdacc-knec-exam-registration',
              title: 'TVET CDACC & KNEC Examination Registration & Moderation Policy',
            },
          ],
          mode: 'KNOWLEDGE_ONLY',
          createdAt: '2026-11-10T09:15:01Z',
        },
      ],
      createdAt: '2026-11-10T09:15:00Z',
      updatedAt: '2026-11-10T09:15:01Z',
    },
  ],
  quota: {
    monthKey: currentMonthKey(),
    monthlyLimitPerUser: 300,
    usedCounts: {
      STUDENT: 4,
      LECTURER: 2,
      REGISTRAR: 1,
      FINANCE_OFFICER: 1,
      HR_OFFICER: 1,
      LIBRARIAN: 0,
      IT_SUPPORT: 3,
    },
  },
  tickets: [
    {
      id: 'tkt-1',
      ticketRef: 'SUP-2026-0104',
      requesterUserId: 'usr-stu-001',
      requesterName: 'Brian Omondi Otieno (HCA/STU/2026/001)',
      requesterRole: 'STUDENT',
      category: 'PORTAL_TECH',
      priority: 'NORMAL',
      status: 'IN_PROGRESS',
      subject: 'Cannot download DICT-L6 Lab Manual EPUB from offline mirror',
      description: 'Clicking the offline EPUB reader returns a timeout on the Nairobi campus Wi-Fi VLAN.',
      assignedToName: 'K. Mutiso (IT Support)',
      transcriptIncluded: false,
      messages: [
        {
          id: 'tm-1',
          authorUserId: 'usr-it-001',
          authorName: 'K. Mutiso (IT Support)',
          authorRole: 'IT_SUPPORT',
          body: 'We are refreshing the Nairobi campus local digital library CDN cache now.',
          isInternalNote: false,
          createdAt: '2026-11-11T10:15:00Z',
        },
        {
          id: 'tm-2',
          authorUserId: 'usr-it-001',
          authorName: 'K. Mutiso (IT Support)',
          authorRole: 'IT_SUPPORT',
          body: 'INTERNAL: Reverse-proxy nginx buffer limit bumped from 16m to 64m on vlan-14; monitor 30 mins before closing.',
          isInternalNote: true,
          createdAt: '2026-11-11T10:18:00Z',
        },
      ],
      createdAt: '2026-11-11T09:40:00Z',
      updatedAt: '2026-11-11T10:18:00Z',
    },
  ],
  auditLog: [
    {
      id: 'saud-1',
      actor: 'System Support Engine',
      action: 'Ticket SUP-2026-0104 created with system-assigned NORMAL priority (zero PII logged).',
      timestamp: '2026-11-11T09:40:00Z',
    },
  ],
};

function loadState(): SupportCentreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as SupportCentreState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: SupportCentreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function redactSensitiveInput(raw: string): {
  redacted: string;
  redactionsApplied: string[];
} {
  const redactionsApplied: string[] = [];
  let text = raw;

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailRegex.test(text)) {
    redactionsApplied.push('Email address');
    text = text.replace(emailRegex, '[REDACTED_EMAIL]');
  }

  const phoneRegex = /(?:\+254|0)[17]\d{8}\b/g;
  if (phoneRegex.test(text)) {
    redactionsApplied.push('Kenyan Phone Number');
    text = text.replace(phoneRegex, '[REDACTED_PHONE]');
  }

  const nationalIdRegex = /\b\d{7,9}\b/g;
  if (nationalIdRegex.test(text)) {
    redactionsApplied.push('ID / Numeric Identifier');
    text = text.replace(nationalIdRegex, '[REDACTED_ID]');
  }

  return { redacted: text, redactionsApplied };
}

function isPersonalDataProbe(query: string): boolean {
  const lower = query.toLowerCase();
  return (
    (lower.includes('my ') || lower.includes('show ') || lower.includes('check ')) &&
    (lower.includes('grade') ||
      lower.includes('marks') ||
      lower.includes('salary') ||
      lower.includes('invoice') ||
      lower.includes('fee balance') ||
      lower.includes('password'))
  );
}

function computeSystemPriority(category: SupportTicketCategory): SupportTicketPriority {
  if (category === 'ACCOUNT_ACCESS' || category === 'EXAMS_RESULTS') return 'HIGH';
  if (category === 'HOSTEL_GENERAL') return 'LOW';
  return 'NORMAL';
}

export const aiSupportCentreService = {
  getState(): SupportCentreState {
    return loadState();
  },

  getReadableKnowledgeForRole(role: SupportAssistantRole, query = ''): AISupportKnowledgeArticle[] {
    const state = loadState();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Nairobi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const isStaff = role !== 'STUDENT';
    const q = query.trim().toLowerCase();

    return state.articles.filter((art) => {
      if (art.status !== 'PUBLISHED') return false;
      if (today < art.effectiveFrom || today > art.effectiveTo) return false;

      if (art.visibility === 'STAFF_ONLY' && !isStaff) return false;
      if (art.visibility === 'ROLE_RESTRICTED' && !art.allowedRoles.includes(role)) return false;

      if (!q) return true;
      const hay = `${art.title} ${art.summary} ${art.body} ${art.keywords.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  },

  sendMessage(input: {
    role: SupportAssistantRole;
    conversationId?: string;
    prompt: string;
  }): { ok: boolean; error?: string; conversationId?: string } {
    const state = loadState();
    const persona = ASSISTANT_PERSONAS[input.role];
    const cleanPrompt = input.prompt.trim();
    if (!cleanPrompt) return { ok: false, error: 'Enter a support question first.' };

    const used = state.quota.usedCounts[input.role] ?? 0;
    if (used >= state.quota.monthlyLimitPerUser) {
      return {
        ok: false,
        error: `Monthly AI Support quota (${state.quota.monthlyLimitPerUser} messages) reached for ${persona.title}. Hand off to a Help Centre ticket below.`,
      };
    }

    const { redacted, redactionsApplied } = redactSensitiveInput(cleanPrompt);

    let conv = input.conversationId
      ? state.conversations.find(
          (c) => c.id === input.conversationId && c.ownerUserId === persona.userId
        )
      : undefined;

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        ownerUserId: persona.userId,
        ownerName: persona.name,
        ownerRole: input.role,
        title: cleanPrompt.slice(0, 52),
        status: 'OPEN',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.conversations.unshift(conv);
    }

    if (conv.status === 'CLOSED') {
      return { ok: false, error: 'This conversation is closed. Start a new private thread.' };
    }

    const userMsg: AISupportMessage = {
      id: `am-${Date.now()}`,
      role: 'USER',
      content: cleanPrompt,
      redactedQuery: redacted,
      redactionsApplied,
      mode: 'KNOWLEDGE_ONLY',
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    // Increment monthly quota
    state.quota.usedCounts[input.role] = used + 1;

    // Personal-data refusal check
    let replyText = '';
    let citedArticles: { id: string; slug: string; title: string }[] = [];

    if (isPersonalDataProbe(redacted)) {
      replyText =
        'Security boundary notice: The AI Support Centre operates in permission-filtered knowledge mode and never queries private student grades, personal invoices, staff salaries, or passwords. Use your Student/HR/Finance Portal directly or hand off to a Help Centre support ticket for authorized review.';
    } else {
      const readable = this.getReadableKnowledgeForRole(input.role);
      const tokens = redacted
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3);

      const scored = readable
        .map((art) => {
          let score = 0;
          const hay = `${art.title} ${art.summary} ${art.body}`.toLowerCase();
          for (const tk of tokens) {
            if (art.keywords.some((k) => k.includes(tk))) score += 3;
            if (art.title.toLowerCase().includes(tk)) score += 2.5;
            if (hay.includes(tk)) score += 1;
          }
          return { art, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      if (scored.length === 0) {
        replyText = `No approved institutional knowledge articles accessible to your role (${persona.title}) directly match "${redacted}". To avoid fabricating unverified policy, please refine your question or use "Handoff to Human Support Ticket" below.`;
      } else {
        citedArticles = scored.map((s) => ({
          id: s.art.id,
          slug: s.art.slug,
          title: s.art.title,
        }));
        replyText = scored
          .map((s) => `• ${s.art.title}: ${s.art.body}`)
          .join('\n\n');
      }
    }

    const assistantMsg: AISupportMessage = {
      id: `am-${Date.now() + 1}`,
      role: 'ASSISTANT',
      content: replyText,
      citedArticles,
      mode: 'KNOWLEDGE_ONLY',
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(assistantMsg);
    conv.updatedAt = new Date().toISOString();

    state.auditLog.unshift({
      id: `saud-${Date.now()}`,
      actor: persona.name,
      action: `AI Support query processed in KNOWLEDGE_ONLY mode (${redactionsApplied.length} PII patterns redacted).`,
      timestamp: new Date().toISOString(),
    });

    saveState(state);
    return { ok: true, conversationId: conv.id };
  },

  closeOwnConversation(conversationId: string, ownerUserId: string): { ok: boolean; error?: string } {
    const state = loadState();
    const conv = state.conversations.find(
      (c) => c.id === conversationId && c.ownerUserId === ownerUserId
    );
    if (!conv) return { ok: false, error: 'Conversation not found or unauthorized.' };
    if (conv.status === 'HANDED_OFF') {
      return { ok: false, error: 'Escalated conversations remain linked to their Support Ticket.' };
    }
    conv.status = 'CLOSED';
    saveState(state);
    return { ok: true };
  },

  handoffConversationToTicket(input: {
    conversationId: string;
    role: SupportAssistantRole;
    category: SupportTicketCategory;
    includeTranscript: boolean;
  }): { ok: boolean; error?: string; ticketRef?: string } {
    const state = loadState();
    const persona = ASSISTANT_PERSONAS[input.role];
    const conv = state.conversations.find(
      (c) => c.id === input.conversationId && c.ownerUserId === persona.userId
    );
    if (!conv) return { ok: false, error: 'Only the conversation owner can hand off to support.' };

    const transcriptText = input.includeTranscript
      ? conv.messages
          .map((m) => `[${m.role}] ${m.redactedQuery ?? m.content}`)
          .join('\n')
      : 'User opted not to attach AI chat transcript.';

    const ticketRef = `SUP-2026-${String(state.tickets.length + 105).padStart(4, '0')}`;
    const priority = computeSystemPriority(input.category);

    state.tickets.unshift({
      id: `tkt-${Date.now()}`,
      ticketRef,
      requesterUserId: persona.userId,
      requesterName: persona.name,
      requesterRole: input.role,
      category: input.category,
      priority,
      status: 'OPEN',
      subject: `AI Handoff: ${conv.title}`,
      description: transcriptText,
      handoffConversationId: conv.id,
      transcriptIncluded: input.includeTranscript,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    conv.status = 'HANDED_OFF';
    conv.linkedTicketRef = ticketRef;

    state.auditLog.unshift({
      id: `saud-${Date.now()}`,
      actor: persona.name,
      action: `Handed off conversation to Support Ticket ${ticketRef} (transcript ${input.includeTranscript ? 'attached' : 'omitted'}).`,
      timestamp: new Date().toISOString(),
    });

    saveState(state);
    return { ok: true, ticketRef };
  },

  createKnowledgeDraft(input: {
    title: string;
    summary: string;
    body: string;
    category: string;
    visibility: KnowledgeVisibility;
    allowedRoles: SupportAssistantRole[];
    authorUserId: string;
    authorName: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    state.articles.unshift({
      id: `kba-${Date.now()}`,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      title: input.title.trim(),
      summary: input.summary.trim(),
      body: input.body.trim(),
      category: input.category,
      visibility: input.visibility,
      allowedRoles: input.allowedRoles,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      keywords: input.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
      citations: ['Draft Institutional Policy'],
      status: 'PENDING_REVIEW',
      authorUserId: input.authorUserId,
      authorName: input.authorName,
      updatedAt: new Date().toISOString(),
    });
    state.auditLog.unshift({
      id: `saud-${Date.now()}`,
      actor: input.authorName,
      action: `Submitted knowledge draft "${input.title.trim()}" for independent review.`,
      timestamp: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true };
  },

  reviewKnowledgeArticle(input: {
    articleId: string;
    decision: 'PUBLISHED' | 'REJECTED';
    reviewerUserId: string;
    reviewerName: string;
    note: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const art = state.articles.find((a) => a.id === input.articleId);
    if (!art) return { ok: false, error: 'Knowledge article not found.' };
    if (art.authorUserId === input.reviewerUserId) {
      return {
        ok: false,
        error: 'Independent review required: Article author cannot approve or reject their own submission.',
      };
    }
    if (input.decision === 'REJECTED' && !input.note.trim()) {
      return { ok: false, error: 'Rejection requires a review note.' };
    }
    art.status = input.decision;
    art.reviewedByUserId = input.reviewerUserId;
    art.reviewedByName = input.reviewerName;
    art.reviewNote = input.note.trim();
    art.updatedAt = new Date().toISOString();

    state.auditLog.unshift({
      id: `saud-${Date.now()}`,
      actor: input.reviewerName,
      action: `${input.decision} knowledge article "${art.title}".`,
      timestamp: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true };
  },

  createSupportTicket(input: {
    role: SupportAssistantRole;
    category: SupportTicketCategory;
    subject: string;
    description: string;
  }): { ok: boolean; error?: string; ticketRef?: string } {
    const state = loadState();
    const persona = ASSISTANT_PERSONAS[input.role];
    const ticketRef = `SUP-2026-${String(state.tickets.length + 105).padStart(4, '0')}`;
    const priority = computeSystemPriority(input.category);

    state.tickets.unshift({
      id: `tkt-${Date.now()}`,
      ticketRef,
      requesterUserId: persona.userId,
      requesterName: persona.name,
      requesterRole: input.role,
      category: input.category,
      priority,
      status: 'OPEN',
      subject: input.subject.trim(),
      description: input.description.trim(),
      transcriptIncluded: false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    state.auditLog.unshift({
      id: `saud-${Date.now()}`,
      actor: persona.name,
      action: `Created Help Centre ticket ${ticketRef} (${input.category}, system priority ${priority}).`,
      timestamp: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true, ticketRef };
  },

  replyToTicket(input: {
    ticketId: string;
    role: SupportAssistantRole;
    body: string;
    isInternalNote: boolean;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const persona = ASSISTANT_PERSONAS[input.role];
    const tkt = state.tickets.find((t) => t.id === input.ticketId);
    if (!tkt) return { ok: false, error: 'Ticket not found.' };
    if (tkt.status === 'CLOSED') {
      return { ok: false, error: 'Closed tickets cannot receive replies until reopened.' };
    }
    if (input.isInternalNote && input.role !== 'IT_SUPPORT') {
      return { ok: false, error: 'Only support officers may record internal staff notes.' };
    }
    const msg: SupportTicketMessage = {
      id: `tm-${Date.now()}`,
      authorUserId: persona.userId,
      authorName: persona.name,
      authorRole: input.role,
      body: input.body.trim(),
      isInternalNote: input.isInternalNote,
      createdAt: new Date().toISOString(),
    };
    tkt.messages.push(msg);
    tkt.updatedAt = new Date().toISOString();

    state.auditLog.unshift({
      id: `saud-${Date.now()}`,
      actor: persona.name,
      action: `Added ${input.isInternalNote ? 'internal note' : 'public reply'} on ticket ${tkt.ticketRef}.`,
      timestamp: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true };
  },

  transitionTicketStatus(
    ticketId: string,
    nextStatus: SupportTicketStatus,
    actorName: string
  ): { ok: boolean; error?: string } {
    const state = loadState();
    const tkt = state.tickets.find((t) => t.id === ticketId);
    if (!tkt) return { ok: false, error: 'Ticket not found.' };
    tkt.status = nextStatus;
    if (nextStatus === 'ASSIGNED' && !tkt.assignedToName) {
      tkt.assignedToName = actorName;
    }
    tkt.updatedAt = new Date().toISOString();
    state.auditLog.unshift({
      id: `saud-${Date.now()}`,
      actor: actorName,
      action: `Transitioned ticket ${tkt.ticketRef} to ${nextStatus}.`,
      timestamp: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true };
  },

  /** Strict Internal Notes Filtering per SUPPORT-HELP-CENTRE.md */
  getVisibleTicketMessages(
    ticket: GeneralSupportTicket,
    viewerRole: SupportAssistantRole
  ): SupportTicketMessage[] {
    if (viewerRole === 'IT_SUPPORT') return ticket.messages;
    return ticket.messages.filter((m) => !m.isInternalNote);
  },
};

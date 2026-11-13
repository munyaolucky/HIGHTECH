import {
  DocumentAccessPolicy,
  DocumentCategory,
  InstitutionalDocument,
  QualityEvidence,
  QualityFinding,
  QualityFramework,
  QualityReviewCycle,
} from '../types/campusOps';

const STORAGE_KEY = 'hitech_quality_docs_reports_v1';

const BROAD_POLICY_ALLOWED_CATEGORIES: DocumentCategory[] = [
  'academics',
  'library',
  'website-media',
  'policies-forms',
];
const PUBLIC_POLICY_ALLOWED_CATEGORIES: DocumentCategory[] = [
  'library',
  'website-media',
  'policies-forms',
];

interface QualityDocsState {
  documents: InstitutionalDocument[];
  frameworks: QualityFramework[];
  reviews: QualityReviewCycle[];
  evidence: QualityEvidence[];
  findings: QualityFinding[];
}

const INITIAL_STATE: QualityDocsState = {
  documents: [
    {
      id: 'doc-1',
      reference: 'DOC-2026-001',
      title: 'HI-TECH Quality Management Policy Manual v4.2',
      category: 'policies-forms',
      branch: 'Nairobi Main Campus',
      fileName: 'hitech-qms-manual-v4.2.pdf',
      mimeType: 'application/pdf',
      fileSizeKb: 1420,
      version: 2,
      accessPolicy: 'PUBLIC',
      status: 'APPROVED',
      ownerUserId: 'usr-qa-officer',
      ownerName: 'C. Mwenda (QA Officer)',
      uploaderUserId: 'usr-qa-officer',
      reviewedByName: 'Dr. Samuel Karanja (Principal)',
      grants: [],
      createdAt: '2026-09-12T10:00:00Z',
    },
    {
      id: 'doc-2',
      reference: 'DOC-2026-019',
      title: 'Private Student Counselling & Medical Intake Form',
      category: 'hostel-welfare',
      branch: 'Nairobi Main Campus',
      fileName: 'student-counselling-intake.pdf',
      mimeType: 'application/pdf',
      fileSizeKb: 380,
      version: 1,
      accessPolicy: 'OWNER_ONLY',
      status: 'APPROVED',
      ownerUserId: 'usr-welfare',
      ownerName: 'L. Wambui (Student Services)',
      uploaderUserId: 'usr-welfare',
      reviewedByName: 'Dr. Samuel Karanja (Principal)',
      grants: [],
      createdAt: '2026-10-03T11:30:00Z',
    },
    {
      id: 'doc-3',
      reference: 'DOC-2026-024',
      title: 'TVETA Computing Lab Equipment & Safety Inspection Checklist',
      category: 'academics',
      branch: 'Nairobi Main Campus',
      fileName: 'tveta-lab-audit-2026.pdf',
      mimeType: 'application/pdf',
      fileSizeKb: 890,
      version: 1,
      accessPolicy: 'AUTHENTICATED',
      status: 'PENDING_REVIEW',
      ownerUserId: 'usr-qa-officer',
      ownerName: 'C. Mwenda (QA Officer)',
      uploaderUserId: 'usr-qa-officer',
      grants: [],
      createdAt: '2026-11-01T08:45:00Z',
    },
  ],
  frameworks: [
    {
      id: 'qfw-tveta',
      code: 'TVETA-STD-2026',
      title: 'TVETA Institutional Accreditation & CDACC Assessment Compliance Framework',
      authority: 'TVETA / KNQA Kenya',
      version: '2026.1',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2028-12-31',
      status: 'APPROVED',
      createdByUserId: 'usr-qa-officer',
      createdByName: 'C. Mwenda (QA Officer)',
      reviewedByName: 'Dr. Samuel Karanja (Principal)',
      standards: [
        {
          id: 'std-1',
          code: 'TVETA-S1',
          statement: 'Workshop & computing laboratories meet trainer-to-trainee workstation ratios and electrical safety standards.',
        },
        {
          id: 'std-2',
          code: 'TVETA-S2',
          statement: 'All CBT and practical assessment instruments undergo independent moderation prior to examination window.',
        },
      ],
    },
  ],
  reviews: [
    {
      id: 'qrev-1',
      code: 'AUD-NRB-2026-Q4',
      frameworkId: 'qfw-tveta',
      branch: 'Nairobi Main Campus',
      title: 'Nairobi Main Campus Q4 ICT Lab & CBT Accreditation Readiness Audit',
      leadUserId: 'usr-qa-officer',
      leadName: 'C. Mwenda (QA Officer)',
      creatorUserId: 'usr-qa-officer',
      startDate: '2026-10-15',
      dueDate: '2026-12-10',
      status: 'IN_PROGRESS',
    },
  ],
  evidence: [
    {
      id: 'qev-1',
      reviewId: 'qrev-1',
      standardCode: 'TVETA-S1',
      documentId: 'doc-1',
      documentTitle: 'HI-TECH Quality Management Policy Manual v4.2',
      summary: 'Approved institutional QMS manual establishing periodic lab safety audit schedules.',
      submittedByUserId: 'usr-qa-officer',
      submittedByName: 'C. Mwenda (QA Officer)',
      status: 'PENDING',
    },
  ],
  findings: [
    {
      id: 'qfnd-1',
      reviewId: 'qrev-1',
      standardCode: 'TVETA-S1',
      severity: 'MODERATE',
      description: 'Lab 2 emergency UPS battery bank replacement overdue by 14 days.',
      rootCause: 'Procurement vendor delivery rescheduling during mid-trimester assessment week.',
      status: 'IN_REMEDIATION',
      actions: [
        {
          id: 'qact-1',
          title: 'Install & load-test 6kVA UPS battery rack in Computing Lab 2',
          ownerName: 'Eng. Peter Kamau',
          dueDate: '2026-11-25',
          status: 'SUBMITTED_FOR_VERIFICATION',
          creatorUserId: 'usr-qa-officer',
          completionNote: 'Replaced 4 batteries and logged 45-minute full load test.',
        },
      ],
    },
  ],
};

function loadState(): QualityDocsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return structuredClone(INITIAL_STATE);
    }
    return JSON.parse(raw) as QualityDocsState;
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function saveState(state: QualityDocsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/** CSV Formula-injection protection + mandatory quoting per REPORTS-ANALYTICS.md */
export function sanitizeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  const trimmed = str.trimStart();
  const safe =
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
      ? `'${str}`
      : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildSafeCsv(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  // UTF-8 BOM + CRLF
  return `\uFEFF${[headerLine, ...dataLines].join('\r\n')}`;
}

export const qualityDocsReportsService = {
  getState(): QualityDocsState {
    return loadState();
  },

  uploadDocument(input: {
    title: string;
    category: DocumentCategory;
    branch: string;
    fileName: string;
    accessPolicy: DocumentAccessPolicy;
    ownerUserId: string;
    ownerName: string;
  }): { ok: boolean; error?: string } {
    if (
      input.accessPolicy === 'PUBLIC' &&
      !PUBLIC_POLICY_ALLOWED_CATEGORIES.includes(input.category)
    ) {
      return {
        ok: false,
        error: `PUBLIC access policy is restricted to ${PUBLIC_POLICY_ALLOWED_CATEGORIES.join(', ')}. Sensitive categories must use OWNER_ONLY.`,
      };
    }
    if (
      (input.accessPolicy === 'AUTHENTICATED' || input.accessPolicy === 'STAFF_ONLY') &&
      !BROAD_POLICY_ALLOWED_CATEGORIES.includes(input.category)
    ) {
      return {
        ok: false,
        error: `Broad policies are restricted for category "${input.category}". Use OWNER_ONLY + explicit named grants.`,
      };
    }
    const state = loadState();
    state.documents.unshift({
      id: `doc-${Date.now()}`,
      reference: `DOC-2026-${String(state.documents.length + 30).padStart(3, '0')}`,
      title: input.title.trim(),
      category: input.category,
      branch: input.branch,
      fileName: input.fileName.trim() || 'upload.pdf',
      mimeType: 'application/pdf',
      fileSizeKb: 540,
      version: 1,
      accessPolicy: input.accessPolicy,
      status: 'PENDING_REVIEW',
      ownerUserId: input.ownerUserId,
      ownerName: input.ownerName,
      uploaderUserId: input.ownerUserId,
      grants: [],
      createdAt: new Date().toISOString(),
    });
    saveState(state);
    return { ok: true };
  },

  reviewDocument(input: {
    docId: string;
    decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
    reviewerUserId: string;
    reviewerName: string;
    note: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const doc = state.documents.find((d) => d.id === input.docId);
    if (!doc) return { ok: false, error: 'Document not found.' };
    if (doc.ownerUserId === input.reviewerUserId || doc.uploaderUserId === input.reviewerUserId) {
      return {
        ok: false,
        error: 'Separation of duties violation: Document owner or uploader cannot approve their own version.',
      };
    }
    doc.status = input.decision;
    doc.reviewedByName = input.reviewerName;
    doc.reviewNote = input.note.trim();
    saveState(state);
    return { ok: true };
  },

  grantDocumentAccess(docId: string, granteeEmail: string, expiresAt: string, canDownload: boolean): { ok: boolean; error?: string } {
    const state = loadState();
    const doc = state.documents.find((d) => d.id === docId);
    if (!doc) return { ok: false, error: 'Document not found.' };
    if (!expiresAt) return { ok: false, error: 'Named access grants require an expiry date.' };
    doc.grants.push({
      id: `gr-${Date.now()}`,
      granteeEmail: granteeEmail.trim(),
      canDownload,
      expiresAt,
    });
    saveState(state);
    return { ok: true };
  },

  linkQualityEvidence(input: {
    reviewId: string;
    standardCode: string;
    documentId: string;
    summary: string;
    submitterUserId: string;
    submitterName: string;
  }): { ok: boolean; error?: string } {
    const state = loadState();
    const doc = state.documents.find((d) => d.id === input.documentId);
    if (!doc) return { ok: false, error: 'Document not found.' };
    if (doc.status !== 'APPROVED') {
      return { ok: false, error: 'Only APPROVED documents may be attached as accreditation evidence.' };
    }
    if (doc.accessPolicy === 'OWNER_ONLY') {
      return {
        ok: false,
        error: 'Security block: OWNER_ONLY confidential documents cannot be attached as shared quality evidence.',
      };
    }
    state.evidence.unshift({
      id: `qev-${Date.now()}`,
      reviewId: input.reviewId,
      standardCode: input.standardCode,
      documentId: doc.id,
      documentTitle: doc.title,
      summary: input.summary.trim(),
      submittedByUserId: input.submitterUserId,
      submittedByName: input.submitterName,
      status: 'PENDING',
    });
    saveState(state);
    return { ok: true };
  },

  verifyEvidence(evidenceId: string, verifierUserId: string, verifierName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const ev = state.evidence.find((e) => e.id === evidenceId);
    if (!ev) return { ok: false, error: 'Evidence not found.' };
    if (ev.submittedByUserId === verifierUserId) {
      return { ok: false, error: 'Submitter cannot verify their own quality evidence.' };
    }
    ev.status = 'VERIFIED';
    ev.verifiedByName = verifierName;
    saveState(state);
    return { ok: true };
  },

  verifyFindingAction(findingId: string, actionId: string, verifierUserId: string): { ok: boolean; error?: string } {
    const state = loadState();
    const fnd = state.findings.find((f) => f.id === findingId);
    if (!fnd) return { ok: false, error: 'Finding not found.' };
    const act = fnd.actions.find((a) => a.id === actionId);
    if (!act) return { ok: false, error: 'Action not found.' };
    if (act.creatorUserId === verifierUserId) {
      return { ok: false, error: 'Independent reviewer required to verify corrective action.' };
    }
    act.status = 'VERIFIED';
    saveState(state);
    return { ok: true };
  },

  closeFinding(findingId: string, closureNote: string): { ok: boolean; error?: string } {
    const state = loadState();
    const fnd = state.findings.find((f) => f.id === findingId);
    if (!fnd) return { ok: false, error: 'Finding not found.' };
    const unverified = fnd.actions.some(
      (a) => a.status !== 'VERIFIED' && a.status !== 'CANCELLED'
    );
    if (unverified) {
      return {
        ok: false,
        error: 'Cannot close finding while corrective actions remain unverified.',
      };
    }
    if (!closureNote.trim()) {
      return { ok: false, error: 'Closure requires a formal closure note.' };
    }
    fnd.status = 'CLOSED';
    fnd.closureNote = closureNote.trim();
    saveState(state);
    return { ok: true };
  },

  closeReviewCycle(reviewId: string, reviewerUserId: string, reviewerName: string): { ok: boolean; error?: string } {
    const state = loadState();
    const rev = state.reviews.find((r) => r.id === reviewId);
    if (!rev) return { ok: false, error: 'Review cycle not found.' };
    if (rev.creatorUserId === reviewerUserId || rev.leadUserId === reviewerUserId) {
      return {
        ok: false,
        error: 'Independent approval required: neither review creator nor assigned lead may close it.',
      };
    }
    const openFinding = state.findings.some(
      (f) => f.reviewId === reviewId && f.status !== 'CLOSED' && f.status !== 'RISK_ACCEPTED'
    );
    if (openFinding) {
      return {
        ok: false,
        error: 'Cannot close review cycle while findings remain OPEN or IN_REMEDIATION.',
      };
    }
    rev.status = 'APPROVED_CLOSED';
    rev.reviewedByName = reviewerName;
    saveState(state);
    return { ok: true };
  },

  validateDateWindow(from: string, to: string): { ok: boolean; error?: string } {
    if (!from || !to) return { ok: false, error: 'Specify inclusive from and to dates.' };
    if (from > to) return { ok: false, error: 'Date window cannot be reversed (from > to).' };
    const diffDays =
      (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 731) {
      return { ok: false, error: 'Maximum executive report window is 731 days.' };
    }
    return { ok: true };
  },
};

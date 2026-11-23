import type {
  DocumentCategory,
  DocumentConfidentiality,
  DocumentDesignConfig,
} from '../../data/store.ts';
import type { ValidationResult } from '../staff/staff.schemas.ts';

const VALID_CATEGORIES = new Set<DocumentCategory>([
  'ADMISSION_LETTER',
  'TRANSCRIPT_CERTIFICATE',
  'FEE_STATEMENT',
  'EXAM_SCHEDULE',
  'EMPLOYMENT_CONTRACT',
  'INSTITUTIONAL_POLICY',
  'OFFICIAL_MEMO',
  'STUDENT_WELFARE_CONFIDENTIAL',
]);

const VALID_CONFIDENTIALITY = new Set<DocumentConfidentiality>([
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
]);

const DEFAULT_DESIGN: DocumentDesignConfig = {
  fontFamily: 'serif',
  fontSizePt: 11,
  accentColor: 'navy',
  alignment: 'left',
  showWatermark: false,
  watermarkText: 'HI-TECH COLLEGE',
  showHeader: true,
  showFooter: true,
  showSignatureBlock: true,
  showQrBlock: true,
};

function sanitizeDesign(raw: unknown): DocumentDesignConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DESIGN };
  const d = raw as Record<string, unknown>;
  const fontFamily =
    d.fontFamily === 'sans' || d.fontFamily === 'mono' || d.fontFamily === 'serif'
      ? d.fontFamily
      : 'serif';
  const accentColor =
    d.accentColor === 'navy' ||
    d.accentColor === 'academic-blue' ||
    d.accentColor === 'gold' ||
    d.accentColor === 'crimson'
      ? d.accentColor
      : 'navy';
  const alignment = d.alignment === 'justify' ? 'justify' : 'left';
  const fontSizeNum = Number(d.fontSizePt ?? 11);
  const fontSizePt = Number.isFinite(fontSizeNum)
    ? Math.max(9, Math.min(16, Math.round(fontSizeNum)))
    : 11;

  return {
    fontFamily,
    fontSizePt,
    accentColor,
    alignment,
    showWatermark: Boolean(d.showWatermark),
    watermarkText: String(d.watermarkText ?? 'HI-TECH COLLEGE').trim().slice(0, 40) || 'HI-TECH COLLEGE',
    showHeader: d.showHeader !== false,
    showFooter: d.showFooter !== false,
    showSignatureBlock: d.showSignatureBlock !== false,
    showQrBlock: d.showQrBlock !== false,
  };
}

function sanitizeFields(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = String(k).trim().slice(0, 60);
    if (key) {
      result[key] = String(v ?? '').trim().slice(0, 400);
    }
  }
  return result;
}

export function validateCreateDocument(body: unknown): ValidationResult<{
  title: string;
  category: DocumentCategory;
  confidentiality: DocumentConfidentiality;
  recipientLabel: string;
  recipientEmail?: string;
  subjectLine: string;
  bodyContent: string;
  metadataFields: Record<string, string>;
  design: DocumentDesignConfig;
  templateId: string | null;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const title = String(obj.title ?? '').trim();
  const category = String(obj.category ?? 'OFFICIAL_MEMO').trim() as DocumentCategory;
  const confidentiality = String(
    obj.confidentiality ?? 'INTERNAL'
  ).trim() as DocumentConfidentiality;
  const recipientLabel = String(obj.recipientLabel ?? '').trim() || 'Concerned Office';
  const recipientEmail = obj.recipientEmail ? String(obj.recipientEmail).trim() : undefined;
  const subjectLine = String(obj.subjectLine ?? '').trim() || title;
  const bodyContent = String(obj.bodyContent ?? '').trim();
  const templateId = obj.templateId ? String(obj.templateId).trim() : null;

  if (title.length < 3 || title.length > 180) {
    return { ok: false, error: 'Document title must be between 3 and 180 characters.' };
  }
  if (!VALID_CATEGORIES.has(category)) {
    return { ok: false, error: 'Invalid document category.' };
  }
  if (!VALID_CONFIDENTIALITY.has(confidentiality)) {
    return { ok: false, error: 'Invalid confidentiality level.' };
  }
  if (bodyContent.length < 10) {
    return { ok: false, error: 'Document body content must be at least 10 characters.' };
  }

  return {
    ok: true,
    data: {
      title,
      category,
      confidentiality,
      recipientLabel,
      recipientEmail,
      subjectLine,
      bodyContent,
      metadataFields: sanitizeFields(obj.metadataFields),
      design: sanitizeDesign(obj.design),
      templateId,
    },
  };
}

export function validateUpdateDocument(body: unknown): ValidationResult<{
  title?: string;
  confidentiality?: DocumentConfidentiality;
  recipientLabel?: string;
  subjectLine?: string;
  bodyContent?: string;
  metadataFields?: Record<string, string>;
  design?: DocumentDesignConfig;
  changeNote?: string;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const patch: {
    title?: string;
    confidentiality?: DocumentConfidentiality;
    recipientLabel?: string;
    subjectLine?: string;
    bodyContent?: string;
    metadataFields?: Record<string, string>;
    design?: DocumentDesignConfig;
    changeNote?: string;
  } = {};

  if (obj.title !== undefined) {
    const title = String(obj.title).trim();
    if (title.length < 3) return { ok: false, error: 'Title must be at least 3 characters.' };
    patch.title = title;
  }
  if (obj.confidentiality !== undefined) {
    const c = String(obj.confidentiality).trim() as DocumentConfidentiality;
    if (!VALID_CONFIDENTIALITY.has(c)) return { ok: false, error: 'Invalid confidentiality.' };
    patch.confidentiality = c;
  }
  if (obj.recipientLabel !== undefined) {
    patch.recipientLabel = String(obj.recipientLabel).trim();
  }
  if (obj.subjectLine !== undefined) {
    patch.subjectLine = String(obj.subjectLine).trim();
  }
  if (obj.bodyContent !== undefined) {
    const b = String(obj.bodyContent).trim();
    if (b.length < 10) return { ok: false, error: 'Body content must be at least 10 characters.' };
    patch.bodyContent = b;
  }
  if (obj.metadataFields !== undefined) {
    patch.metadataFields = sanitizeFields(obj.metadataFields);
  }
  if (obj.design !== undefined) {
    patch.design = sanitizeDesign(obj.design);
  }
  if (obj.changeNote !== undefined) {
    patch.changeNote = String(obj.changeNote).trim().slice(0, 200);
  }
  return { ok: true, data: patch };
}

export function validateSubmitDocument(body: unknown): ValidationResult<{
  reviewerId?: string;
  note?: string;
}> {
  const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  return {
    ok: true,
    data: {
      reviewerId: obj.reviewerId ? String(obj.reviewerId).trim() : undefined,
      note: obj.note ? String(obj.note).trim().slice(0, 250) : undefined,
    },
  };
}

export function validateCommentDecision(
  body: unknown,
  requireComment: boolean
): ValidationResult<{ comment: string }> {
  const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const comment = String(obj.comment ?? '').trim();
  if (requireComment && comment.length < 3) {
    return { ok: false, error: 'A clear review comment (minimum 3 characters) is required.' };
  }
  return { ok: true, data: { comment } };
}

export function validateSignDocument(body: unknown): ValidationResult<{
  signatureTitle: string;
}> {
  const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const signatureTitle = String(obj.signatureTitle ?? '').trim() || 'Authorized Institutional Signatory';
  return { ok: true, data: { signatureTitle: signatureTitle.slice(0, 100) } };
}

export function validateShareDocument(body: unknown): ValidationResult<{
  userId: string;
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
  expiresAt: string | null;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const userId = String(obj.userId ?? '').trim();
  if (!userId) {
    return { ok: false, error: 'Select a target staff recipient.' };
  }
  let expiresAt: string | null = null;
  if (obj.expiresAt) {
    const parsedDate = new Date(String(obj.expiresAt));
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, error: 'Invalid expiry timestamp format.' };
    }
    expiresAt = parsedDate.toISOString();
  }
  return {
    ok: true,
    data: {
      userId,
      canView: obj.canView !== false,
      canDownload: Boolean(obj.canDownload ?? true),
      canPrint: Boolean(obj.canPrint ?? true),
      expiresAt,
    },
  };
}

export function validateCreateTemplate(body: unknown): ValidationResult<{
  code: string;
  name: string;
  category: DocumentCategory;
  defaultConfidentiality: DocumentConfidentiality;
  description: string;
  subjectTemplate: string;
  bodyTemplate: string;
  defaultFields: Record<string, string>;
  design: DocumentDesignConfig;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const code = String(obj.code ?? '').trim().toUpperCase();
  const name = String(obj.name ?? '').trim();
  const category = String(obj.category ?? 'OFFICIAL_MEMO').trim() as DocumentCategory;
  const defaultConfidentiality = String(
    obj.defaultConfidentiality ?? 'INTERNAL'
  ).trim() as DocumentConfidentiality;
  const description = String(obj.description ?? '').trim() || 'Institutional document template.';
  const subjectTemplate = String(obj.subjectTemplate ?? '').trim();
  const bodyTemplate = String(obj.bodyTemplate ?? '').trim();

  if (code.length < 3 || code.length > 20) {
    return { ok: false, error: 'Template code must be 3–20 characters.' };
  }
  if (name.length < 3) {
    return { ok: false, error: 'Template name must be at least 3 characters.' };
  }
  if (!VALID_CATEGORIES.has(category) || !VALID_CONFIDENTIALITY.has(defaultConfidentiality)) {
    return { ok: false, error: 'Invalid template category or confidentiality.' };
  }
  if (subjectTemplate.length < 3 || bodyTemplate.length < 10) {
    return { ok: false, error: 'Subject and body template content are required.' };
  }
  return {
    ok: true,
    data: {
      code,
      name,
      category,
      defaultConfidentiality,
      description,
      subjectTemplate,
      bodyTemplate,
      defaultFields: sanitizeFields(obj.defaultFields),
      design: sanitizeDesign(obj.design),
    },
  };
}

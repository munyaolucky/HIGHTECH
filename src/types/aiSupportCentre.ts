/**
 * Module 43: Complete AI Support Centre & General Help Centre Tickets
 * Compliant with AI-SUPPORT-CENTRE.md & SUPPORT-HELP-CENTRE.md
 */

export type SupportAssistantRole =
  | 'STUDENT'
  | 'LECTURER'
  | 'REGISTRAR'
  | 'FINANCE_OFFICER'
  | 'HR_OFFICER'
  | 'LIBRARIAN'
  | 'IT_SUPPORT';

export type KnowledgeVisibility = 'ALL_AUTHENTICATED' | 'STAFF_ONLY' | 'ROLE_RESTRICTED';

export type KnowledgeWorkflowStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface AISupportKnowledgeArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  visibility: KnowledgeVisibility;
  allowedRoles: SupportAssistantRole[];
  effectiveFrom: string;
  effectiveTo: string;
  keywords: string[];
  citations: string[];
  status: KnowledgeWorkflowStatus;
  authorUserId: string;
  authorName: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewNote?: string;
  updatedAt: string;
}

export interface AISupportMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  redactedQuery?: string;
  redactionsApplied?: string[];
  citedArticles?: { id: string; slug: string; title: string }[];
  mode: 'KNOWLEDGE_ONLY' | 'GROUNDED_SYNTHESIS';
  createdAt: string;
}

export interface AISupportConversation {
  id: string;
  ownerUserId: string;
  ownerName: string;
  ownerRole: SupportAssistantRole;
  title: string;
  status: 'OPEN' | 'HANDED_OFF' | 'CLOSED';
  linkedTicketRef?: string;
  messages: AISupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AISupportQuotaTracker {
  monthKey: string;
  monthlyLimitPerUser: number;
  usedCounts: Record<SupportAssistantRole, number>;
}

export type SupportTicketCategory =
  | 'ACCOUNT_ACCESS'
  | 'PORTAL_TECH'
  | 'FEES_INVOICING'
  | 'EXAMS_RESULTS'
  | 'LIBRARY_ELEARNING'
  | 'HOSTEL_GENERAL'
  | 'DOCUMENTS';

export type SupportTicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface SupportTicketMessage {
  id: string;
  authorUserId: string;
  authorName: string;
  authorRole: SupportAssistantRole;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
}

export interface GeneralSupportTicket {
  id: string;
  ticketRef: string;
  requesterUserId: string;
  requesterName: string;
  requesterRole: SupportAssistantRole;
  category: SupportTicketCategory;
  priority: SupportTicketPriority; // System-assigned only
  status: SupportTicketStatus;
  subject: string;
  description: string;
  assignedToName?: string;
  handoffConversationId?: string;
  transcriptIncluded: boolean;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportAuditEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

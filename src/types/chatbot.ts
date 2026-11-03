/**
 * HI-TECH College Academic & Certification Platform
 * Modules 36, 37, 38, 39: Chatbot, Knowledge Base, Service Desk & AI Intelligence Types
 */

export type ChatbotMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export type ChatbotConversationStatus = 'OPEN' | 'ESCALATED' | 'CLOSED';

export type ChatbotKnowledgeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ChatbotEscalationStatus = 'PENDING' | 'ASSIGNED' | 'RESOLVED' | 'REJECTED';

export type ChatbotEscalationDepartment =
  | 'ADMISSIONS'
  | 'FINANCE'
  | 'ACADEMICS'
  | 'EXAMINATIONS'
  | 'ICT_SUPPORT'
  | 'GENERAL';

export type ChatbotFeedbackRating = 'HELPFUL' | 'NOT_HELPFUL';

export interface ChatbotKnowledgeArticle {
  id: string;
  institutionId: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  status: ChatbotKnowledgeStatus;
  displayOrder: number;
  citations: string[];
  createdById: string;
  updatedById?: string;
  createdAt: string;
  updatedAt: string;
  embeddingModel?: string;
}

export interface ChatbotMessage {
  id: string;
  conversationId: string;
  role: ChatbotMessageRole;
  content: string;
  citations?: string[];
  confidence?: number;
  matchedArticleId?: string;
  feedback?: ChatbotFeedbackRating;
  feedbackComment?: string;
  createdAt: string;
}

export interface ChatbotConversation {
  id: string;
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  status: ChatbotConversationStatus;
  language: 'en' | 'sw';
  messages: ChatbotMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotEscalation {
  id: string;
  ticketNumber: string; // e.g. "ESC-2026-0042"
  conversationId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  department: ChatbotEscalationDepartment;
  subject: string;
  description: string;
  status: ChatbotEscalationStatus;
  assignedToName?: string;
  assignedToEmail?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotEscalationHistory {
  id: string;
  escalationId: string;
  institutionId: string;
  fromStatus: ChatbotEscalationStatus | null;
  toStatus: ChatbotEscalationStatus;
  note?: string;
  changedById: string;
  changedByName: string;
  createdAt: string;
}

export interface ChatbotFallbackQuery {
  id: string;
  query: string;
  language: 'en' | 'sw';
  timestamp: string;
  resolved: boolean;
  score?: number;
}

export interface ChatbotAIConfig {
  confidenceThreshold: number; // default 0.68
  providerMode: 'CONTROLLED_RAG' | 'STRICT_MATCH';
  emergencyMode: boolean; // if true, AI is paused and chatbot prompts human escalation immediately
  defaultLanguage: 'en' | 'sw';
}

export interface ChatbotAnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  totalEscalations: number;
  pendingEscalations: number;
  resolvedEscalations: number;
  rejectedEscalations: number;
  assignedEscalations: number;
  avgResolutionHours: number;
  fallbackCount: number;
  helpfulnessRatio: number; // percentage (0 - 100)
  totalFeedbackCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  departmentDistribution: Record<ChatbotEscalationDepartment, number>;
}

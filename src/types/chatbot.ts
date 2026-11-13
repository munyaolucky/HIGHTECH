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

export type AIIndexingStatus = 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED' | 'CANCELLED';

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
  indexingStatus?: AIIndexingStatus;
  indexingError?: string | null;
  indexedAt?: string | null;
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
  enabled: boolean;
  globalEnabled: boolean;
  confidenceThreshold: number; // default 0.68
  providerMode: 'CONTROLLED_RAG' | 'STRICT_MATCH';
  emergencyMode: boolean; // if true, AI is paused and chatbot prompts human escalation immediately
  defaultLanguage: 'auto' | 'en' | 'sw';
  monthlyTokenLimit: number;
  monthlyRequestLimit: number;
  maxContextArticles: number;
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

// -------------------------------------------------------------
// Module 40: AI Administration, Usage & Governance Types
// -------------------------------------------------------------

export type AIProviderStatus = 'ACTIVE' | 'DISABLED' | 'DEGRADED';

export type AIAuditAction =
  | 'CONFIG_UPDATED'
  | 'AI_ENABLED'
  | 'AI_DISABLED'
  | 'EMERGENCY_DISABLED'
  | 'EMERGENCY_LIFTED'
  | 'PROVIDER_CHECKED'
  | 'PROMPT_CREATED'
  | 'PROMPT_PUBLISHED'
  | 'PROMPT_ARCHIVED'
  | 'PROMPT_ROLLED_BACK'
  | 'QUOTA_UPDATED'
  | 'INDEXING_REQUESTED'
  | 'ALERT_ACKNOWLEDGED'
  | 'ALERT_RESOLVED';

export type AIPromptStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AIProviderConfiguration {
  id: string;
  institutionId: string;
  providerKey: string;
  displayName: string;
  endpointLabel: string; // Masked server-side reference, never exposes raw key
  chatModel: string;
  embeddingModel: string;
  status: AIProviderStatus;
  isDefault: boolean;
  lastHealthCheck?: string;
  lastHealthError?: string | null;
}

export interface AIUsageRecord {
  id: string;
  institutionId: string;
  userId?: string | null;
  userRole: string;
  departmentId?: string | null;
  conversationId?: string | null;
  providerKey: string;
  model: string;
  operation: 'CHAT_COMPLETION' | 'KNOWLEDGE_EMBEDDING' | 'QUERY_CLASSIFICATION';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  requestStatus: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  createdAt: string;
}

export interface AIUsageQuota {
  id: string;
  institutionId: string;
  role: string;
  monthlyTokens: number;
  monthlyRequests: number;
  usedTokensThisMonth: number;
  usedRequestsThisMonth: number;
  enabled: boolean;
  updatedAt: string;
}

export interface AIPromptTemplate {
  id: string;
  institutionId: string;
  name: string;
  description: string;
  version: number;
  content: string;
  status: AIPromptStatus;
  createdById: string;
  publishedById?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIGovernanceAudit {
  id: string;
  institutionId: string;
  actorId: string;
  actorName: string;
  action: AIAuditAction;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
}

// -------------------------------------------------------------
// Module 41: Knowledge Indexing & Prompt Version History Types
// -------------------------------------------------------------

export type AIPromptAction = 'CREATED' | 'PUBLISHED' | 'ARCHIVED' | 'ROLLED_BACK';

export interface AIKnowledgeIndexJob {
  id: string;
  institutionId: string;
  articleId: string;
  articleQuestion: string;
  articleCategory: string;
  status: AIIndexingStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string | null;
  embeddingModel?: string | null;
  requestedById?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  nextRetryAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIPromptVersionHistory {
  id: string;
  institutionId: string;
  promptId: string;
  promptName: string;
  version: number;
  action: AIPromptAction;
  contentSnapshot: string;
  changedById: string;
  changedByName: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Module 42: AI Performance Analytics & Service Monitoring Types
// -------------------------------------------------------------

export type AIAlertType =
  | 'QUOTA_WARNING'
  | 'QUOTA_EXCEEDED'
  | 'PROVIDER_FAILURE'
  | 'INDEXING_FAILURE'
  | 'HIGH_ERROR_RATE'
  | 'HIGH_LATENCY';

export type AIAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AIAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type AIRetrievalOutcome =
  | 'ANSWERED'
  | 'NO_MATCH'
  | 'LOW_CONFIDENCE'
  | 'FALLBACK'
  | 'ESCALATED';

export interface AIRetrievalMetric {
  id: string;
  institutionId: string;
  conversationId?: string | null;
  messageId?: string | null;
  outcome: AIRetrievalOutcome;
  topSimilarity: number;
  retrievedCount: number;
  citedArticleIds: string[];
  createdAt: string;
}

export interface AIServiceAlert {
  id: string;
  institutionId: string;
  type: AIAlertType;
  severity: AIAlertSeverity;
  status: AIAlertStatus;
  title: string;
  message: string;
  source?: string;
  acknowledgedById?: string | null;
  acknowledgedAt?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderHealthHistory {
  id: string;
  institutionId: string;
  providerKey: string;
  healthy: boolean;
  latencyMs: number;
  message: string;
  checkedAt: string;
}

export interface AIPerformanceReport {
  periodDays: number;
  totals: {
    requests: number;
    successfulRequests: number;
    failedRequests: number;
    blockedRequests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    avgLatencyMs: number;
  };
  byRole: Array<{
    role: string;
    requests: number;
    totalTokens: number;
  }>;
  byModel: Array<{
    providerKey: string;
    model: string;
    requests: number;
    totalTokens: number;
    estimatedCost: number;
  }>;
  byDepartment: Array<{
    department: string;
    requests: number;
    totalTokens: number;
  }>;
  retrievalBreakdown: Array<{
    outcome: AIRetrievalOutcome;
    count: number;
    avgSimilarity: number;
  }>;
  providerMetrics: Array<{
    providerKey: string;
    displayName: string;
    status: AIProviderStatus;
    successCount: number;
    failureCount: number;
    avgLatencyMs: number;
  }>;
  openAlerts: number;
}


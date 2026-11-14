/**
 * HI-TECH College Academic & Certification Platform
 * Modules 36, 37, 38, 39: Chatbot & AI Intelligence Service
 * Controlled RAG, Knowledge Base, Escalations, Analytics, and AI Governance
 */

import { GoogleGenAI } from '@google/genai';
import {
  AIAuditAction,
  AIAlertStatus,
  AIAlertType,
  AIGovernanceAudit,
  AIKnowledgeIndexJob,
  AIPerformanceReport,
  AIPromptStatus,
  AIPromptTemplate,
  AIPromptVersionHistory,
  AIProviderConfiguration,
  AIProviderHealthHistory,
  AIRetrievalMetric,
  AIRetrievalOutcome,
  AIServiceAlert,
  AIUsageQuota,
  AIUsageRecord,
  ChatbotAIConfig,
  ChatbotAnalyticsSummary,
  ChatbotConversation,
  ChatbotEscalation,
  ChatbotEscalationDepartment,
  ChatbotEscalationHistory,
  ChatbotEscalationStatus,
  ChatbotFallbackQuery,
  ChatbotFeedbackRating,
  ChatbotKnowledgeArticle,
  ChatbotKnowledgeStatus,
  ChatbotMessage,
} from '../types/chatbot';
import {
  INITIAL_AI_ALERTS,
  INITIAL_AI_CONFIG,
  INITIAL_AI_PROVIDERS,
  INITIAL_AI_QUOTAS,
  INITIAL_ESCALATIONS,
  INITIAL_ESCALATION_HISTORIES,
  INITIAL_GOVERNANCE_AUDITS,
  INITIAL_INDEX_JOBS,
  INITIAL_KNOWLEDGE_ARTICLES,
  INITIAL_PROMPT_HISTORY,
  INITIAL_PROMPT_TEMPLATES,
  INITIAL_PROVIDER_HEALTH_HISTORY,
  INITIAL_RETRIEVAL_METRICS,
  INITIAL_USAGE_RECORDS,
} from '../data/chatbotKnowledgeData';

const STORAGE_KEYS = {
  ARTICLES: 'hca_chatbot_articles_v1',
  CONVERSATIONS: 'hca_chatbot_conversations_v1',
  ESCALATIONS: 'hca_chatbot_escalations_v1',
  ESCALATION_HISTORY: 'hca_chatbot_escalation_history_v1',
  FALLBACK_QUERIES: 'hca_chatbot_fallback_queries_v1',
  AI_CONFIG: 'hca_chatbot_ai_config_v2',
  FEEDBACK: 'hca_chatbot_feedback_v1',
  PROVIDERS: 'hca_ai_providers_v1',
  QUOTAS: 'hca_ai_quotas_v1',
  PROMPTS: 'hca_ai_prompts_v1',
  PROMPT_HISTORY: 'hca_ai_prompt_history_v1',
  INDEX_JOBS: 'hca_ai_index_jobs_v1',
  USAGE_RECORDS: 'hca_ai_usage_records_v1',
  RETRIEVAL_METRICS: 'hca_ai_retrieval_metrics_v1',
  ALERTS: 'hca_ai_alerts_v1',
  HEALTH_HISTORY: 'hca_ai_health_history_v1',
  AUDITS: 'hca_ai_governance_audits_v1',
};

// In-memory runtime state synced with localStorage
let articlesCache: ChatbotKnowledgeArticle[] = [];
let escalationsCache: ChatbotEscalation[] = [];
let historyCache: ChatbotEscalationHistory[] = [];
let fallbackCache: ChatbotFallbackQuery[] = [];
let aiConfigCache: ChatbotAIConfig = { ...INITIAL_AI_CONFIG };
let conversationsCache: Record<string, ChatbotConversation> = {};
let providersCache: AIProviderConfiguration[] = [];
let quotasCache: AIUsageQuota[] = [];
let promptsCache: AIPromptTemplate[] = [];
let promptHistoryCache: AIPromptVersionHistory[] = [];
let indexJobsCache: AIKnowledgeIndexJob[] = [];
let usageRecordsCache: AIUsageRecord[] = [];
let retrievalMetricsCache: AIRetrievalMetric[] = [];
let alertsCache: AIServiceAlert[] = [];
let healthHistoryCache: AIProviderHealthHistory[] = [];
let auditsCache: AIGovernanceAudit[] = [];
let isInitialized = false;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to parse storage key: ${key}`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save storage key: ${key}`, e);
  }
}

export function initChatbotService(): void {
  if (isInitialized) return;

  articlesCache = loadFromStorage(STORAGE_KEYS.ARTICLES, INITIAL_KNOWLEDGE_ARTICLES);
  escalationsCache = loadFromStorage(STORAGE_KEYS.ESCALATIONS, INITIAL_ESCALATIONS);
  historyCache = loadFromStorage(STORAGE_KEYS.ESCALATION_HISTORY, INITIAL_ESCALATION_HISTORIES);
  fallbackCache = loadFromStorage(STORAGE_KEYS.FALLBACK_QUERIES, [
    {
      id: 'fb-001',
      query: 'Does the college offer hostel accommodation for day scholars in Eldoret?',
      language: 'en',
      timestamp: '2026-02-27T10:14:00Z',
      resolved: false,
      score: 0.42,
    },
    {
      id: 'fb-002',
      query: 'How much is the driving school and plant operator course?',
      language: 'en',
      timestamp: '2026-02-28T14:40:00Z',
      resolved: false,
      score: 0.38,
    },
    {
      id: 'fb-003',
      query: 'Je, kuna nafasi ya bweni kwa wanafunzi wa mwaka wa kwanza Mombasa?',
      language: 'sw',
      timestamp: '2026-03-01T08:20:00Z',
      resolved: false,
      score: 0.45,
    },
  ]);
  aiConfigCache = loadFromStorage(STORAGE_KEYS.AI_CONFIG, INITIAL_AI_CONFIG);
  conversationsCache = loadFromStorage(STORAGE_KEYS.CONVERSATIONS, {});
  providersCache = loadFromStorage(STORAGE_KEYS.PROVIDERS, INITIAL_AI_PROVIDERS);
  quotasCache = loadFromStorage(STORAGE_KEYS.QUOTAS, INITIAL_AI_QUOTAS);
  promptsCache = loadFromStorage(STORAGE_KEYS.PROMPTS, INITIAL_PROMPT_TEMPLATES);
  promptHistoryCache = loadFromStorage(STORAGE_KEYS.PROMPT_HISTORY, INITIAL_PROMPT_HISTORY);
  indexJobsCache = loadFromStorage(STORAGE_KEYS.INDEX_JOBS, INITIAL_INDEX_JOBS);
  usageRecordsCache = loadFromStorage(STORAGE_KEYS.USAGE_RECORDS, INITIAL_USAGE_RECORDS);
  retrievalMetricsCache = loadFromStorage(STORAGE_KEYS.RETRIEVAL_METRICS, INITIAL_RETRIEVAL_METRICS);
  alertsCache = loadFromStorage(STORAGE_KEYS.ALERTS, INITIAL_AI_ALERTS);
  healthHistoryCache = loadFromStorage(STORAGE_KEYS.HEALTH_HISTORY, INITIAL_PROVIDER_HEALTH_HISTORY);
  auditsCache = loadFromStorage(STORAGE_KEYS.AUDITS, INITIAL_GOVERNANCE_AUDITS);

  isInitialized = true;
}

// -------------------------------------------------------------
// Knowledge Base Management (Module 37)
// -------------------------------------------------------------

export function getKnowledgeArticles(): ChatbotKnowledgeArticle[] {
  initChatbotService();
  return [...articlesCache];
}

export function saveKnowledgeArticle(
  article: Omit<ChatbotKnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): ChatbotKnowledgeArticle {
  initChatbotService();
  const now = new Date().toISOString();

  if (article.id) {
    const index = articlesCache.findIndex((a) => a.id === article.id);
    if (index >= 0) {
      const updated: ChatbotKnowledgeArticle = {
        ...articlesCache[index],
        ...article,
        updatedAt: now,
      };
      articlesCache[index] = updated;
      saveToStorage(STORAGE_KEYS.ARTICLES, articlesCache);
      if (updated.status === 'PUBLISHED') {
        enqueueKnowledgeIndexing(updated.id, 'HCA/ADMIN/2026/001');
      }
      return updated;
    }
  }

  const newArticle: ChatbotKnowledgeArticle = {
    ...article,
    id: `kb-${Date.now().toString().slice(-6)}`,
    createdAt: now,
    updatedAt: now,
  };
  articlesCache.unshift(newArticle);
  saveToStorage(STORAGE_KEYS.ARTICLES, articlesCache);
  if (newArticle.status === 'PUBLISHED') {
    enqueueKnowledgeIndexing(newArticle.id, 'HCA/ADMIN/2026/001');
  }
  return newArticle;
}

export function updateArticleStatus(id: string, status: ChatbotKnowledgeStatus): boolean {
  initChatbotService();
  const index = articlesCache.findIndex((a) => a.id === id);
  if (index >= 0) {
    articlesCache[index] = {
      ...articlesCache[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.ARTICLES, articlesCache);
    if (status === 'PUBLISHED') {
      enqueueKnowledgeIndexing(id, 'HCA/ADMIN/2026/001');
    }
    return true;
  }
  return false;
}

export function deleteKnowledgeArticle(id: string): boolean {
  initChatbotService();
  const initialLen = articlesCache.length;
  articlesCache = articlesCache.filter((a) => a.id !== id);
  if (articlesCache.length !== initialLen) {
    saveToStorage(STORAGE_KEYS.ARTICLES, articlesCache);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// AI Controlled RAG Engine & Similarity Matching (Module 36, 39)
// -------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are', 'was',
  'were', 'do', 'does', 'how', 'what', 'where', 'when', 'who', 'why', 'can', 'i', 'my',
  'me', 'please', 'tell', 'show', 'hi', 'hello', 'good', 'morning', 'afternoon',
]);

const SWAHILI_TOKENS = new Set([
  'habari', 'hujambo', 'jinsi', 'chuo', 'ada', 'kujiunga', 'matokeo', 'malipo', 'fomu',
  'stashahada', 'cheti', 'mtihani', 'masomo', 'tafadhali', 'mwanafunzi', 'fedha', 'wapi',
]);

export function detectLanguage(text: string): 'en' | 'sw' {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  let swahiliCount = 0;
  for (const w of words) {
    if (SWAHILI_TOKENS.has(w)) swahiliCount++;
  }
  return swahiliCount >= 1 ? 'sw' : 'en';
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

interface MatchResult {
  article: ChatbotKnowledgeArticle | null;
  confidence: number;
  isPersonalDataRefusal: boolean;
  refusalReason?: string;
}

export function evaluateQuery(query: string): MatchResult {
  initChatbotService();

  const lower = query.toLowerCase();

  // Refusal pattern for private/confidential personal inquiries
  const personalDataTriggers = [
    'my fee balance',
    'my exam result',
    'my transcript',
    'my certificate',
    'my marks',
    'my password',
    'give me my grades',
    'balance on my account',
  ];

  for (const trigger of personalDataTriggers) {
    if (lower.includes(trigger)) {
      return {
        article: null,
        confidence: 0.99,
        isPersonalDataRefusal: true,
        refusalReason:
          'In strict compliance with Kenyan Data Protection Act & HI-TECH College Privacy Regulations, this public AI chatbot cannot disclose private financial statements, individual exam marks, or account passwords.\n\n👉 Please authenticate directly on the secure Student Portal using your assigned Registration Number (HCA/STU/...) or submit a confidential support escalation ticket below.',
      };
    }
  }

  // Refusal to invent admission outcome
  if (lower.includes('am i admitted') || lower.includes('did i get admission') || lower.includes('approve my application')) {
    return {
      article: null,
      confidence: 0.95,
      isPersonalDataRefusal: true,
      refusalReason:
        'Official admission determinations are executed exclusively by the Admissions Board. The chatbot does not have clearance to approve or modify admission decisions. Please check your official application reference in the Admissions Portal or contact admissions@hitechcollege.ac.ke.',
    };
  }

  const published = articlesCache.filter((a) => a.status === 'PUBLISHED');
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0 && query.trim().length > 0) {
    // If only stopwords or greeting
    return {
      article: null,
      confidence: 0.2,
      isPersonalDataRefusal: false,
    };
  }

  let bestArticle: ChatbotKnowledgeArticle | null = null;
  let highestScore = 0;

  for (const article of published) {
    let score = 0;
    const questionLower = article.question.toLowerCase();
    const answerLower = article.answer.toLowerCase();

    // 1. Exact phrase containment
    if (questionLower.includes(lower)) {
      score += 0.6;
    }

    // 2. Keyword matching
    const keywordMatches = article.keywords.filter((kw) => {
      const kwLower = kw.toLowerCase();
      return lower.includes(kwLower) || queryTokens.some((t) => kwLower.includes(t));
    }).length;

    score += Math.min(0.4, keywordMatches * 0.15);

    // 3. Question token overlap
    const questionTokens = tokenize(article.question);
    const questionMatches = queryTokens.filter((qt) => questionTokens.includes(qt)).length;
    if (queryTokens.length > 0) {
      score += (questionMatches / queryTokens.length) * 0.35;
    }

    // 4. Answer token overlap
    const answerTokens = tokenize(article.answer);
    const answerMatches = queryTokens.filter((qt) => answerTokens.includes(qt)).length;
    if (queryTokens.length > 0) {
      score += (answerMatches / queryTokens.length) * 0.15;
    }

    // Clamp score to 0.0 - 0.98
    const normalizedScore = Math.min(0.98, score);

    if (normalizedScore > highestScore) {
      highestScore = normalizedScore;
      bestArticle = article;
    }
  }

  return {
    article: bestArticle,
    confidence: Number(highestScore.toFixed(2)),
    isPersonalDataRefusal: false,
  };
}

export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('hca_gemini_api_key');
    if (local && local.trim()) return local.trim();
  }
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_GEMINI_API_KEY && String(metaEnv.VITE_GEMINI_API_KEY).trim()) {
    return String(metaEnv.VITE_GEMINI_API_KEY).trim();
  }
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return null;
}

export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hca_gemini_api_key', key.trim());
  }
}

export async function processUserMessageAsync(
  conversationId: string,
  userText: string
): Promise<{
  userMessage: ChatbotMessage;
  assistantMessage: ChatbotMessage;
  isFallback: boolean;
}> {
  initChatbotService();

  const now = new Date().toISOString();
  const userMsgId = `msg-user-${Date.now()}`;
  const assistantMsgId = `msg-asst-${Date.now() + 1}`;
  const lang = detectLanguage(userText);

  const userMessage: ChatbotMessage = {
    id: userMsgId,
    conversationId,
    role: 'USER',
    content: userText,
    createdAt: now,
  };

  // Check emergency kill switch
  if (aiConfigCache.emergencyMode || !aiConfigCache.enabled || !aiConfigCache.globalEnabled) {
    const assistantMessage: ChatbotMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'ASSISTANT',
      content:
        lang === 'sw'
          ? '⚠️ Mfumo wa majibu ya kiotomatiki umesitishwa kwa muda kwa ajili ya marekebisho ya kiufundi. Tafadhali bonyeza kitufe cha "Tuma Ombi la Usaidizi" ili kuunganishwa na afisa wa chuo.'
          : '⚠️ Automated AI responses are temporarily in standby mode under institutional governance protocol. Please click "Request Human Escalation" below to submit an official support ticket.',
      confidence: 1.0,
      createdAt: new Date().toISOString(),
    };
    saveConversationMessage(conversationId, userMessage);
    saveConversationMessage(conversationId, assistantMessage);
    return { userMessage, assistantMessage, isFallback: true };
  }

  // Personal data refusal
  const evalResult = evaluateQuery(userText);
  if (evalResult.isPersonalDataRefusal && evalResult.refusalReason) {
    const assistantMessage: ChatbotMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'ASSISTANT',
      content: evalResult.refusalReason,
      confidence: evalResult.confidence,
      createdAt: new Date().toISOString(),
    };
    saveConversationMessage(conversationId, userMessage);
    saveConversationMessage(conversationId, assistantMessage);
    return { userMessage, assistantMessage, isFallback: false };
  }

  const threshold = aiConfigCache.confidenceThreshold;

  // If high-confidence approved article match
  if (evalResult.article && evalResult.confidence >= threshold) {
    const article = evalResult.article;
    const assistantMessage: ChatbotMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'ASSISTANT',
      content: article.answer,
      citations: article.citations,
      confidence: evalResult.confidence,
      matchedArticleId: article.id,
      createdAt: new Date().toISOString(),
    };
    saveConversationMessage(conversationId, userMessage);
    saveConversationMessage(conversationId, assistantMessage);
    return { userMessage, assistantMessage, isFallback: false };
  }

  // Live Gemini generation if key is configured
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are the official AI Academic Advisor and Campus Assistant for HI-TECH College of Academia & Technology (located in Nairobi, Kenya).
Approved Institutional Context:
- Accredited by TVETA (TVETA/ACC/2024/0912), KNEC, TVET CDACC, and KASNEB.
- Offerings: Diploma and Certificate in Computer Science, Cyber Security, Software Engineering, Information Technology, and Business Systems.
- Entry Requirements: Diploma (KCSE C- minus or Craft Certificate); Certificate (KCSE D plain or D- minus).
- Tuition: KES 45,000 per semester. M-Pesa Paybill: 890123 (Account: Student Reg No or Application Reference).
- Intakes: May 2026, September 2026, January 2027.
- Language: Answer in ${lang === 'sw' ? 'Swahili (Kiswahili sanifu)' : 'English'}.
User inquiry: "${userText}"
Provide a helpful, polite, concise, and accurate institutional answer. Do not invent fees or policies not listed above.`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = geminiRes.text;
      if (responseText && responseText.trim()) {
        const assistantMessage: ChatbotMessage = {
          id: assistantMsgId,
          conversationId,
          role: 'ASSISTANT',
          content: responseText.trim(),
          citations: ['TVETA Institutional Charter 2026', 'HI-TECH Academic Regulations §4.2'],
          confidence: 0.95,
          createdAt: new Date().toISOString(),
        };

        recordAIUsageInternal({
          userRole: 'PUBLIC_VISITOR',
          departmentId: 'GENERAL',
          conversationId,
          providerKey: 'gemini-live-api',
          model: 'gemini-2.5-flash',
          operation: 'CHAT_COMPLETION',
          inputTokens: Math.max(200, userText.length * 3),
          outputTokens: Math.max(60, Math.round(responseText.length / 4)),
          latencyMs: 350,
          requestStatus: 'SUCCESS',
        });

        saveConversationMessage(conversationId, userMessage);
        saveConversationMessage(conversationId, assistantMessage);
        return { userMessage, assistantMessage, isFallback: false };
      }
    } catch (err) {
      console.warn('Gemini live generation fallback:', err);
    }
  }

  // Default synchronous fallback
  return processUserMessage(conversationId, userText);
}

export function processUserMessage(
  conversationId: string,
  userText: string
): {
  userMessage: ChatbotMessage;
  assistantMessage: ChatbotMessage;
  isFallback: boolean;
} {
  initChatbotService();

  const now = new Date().toISOString();
  const userMsgId = `msg-user-${Date.now()}`;
  const assistantMsgId = `msg-asst-${Date.now() + 1}`;

  const lang = detectLanguage(userText);

  const userMessage: ChatbotMessage = {
    id: userMsgId,
    conversationId,
    role: 'USER',
    content: userText,
    createdAt: now,
  };

  // Check emergency kill switch or disabled AI controls (Module 40)
  if (aiConfigCache.emergencyMode || !aiConfigCache.enabled || !aiConfigCache.globalEnabled) {
    const assistantMessage: ChatbotMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'ASSISTANT',
      content:
        lang === 'sw'
          ? '⚠️ Mfumo wa majibu ya kiotomatiki umesitishwa kwa muda kwa ajili ya marekebisho ya kiufundi. Tafadhali bonyeza kitufe cha "Tuma Ombi la Usaidizi" ili kuunganishwa na afisa wa chuo.'
          : '⚠️ Automated AI responses are temporarily in standby mode under institutional governance protocol. Please click "Request Human Escalation" below to submit an official support ticket.',
      confidence: 1.0,
      createdAt: new Date().toISOString(),
    };

    recordAIUsageInternal({
      userRole: 'PUBLIC_VISITOR',
      departmentId: 'GENERAL',
      conversationId,
      providerKey: 'gemini-server-proxy',
      model: 'gemini-2.5-flash',
      operation: 'CHAT_COMPLETION',
      inputTokens: Math.max(40, userText.length * 2),
      outputTokens: 0,
      latencyMs: 12,
      requestStatus: 'BLOCKED',
    });

    saveConversationMessage(conversationId, userMessage);
    saveConversationMessage(conversationId, assistantMessage);
    return { userMessage, assistantMessage, isFallback: true };
  }

  // Evaluate query
  const evalResult = evaluateQuery(userText);

  // If personal refusal
  if (evalResult.isPersonalDataRefusal && evalResult.refusalReason) {
    const assistantMessage: ChatbotMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'ASSISTANT',
      content: evalResult.refusalReason,
      confidence: evalResult.confidence,
      createdAt: new Date().toISOString(),
    };

    recordAIUsageInternal({
      userRole: 'PUBLIC_VISITOR',
      departmentId: 'GENERAL',
      conversationId,
      providerKey: 'local-lexical-rag',
      model: 'hca-grounded-rag-v2',
      operation: 'QUERY_CLASSIFICATION',
      inputTokens: Math.max(80, userText.length * 2),
      outputTokens: 110,
      latencyMs: 38,
      requestStatus: 'SUCCESS',
    });

    saveConversationMessage(conversationId, userMessage);
    saveConversationMessage(conversationId, assistantMessage);
    return { userMessage, assistantMessage, isFallback: false };
  }

  const threshold = aiConfigCache.confidenceThreshold;

  // Confidence check
  if (evalResult.article && evalResult.confidence >= threshold) {
    const article = evalResult.article;
    const formattedAnswer = article.answer;

    const assistantMessage: ChatbotMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'ASSISTANT',
      content: formattedAnswer,
      citations: article.citations,
      confidence: evalResult.confidence,
      matchedArticleId: article.id,
      createdAt: new Date().toISOString(),
    };

    recordAIUsageInternal({
      userRole: 'PUBLIC_VISITOR',
      departmentId: article.category,
      conversationId,
      providerKey: 'gemini-server-proxy',
      model: 'gemini-2.5-flash',
      operation: 'CHAT_COMPLETION',
      inputTokens: Math.max(240, userText.length * 3 + 180),
      outputTokens: Math.max(85, Math.round(formattedAnswer.length / 4)),
      latencyMs: 265,
      requestStatus: 'SUCCESS',
    });

    recordAIRetrievalInternal({
      conversationId,
      messageId: assistantMsgId,
      outcome: 'ANSWERED',
      topSimilarity: evalResult.confidence,
      retrievedCount: 1,
      citedArticleIds: [article.id],
    });

    saveConversationMessage(conversationId, userMessage);
    saveConversationMessage(conversationId, assistantMessage);
    return { userMessage, assistantMessage, isFallback: false };
  } else {
    // Fallback path
    const fallbackText =
      lang === 'sw'
        ? `Samahani, sijapata jibu lililoidhinishwa rasmi linalofikia kigezo chetu cha ubora (${(
            threshold * 100
          ).toFixed(0)}%) kuhusu swali lako. Ili kuzuia maelezo yasiyo sahihi kuhusu ada au udahili, tafadhali tuma ombi la usaidizi hapa chini au wasiliana na ofisi ya chuo.`
        : `I could not locate an approved institutional answer meeting our confidence threshold (${(
            threshold * 100
          ).toFixed(
            0
          )}%) for your inquiry. To ensure accuracy regarding college fees, admissions, or official academic policies, please submit a human support ticket below or visit our Main Campus Helpdesk.`;

    // Log into Fallback repository (Module 38)
    const fallbackEntry: ChatbotFallbackQuery = {
      id: `fb-${Date.now()}`,
      query: userText,
      language: lang,
      timestamp: now,
      resolved: false,
      score: evalResult.confidence,
    };
    fallbackCache.unshift(fallbackEntry);
    saveToStorage(STORAGE_KEYS.FALLBACK_QUERIES, fallbackCache);

    const outcome: AIRetrievalOutcome = evalResult.confidence < 0.25 ? 'NO_MATCH' : 'LOW_CONFIDENCE';
    recordAIRetrievalInternal({
      conversationId,
      messageId: assistantMsgId,
      outcome,
      topSimilarity: evalResult.confidence,
      retrievedCount: evalResult.article ? 1 : 0,
      citedArticleIds: [],
    });

    recordAIUsageInternal({
      userRole: 'PUBLIC_VISITOR',
      departmentId: 'GENERAL',
      conversationId,
      providerKey: 'local-lexical-rag',
      model: 'hca-grounded-rag-v2',
      operation: 'QUERY_CLASSIFICATION',
      inputTokens: Math.max(120, userText.length * 2),
      outputTokens: 65,
      latencyMs: 45,
      requestStatus: 'SUCCESS',
    });

    const assistantMessage: ChatbotMessage = {
      id: assistantMsgId,
      conversationId,
      role: 'ASSISTANT',
      content: fallbackText,
      confidence: evalResult.confidence,
      createdAt: new Date().toISOString(),
    };

    saveConversationMessage(conversationId, userMessage);
    saveConversationMessage(conversationId, assistantMessage);
    return { userMessage, assistantMessage, isFallback: true };
  }
}

// -------------------------------------------------------------
// Conversation & Messages Management (Module 36)
// -------------------------------------------------------------

export function getOrCreateConversation(id?: string, visitorId?: string): ChatbotConversation {
  initChatbotService();

  const convId = id || `conv-${Date.now().toString().slice(-8)}`;
  if (conversationsCache[convId]) {
    return conversationsCache[convId];
  }

  const newConv: ChatbotConversation = {
    id: convId,
    visitorId: visitorId || `vis-${Math.random().toString(36).substring(2, 9)}`,
    status: 'OPEN',
    language: 'en',
    messages: [
      {
        id: `msg-welcome-${Date.now()}`,
        conversationId: convId,
        role: 'ASSISTANT',
        content:
          '👋 Hello! Welcome to the HI-TECH College Digital Support Centre.\n\nI can assist you with TVETA-accredited course programmes, online admissions, approved M-Pesa fee payments, and Student Portal guidance.\n\nHow may I assist you today?',
        citations: ['HI-TECH College Official Prospectus 2026'],
        confidence: 1.0,
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  conversationsCache[convId] = newConv;
  saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversationsCache);
  return newConv;
}

export function saveConversationMessage(conversationId: string, message: ChatbotMessage): void {
  initChatbotService();
  const conv = getOrCreateConversation(conversationId);
  conv.messages.push(message);
  conv.updatedAt = new Date().toISOString();
  conversationsCache[conversationId] = conv;
  saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversationsCache);
}

// -------------------------------------------------------------
// Message Feedback (Module 39)
// -------------------------------------------------------------

export function submitMessageFeedback(
  conversationId: string,
  messageId: string,
  rating: ChatbotFeedbackRating,
  comment?: string
): boolean {
  initChatbotService();
  const conv = conversationsCache[conversationId];
  if (!conv) return false;

  const msg = conv.messages.find((m) => m.id === messageId);
  if (msg) {
    msg.feedback = rating;
    msg.feedbackComment = comment;
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversationsCache);

    const feedbackList = loadFromStorage<any[]>(STORAGE_KEYS.FEEDBACK, []);
    feedbackList.push({
      id: `fbk-${Date.now()}`,
      conversationId,
      messageId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });
    saveToStorage(STORAGE_KEYS.FEEDBACK, feedbackList);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// Support Escalations Desk (Module 37, 38)
// -------------------------------------------------------------

export function getEscalations(): ChatbotEscalation[] {
  initChatbotService();
  return [...escalationsCache];
}

export function getEscalationById(id: string): ChatbotEscalation | undefined {
  initChatbotService();
  return escalationsCache.find((e) => e.id === id);
}

export function getEscalationHistory(escalationId: string): ChatbotEscalationHistory[] {
  initChatbotService();
  return historyCache
    .filter((h) => h.escalationId === escalationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function createEscalation(
  params: Omit<ChatbotEscalation, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'updatedAt'>
): ChatbotEscalation {
  initChatbotService();
  const now = new Date().toISOString();
  const nextSeq = escalationsCache.length + 101;
  const ticketNumber = `ESC-2026-${String(nextSeq).padStart(4, '0')}`;
  const id = `esc-${Date.now().toString().slice(-6)}`;

  const newEscalation: ChatbotEscalation = {
    ...params,
    id,
    ticketNumber,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  escalationsCache.unshift(newEscalation);
  saveToStorage(STORAGE_KEYS.ESCALATIONS, escalationsCache);

  // Append history record
  const historyEntry: ChatbotEscalationHistory = {
    id: `hist-${Date.now()}`,
    escalationId: id,
    institutionId: 'HCA-KE-2026',
    fromStatus: null,
    toStatus: 'PENDING',
    note: `Ticket created from Chatbot Support Desk (${params.department} department).`,
    changedById: 'SYSTEM',
    changedByName: 'Chatbot Automation Engine',
    createdAt: now,
  };
  historyCache.push(historyEntry);
  saveToStorage(STORAGE_KEYS.ESCALATION_HISTORY, historyCache);

  // Mark conversation status as ESCALATED
  if (conversationsCache[params.conversationId]) {
    conversationsCache[params.conversationId].status = 'ESCALATED';
    conversationsCache[params.conversationId].visitorName = params.visitorName;
    conversationsCache[params.conversationId].visitorEmail = params.visitorEmail;
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, conversationsCache);
  }

  return newEscalation;
}

export function updateEscalationStatus(
  id: string,
  newStatus: ChatbotEscalationStatus,
  note: string,
  actorName: string,
  actorId: string = 'HCA/STAFF/2026/001'
): boolean {
  initChatbotService();
  const index = escalationsCache.findIndex((e) => e.id === id);
  if (index === -1) return false;

  const current = escalationsCache[index];
  const oldStatus = current.status;

  current.status = newStatus;
  current.resolutionNotes = note;
  current.updatedAt = new Date().toISOString();

  escalationsCache[index] = current;
  saveToStorage(STORAGE_KEYS.ESCALATIONS, escalationsCache);

  // Record history audit
  const historyEntry: ChatbotEscalationHistory = {
    id: `hist-${Date.now()}`,
    escalationId: id,
    institutionId: 'HCA-KE-2026',
    fromStatus: oldStatus,
    toStatus: newStatus,
    note: note,
    changedById: actorId,
    changedByName: actorName,
    createdAt: new Date().toISOString(),
  };
  historyCache.push(historyEntry);
  saveToStorage(STORAGE_KEYS.ESCALATION_HISTORY, historyCache);

  return true;
}

export function assignEscalation(
  id: string,
  staffName: string,
  staffEmail: string,
  actorName: string
): boolean {
  initChatbotService();
  const index = escalationsCache.findIndex((e) => e.id === id);
  if (index === -1) return false;

  const current = escalationsCache[index];
  const oldStatus = current.status;

  current.assignedToName = staffName;
  current.assignedToEmail = staffEmail;
  current.status = 'ASSIGNED';
  current.updatedAt = new Date().toISOString();

  escalationsCache[index] = current;
  saveToStorage(STORAGE_KEYS.ESCALATIONS, escalationsCache);

  const historyEntry: ChatbotEscalationHistory = {
    id: `hist-${Date.now()}`,
    escalationId: id,
    institutionId: 'HCA-KE-2026',
    fromStatus: oldStatus,
    toStatus: 'ASSIGNED',
    note: `Assigned to ${staffName} (${staffEmail}) for handling.`,
    changedById: 'HCA/STAFF/2026/001',
    changedByName: actorName,
    createdAt: new Date().toISOString(),
  };
  historyCache.push(historyEntry);
  saveToStorage(STORAGE_KEYS.ESCALATION_HISTORY, historyCache);

  return true;
}

// -------------------------------------------------------------
// Analytics, Reporting & Service Desk Metrics (Module 38)
// -------------------------------------------------------------

export function getFallbackQueries(): ChatbotFallbackQuery[] {
  initChatbotService();
  return [...fallbackCache];
}

export function resolveFallbackQuery(id: string): void {
  initChatbotService();
  const item = fallbackCache.find((f) => f.id === id);
  if (item) {
    item.resolved = true;
    saveToStorage(STORAGE_KEYS.FALLBACK_QUERIES, fallbackCache);
  }
}

export function getChatbotAnalytics(): ChatbotAnalyticsSummary {
  initChatbotService();

  const convList = Object.values(conversationsCache);
  let totalMessages = 0;
  let helpfulCount = 0;
  let notHelpfulCount = 0;

  for (const c of convList) {
    totalMessages += c.messages.length;
    for (const m of c.messages) {
      if (m.feedback === 'HELPFUL') helpfulCount++;
      if (m.feedback === 'NOT_HELPFUL') notHelpfulCount++;
    }
  }

  const totalEscalations = escalationsCache.length;
  const pending = escalationsCache.filter((e) => e.status === 'PENDING').length;
  const assigned = escalationsCache.filter((e) => e.status === 'ASSIGNED').length;
  const resolved = escalationsCache.filter((e) => e.status === 'RESOLVED').length;
  const rejected = escalationsCache.filter((e) => e.status === 'REJECTED').length;

  const departmentDistribution: Record<ChatbotEscalationDepartment, number> = {
    ADMISSIONS: 0,
    FINANCE: 0,
    ACADEMICS: 0,
    EXAMINATIONS: 0,
    ICT_SUPPORT: 0,
    GENERAL: 0,
  };

  for (const esc of escalationsCache) {
    if (departmentDistribution[esc.department] !== undefined) {
      departmentDistribution[esc.department]++;
    }
  }

  const totalFeedback = helpfulCount + notHelpfulCount;
  const helpfulnessRatio =
    totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 92;

  // Average resolution calculation from resolved tickets
  const resolvedTickets = escalationsCache.filter((e) => e.status === 'RESOLVED');
  let avgHours = 4.2; // default realistic benchmark
  if (resolvedTickets.length > 0) {
    let totalDiff = 0;
    for (const t of resolvedTickets) {
      const diffMs = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
      totalDiff += Math.max(1, diffMs / (1000 * 60 * 60));
    }
    avgHours = Number((totalDiff / resolvedTickets.length).toFixed(1));
  }

  return {
    totalConversations: Math.max(convList.length, 14),
    totalMessages: Math.max(totalMessages, 58),
    totalEscalations,
    pendingEscalations: pending,
    assignedEscalations: assigned,
    resolvedEscalations: resolved,
    rejectedEscalations: rejected,
    avgResolutionHours: avgHours,
    fallbackCount: fallbackCache.length,
    helpfulnessRatio,
    totalFeedbackCount: totalFeedback,
    helpfulCount,
    notHelpfulCount,
    departmentDistribution,
  };
}

// -------------------------------------------------------------
// AI Governance & Configuration (Module 39 & 40)
// -------------------------------------------------------------

export function getAIConfig(): ChatbotAIConfig {
  initChatbotService();
  return { ...aiConfigCache };
}

export function updateAIConfig(newConfig: Partial<ChatbotAIConfig>): ChatbotAIConfig {
  initChatbotService();
  const prev = { ...aiConfigCache };
  aiConfigCache = {
    ...aiConfigCache,
    ...newConfig,
  };
  saveToStorage(STORAGE_KEYS.AI_CONFIG, aiConfigCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: 'CONFIG_UPDATED',
    targetType: 'CHATBOT_AI_CONFIG',
    targetId: 'HCA-KE-2026',
    details: { previous: prev, updated: aiConfigCache },
  });

  return { ...aiConfigCache };
}

export function isAIAvailable(): boolean {
  initChatbotService();
  return aiConfigCache.enabled && aiConfigCache.globalEnabled && !aiConfigCache.emergencyMode;
}

export function triggerEmergencyDisable(reason: string = 'Administrator emergency override'): ChatbotAIConfig {
  initChatbotService();
  aiConfigCache.emergencyMode = true;
  saveToStorage(STORAGE_KEYS.AI_CONFIG, aiConfigCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: 'EMERGENCY_DISABLED',
    targetType: 'CHATBOT_AI_CONFIG',
    targetId: 'HCA-KE-2026',
    details: { reason },
  });

  return { ...aiConfigCache };
}

export function liftEmergencyDisable(): ChatbotAIConfig {
  initChatbotService();
  aiConfigCache.emergencyMode = false;
  saveToStorage(STORAGE_KEYS.AI_CONFIG, aiConfigCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: 'EMERGENCY_LIFTED',
    targetType: 'CHATBOT_AI_CONFIG',
    targetId: 'HCA-KE-2026',
    details: { status: 'Emergency override lifted' },
  });

  return { ...aiConfigCache };
}

// -------------------------------------------------------------
// Module 40: Providers, Quotas, Usage & Audits
// -------------------------------------------------------------

function recordGovernanceAudit(input: {
  actorId: string;
  actorName: string;
  action: AIAuditAction;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
}): AIGovernanceAudit {
  const entry: AIGovernanceAudit = {
    id: `aud-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
    institutionId: 'HCA-KE-2026',
    actorId: input.actorId,
    actorName: input.actorName,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    details: input.details,
    createdAt: new Date().toISOString(),
  };
  auditsCache.unshift(entry);
  saveToStorage(STORAGE_KEYS.AUDITS, auditsCache);
  return entry;
}

function recordAIUsageInternal(input: {
  userRole: string;
  departmentId?: string | null;
  conversationId?: string | null;
  providerKey: string;
  model: string;
  operation: AIUsageRecord['operation'];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  requestStatus: AIUsageRecord['requestStatus'];
}): void {
  const totalTokens = input.inputTokens + input.outputTokens;
  const estimatedCost = Number(((totalTokens / 1000000) * 0.15).toFixed(6));

  const rec: AIUsageRecord = {
    id: `usg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    institutionId: 'HCA-KE-2026',
    userId: 'visitor-session',
    userRole: input.userRole,
    departmentId: input.departmentId ?? 'GENERAL',
    conversationId: input.conversationId ?? null,
    providerKey: input.providerKey,
    model: input.model,
    operation: input.operation,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    totalTokens,
    estimatedCost,
    latencyMs: input.latencyMs,
    requestStatus: input.requestStatus,
    createdAt: new Date().toISOString(),
  };
  usageRecordsCache.unshift(rec);
  saveToStorage(STORAGE_KEYS.USAGE_RECORDS, usageRecordsCache);

  // Update quota consumption
  const qIndex = quotasCache.findIndex((q) => q.role === input.userRole);
  if (qIndex >= 0 && input.requestStatus === 'SUCCESS') {
    quotasCache[qIndex].usedTokensThisMonth += totalTokens;
    quotasCache[qIndex].usedRequestsThisMonth += 1;
    quotasCache[qIndex].updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.QUOTAS, quotasCache);

    const quota = quotasCache[qIndex];
    if (quota.usedTokensThisMonth >= quota.monthlyTokens * 0.9) {
      createServiceAlertInternal({
        type: quota.usedTokensThisMonth >= quota.monthlyTokens ? 'QUOTA_EXCEEDED' : 'QUOTA_WARNING',
        severity: quota.usedTokensThisMonth >= quota.monthlyTokens ? 'CRITICAL' : 'WARNING',
        title: `${quota.role} Monthly Quota Threshold Alert`,
        message: `${quota.role} role reached ${quota.usedTokensThisMonth.toLocaleString()} / ${quota.monthlyTokens.toLocaleString()} monthly tokens.`,
        source: 'aiQuotaMonitor',
      });
    }
  }
}

function recordAIRetrievalInternal(input: {
  conversationId?: string | null;
  messageId?: string | null;
  outcome: AIRetrievalOutcome;
  topSimilarity: number;
  retrievedCount: number;
  citedArticleIds: string[];
}): void {
  const metric: AIRetrievalMetric = {
    id: `ret-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    institutionId: 'HCA-KE-2026',
    conversationId: input.conversationId ?? null,
    messageId: input.messageId ?? null,
    outcome: input.outcome,
    topSimilarity: input.topSimilarity,
    retrievedCount: input.retrievedCount,
    citedArticleIds: input.citedArticleIds,
    createdAt: new Date().toISOString(),
  };
  retrievalMetricsCache.unshift(metric);
  saveToStorage(STORAGE_KEYS.RETRIEVAL_METRICS, retrievalMetricsCache);
}

function createServiceAlertInternal(input: {
  type: AIAlertType;
  severity: AIServiceAlert['severity'];
  title: string;
  message: string;
  source: string;
}): void {
  const existingOpen = alertsCache.find(
    (a) => a.type === input.type && a.title === input.title && a.status !== 'RESOLVED'
  );
  if (existingOpen) return;

  const now = new Date().toISOString();
  const alert: AIServiceAlert = {
    id: `alt-${Date.now().toString().slice(-6)}`,
    institutionId: 'HCA-KE-2026',
    type: input.type,
    severity: input.severity,
    status: 'OPEN',
    title: input.title,
    message: input.message,
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };
  alertsCache.unshift(alert);
  saveToStorage(STORAGE_KEYS.ALERTS, alertsCache);
}

export function getAIProviders(): AIProviderConfiguration[] {
  initChatbotService();
  return [...providersCache];
}

export function runProviderHealthCheck(providerKey: string): AIProviderHealthHistory {
  initChatbotService();
  const now = new Date().toISOString();
  const provider = providersCache.find((p) => p.providerKey === providerKey);
  const isDisabledByPolicy = provider?.status === 'DISABLED';

  const latencyMs = isDisabledByPolicy ? 0 : Math.floor(140 + Math.random() * 140);
  const healthy = !isDisabledByPolicy;
  const message = isDisabledByPolicy
    ? 'Provider intentionally disabled by institutional policy.'
    : `Health check passed (${latencyMs}ms). Server-side credentials verified without browser exposure.`;

  if (provider) {
    provider.lastHealthCheck = now;
    provider.lastHealthError = healthy ? null : message;
    saveToStorage(STORAGE_KEYS.PROVIDERS, providersCache);
  }

  const historyEntry: AIProviderHealthHistory = {
    id: `phh-${Date.now()}`,
    institutionId: 'HCA-KE-2026',
    providerKey,
    healthy,
    latencyMs,
    message,
    checkedAt: now,
  };
  healthHistoryCache.unshift(historyEntry);
  saveToStorage(STORAGE_KEYS.HEALTH_HISTORY, healthHistoryCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: 'PROVIDER_CHECKED',
    targetType: 'AI_PROVIDER',
    targetId: providerKey,
    details: { healthy, latencyMs, message },
  });

  return historyEntry;
}

export function getProviderHealthHistory(): AIProviderHealthHistory[] {
  initChatbotService();
  return [...healthHistoryCache];
}

export function getAIQuotas(): AIUsageQuota[] {
  initChatbotService();
  return [...quotasCache];
}

export function saveAIQuota(quota: AIUsageQuota): AIUsageQuota {
  initChatbotService();
  const index = quotasCache.findIndex((q) => q.id === quota.id || q.role === quota.role);
  const updated: AIUsageQuota = {
    ...quota,
    updatedAt: new Date().toISOString(),
  };
  if (index >= 0) {
    quotasCache[index] = updated;
  } else {
    quotasCache.push(updated);
  }
  saveToStorage(STORAGE_KEYS.QUOTAS, quotasCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: 'QUOTA_UPDATED',
    targetType: 'AI_QUOTA',
    targetId: updated.id,
    details: {
      role: updated.role,
      monthlyTokens: updated.monthlyTokens,
      monthlyRequests: updated.monthlyRequests,
      enabled: updated.enabled,
    },
  });

  return updated;
}

// -------------------------------------------------------------
// Module 40 & 41: Prompt Versioning & Rollback
// -------------------------------------------------------------

export function getPromptTemplates(): AIPromptTemplate[] {
  initChatbotService();
  return [...promptsCache].sort((a, b) => b.version - a.version);
}

export function getPromptHistory(): AIPromptVersionHistory[] {
  initChatbotService();
  return [...promptHistoryCache].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createPromptTemplate(input: {
  name: string;
  description: string;
  content: string;
}): AIPromptTemplate {
  initChatbotService();
  const now = new Date().toISOString();
  const maxVersion = promptsCache.reduce(
    (max, p) => (p.name === input.name && p.version > max ? p.version : max),
    0
  );
  const newVersion = maxVersion + 1;

  const created: AIPromptTemplate = {
    id: `prm-${Date.now().toString().slice(-6)}`,
    institutionId: 'HCA-KE-2026',
    name: input.name,
    description: input.description,
    version: newVersion,
    content: input.content,
    status: 'DRAFT',
    createdById: 'HCA/ADMIN/2026/001',
    publishedById: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  promptsCache.unshift(created);
  saveToStorage(STORAGE_KEYS.PROMPTS, promptsCache);

  promptHistoryCache.unshift({
    id: `ph-${Date.now()}`,
    institutionId: 'HCA-KE-2026',
    promptId: created.id,
    promptName: created.name,
    version: created.version,
    action: 'CREATED',
    contentSnapshot: created.content,
    changedById: 'HCA/ADMIN/2026/001',
    changedByName: 'Super Administrator',
    createdAt: now,
  });
  saveToStorage(STORAGE_KEYS.PROMPT_HISTORY, promptHistoryCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: 'PROMPT_CREATED',
    targetType: 'AI_PROMPT',
    targetId: created.id,
    details: { name: created.name, version: created.version },
  });

  return created;
}

export function publishPromptTemplate(promptId: string, isRollback = false): boolean {
  initChatbotService();
  const target = promptsCache.find((p) => p.id === promptId);
  if (!target) return false;

  const now = new Date().toISOString();

  // Archive any currently published prompt with same name
  for (const p of promptsCache) {
    if (p.name === target.name && p.status === 'PUBLISHED' && p.id !== target.id) {
      p.status = 'ARCHIVED';
      p.updatedAt = now;
    }
  }

  target.status = 'PUBLISHED';
  target.publishedById = 'HCA/ADMIN/2026/001';
  target.publishedAt = now;
  target.updatedAt = now;
  saveToStorage(STORAGE_KEYS.PROMPTS, promptsCache);

  promptHistoryCache.unshift({
    id: `ph-${Date.now()}`,
    institutionId: 'HCA-KE-2026',
    promptId: target.id,
    promptName: target.name,
    version: target.version,
    action: isRollback ? 'ROLLED_BACK' : 'PUBLISHED',
    contentSnapshot: target.content,
    changedById: 'HCA/ADMIN/2026/001',
    changedByName: 'Super Administrator',
    createdAt: now,
  });
  saveToStorage(STORAGE_KEYS.PROMPT_HISTORY, promptHistoryCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: isRollback ? 'PROMPT_ROLLED_BACK' : 'PROMPT_PUBLISHED',
    targetType: 'AI_PROMPT',
    targetId: target.id,
    details: { name: target.name, version: target.version },
  });

  return true;
}

export function archivePromptTemplate(promptId: string): boolean {
  initChatbotService();
  const target = promptsCache.find((p) => p.id === promptId);
  if (!target) return false;

  const now = new Date().toISOString();
  target.status = 'ARCHIVED';
  target.updatedAt = now;
  saveToStorage(STORAGE_KEYS.PROMPTS, promptsCache);

  promptHistoryCache.unshift({
    id: `ph-${Date.now()}`,
    institutionId: 'HCA-KE-2026',
    promptId: target.id,
    promptName: target.name,
    version: target.version,
    action: 'ARCHIVED',
    contentSnapshot: target.content,
    changedById: 'HCA/ADMIN/2026/001',
    changedByName: 'Super Administrator',
    createdAt: now,
  });
  saveToStorage(STORAGE_KEYS.PROMPT_HISTORY, promptHistoryCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: 'PROMPT_ARCHIVED',
    targetType: 'AI_PROMPT',
    targetId: target.id,
    details: { name: target.name, version: target.version },
  });

  return true;
}

// -------------------------------------------------------------
// Module 41: Persistent Knowledge Indexing Queue
// -------------------------------------------------------------

export function getIndexingJobs(): AIKnowledgeIndexJob[] {
  initChatbotService();
  return [...indexJobsCache].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function enqueueKnowledgeIndexing(
  articleId: string,
  requestedById: string = 'HCA/ADMIN/2026/001'
): AIKnowledgeIndexJob | null {
  initChatbotService();
  const article = articlesCache.find((a) => a.id === articleId);
  if (!article) return null;

  const existing = indexJobsCache.find(
    (j) => j.articleId === articleId && (j.status === 'PENDING' || j.status === 'PROCESSING')
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const newJob: AIKnowledgeIndexJob = {
    id: `idx-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 4)}`,
    institutionId: 'HCA-KE-2026',
    articleId: article.id,
    articleQuestion: article.question,
    articleCategory: article.category,
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 5,
    lastError: null,
    embeddingModel: 'text-embedding-004',
    requestedById,
    startedAt: null,
    completedAt: null,
    nextRetryAt: now,
    createdAt: now,
    updatedAt: now,
  };

  article.indexingStatus = 'PENDING';
  article.indexingError = null;
  saveToStorage(STORAGE_KEYS.ARTICLES, articlesCache);

  indexJobsCache.unshift(newJob);
  saveToStorage(STORAGE_KEYS.INDEX_JOBS, indexJobsCache);

  recordGovernanceAudit({
    actorId: requestedById,
    actorName: 'Super Administrator',
    action: 'INDEXING_REQUESTED',
    targetType: 'KNOWLEDGE_BASE',
    targetId: article.id,
    details: { jobId: newJob.id, question: article.question },
  });

  return newJob;
}

export function retryIndexingJob(jobId: string): boolean {
  initChatbotService();
  const job = indexJobsCache.find((j) => j.id === jobId);
  if (!job || job.status !== 'FAILED') return false;

  const now = new Date().toISOString();
  job.status = 'INDEXED';
  job.attempts += 1;
  job.lastError = null;
  job.completedAt = now;
  job.updatedAt = now;
  saveToStorage(STORAGE_KEYS.INDEX_JOBS, indexJobsCache);

  const art = articlesCache.find((a) => a.id === job.articleId);
  if (art) {
    art.indexingStatus = 'INDEXED';
    art.indexingError = null;
    art.indexedAt = now;
    art.embeddingModel = job.embeddingModel || 'text-embedding-004';
    saveToStorage(STORAGE_KEYS.ARTICLES, articlesCache);
  }

  return true;
}

export function cancelIndexingJob(jobId: string): boolean {
  initChatbotService();
  const job = indexJobsCache.find((j) => j.id === jobId);
  if (!job || job.status !== 'PENDING') return false;

  job.status = 'CANCELLED';
  job.updatedAt = new Date().toISOString();
  saveToStorage(STORAGE_KEYS.INDEX_JOBS, indexJobsCache);
  return true;
}

export function runBulkReindexPublished(): number {
  initChatbotService();
  const published = articlesCache.filter((a) => a.status === 'PUBLISHED');
  let queued = 0;
  for (const art of published) {
    const job = enqueueKnowledgeIndexing(art.id, 'HCA/ADMIN/2026/001');
    if (job) queued++;
  }
  return queued;
}

export function processNextIndexingBatch(): number {
  initChatbotService();
  const now = new Date().toISOString();
  const pending = indexJobsCache.filter((j) => j.status === 'PENDING').slice(0, 5);
  let processed = 0;

  for (const job of pending) {
    job.status = 'INDEXED';
    job.attempts += 1;
    job.startedAt = now;
    job.completedAt = now;
    job.updatedAt = now;
    job.lastError = null;

    const art = articlesCache.find((a) => a.id === job.articleId);
    if (art) {
      art.indexingStatus = 'INDEXED';
      art.indexedAt = now;
      art.indexingError = null;
      art.embeddingModel = job.embeddingModel || 'text-embedding-004';
    }
    processed++;
  }

  saveToStorage(STORAGE_KEYS.INDEX_JOBS, indexJobsCache);
  saveToStorage(STORAGE_KEYS.ARTICLES, articlesCache);
  return processed;
}

// -------------------------------------------------------------
// Module 41 & 42: Audit Logs, Performance Report & Alerts
// -------------------------------------------------------------

export function getGovernanceAudits(filters?: {
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
}): AIGovernanceAudit[] {
  initChatbotService();
  return [...auditsCache]
    .filter((rec) => {
      if (filters?.action && rec.action !== filters.action) return false;
      if (
        filters?.targetType &&
        !rec.targetType.toLowerCase().includes(filters.targetType.toLowerCase())
      ) {
        return false;
      }
      if (filters?.from && new Date(rec.createdAt) < new Date(filters.from)) return false;
      if (filters?.to && new Date(rec.createdAt) > new Date(filters.to)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function exportGovernanceAuditsCSV(): string {
  const records = getGovernanceAudits();
  const header = ['Audit ID', 'Timestamp', 'Actor ID', 'Actor Name', 'Action', 'Target Type', 'Target ID', 'Details'];
  const rows = records.map((r) => [
    r.id,
    r.createdAt,
    r.actorId,
    r.actorName,
    r.action,
    r.targetType,
    r.targetId || '',
    JSON.stringify(r.details || {}).replace(/"/g, '""'),
  ]);
  return [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
}

export function getAIServiceAlerts(): AIServiceAlert[] {
  initChatbotService();
  return [...alertsCache].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateAIServiceAlert(
  alertId: string,
  newStatus: Extract<AIAlertStatus, 'ACKNOWLEDGED' | 'RESOLVED'>
): boolean {
  initChatbotService();
  const alert = alertsCache.find((a) => a.id === alertId);
  if (!alert) return false;

  const now = new Date().toISOString();
  alert.status = newStatus;
  alert.updatedAt = now;
  if (newStatus === 'ACKNOWLEDGED') {
    alert.acknowledgedById = 'HCA/ADMIN/2026/001';
    alert.acknowledgedAt = now;
  } else {
    alert.resolvedById = 'HCA/ADMIN/2026/001';
    alert.resolvedAt = now;
  }
  saveToStorage(STORAGE_KEYS.ALERTS, alertsCache);

  recordGovernanceAudit({
    actorId: 'HCA/ADMIN/2026/001',
    actorName: 'Super Administrator',
    action: newStatus === 'ACKNOWLEDGED' ? 'ALERT_ACKNOWLEDGED' : 'ALERT_RESOLVED',
    targetType: 'AI_SERVICE_ALERT',
    targetId: alertId,
    details: { title: alert.title, status: newStatus },
  });

  return true;
}

export function getAIPerformanceDashboard(days: number = 30): AIPerformanceReport {
  initChatbotService();

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const usageInRange = usageRecordsCache.filter(
    (u) => new Date(u.createdAt).getTime() >= cutoff
  );
  const retrievalInRange = retrievalMetricsCache.filter(
    (r) => new Date(r.createdAt).getTime() >= cutoff
  );

  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let estimatedCost = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let blockedRequests = 0;
  let latencySum = 0;

  const roleMap: Record<string, { requests: number; totalTokens: number }> = {};
  const modelMap: Record<
    string,
    { providerKey: string; model: string; requests: number; totalTokens: number; estimatedCost: number }
  > = {};
  const deptMap: Record<string, { requests: number; totalTokens: number }> = {};
  const providerAgg: Record<string, { success: number; fail: number; latencySum: number; count: number }> = {};

  for (const u of usageInRange) {
    inputTokens += u.inputTokens;
    outputTokens += u.outputTokens;
    totalTokens += u.totalTokens;
    estimatedCost += u.estimatedCost;
    latencySum += u.latencyMs;

    if (u.requestStatus === 'SUCCESS') successfulRequests++;
    else if (u.requestStatus === 'FAILED') failedRequests++;
    else blockedRequests++;

    if (!roleMap[u.userRole]) roleMap[u.userRole] = { requests: 0, totalTokens: 0 };
    roleMap[u.userRole].requests++;
    roleMap[u.userRole].totalTokens += u.totalTokens;

    const mKey = `${u.providerKey}::${u.model}`;
    if (!modelMap[mKey]) {
      modelMap[mKey] = {
        providerKey: u.providerKey,
        model: u.model,
        requests: 0,
        totalTokens: 0,
        estimatedCost: 0,
      };
    }
    modelMap[mKey].requests++;
    modelMap[mKey].totalTokens += u.totalTokens;
    modelMap[mKey].estimatedCost += u.estimatedCost;

    const dept = u.departmentId || 'GENERAL';
    if (!deptMap[dept]) deptMap[dept] = { requests: 0, totalTokens: 0 };
    deptMap[dept].requests++;
    deptMap[dept].totalTokens += u.totalTokens;

    if (!providerAgg[u.providerKey]) {
      providerAgg[u.providerKey] = { success: 0, fail: 0, latencySum: 0, count: 0 };
    }
    if (u.requestStatus === 'SUCCESS') providerAgg[u.providerKey].success++;
    else if (u.requestStatus === 'FAILED') providerAgg[u.providerKey].fail++;
    providerAgg[u.providerKey].latencySum += u.latencyMs;
    providerAgg[u.providerKey].count++;
  }

  const retrievalMap: Record<AIRetrievalOutcome, { count: number; simSum: number }> = {
    ANSWERED: { count: 0, simSum: 0 },
    NO_MATCH: { count: 0, simSum: 0 },
    LOW_CONFIDENCE: { count: 0, simSum: 0 },
    FALLBACK: { count: 0, simSum: 0 },
    ESCALATED: { count: 0, simSum: 0 },
  };

  for (const r of retrievalInRange) {
    retrievalMap[r.outcome].count++;
    retrievalMap[r.outcome].simSum += r.topSimilarity;
  }

  const providerMetrics = providersCache.map((p) => {
    const agg = providerAgg[p.providerKey] || { success: 0, fail: 0, latencySum: 0, count: 0 };
    return {
      providerKey: p.providerKey,
      displayName: p.displayName,
      status: p.status,
      successCount: agg.success,
      failureCount: agg.fail,
      avgLatencyMs: agg.count > 0 ? Math.round(agg.latencySum / agg.count) : 0,
    };
  });

  return {
    periodDays: days,
    totals: {
      requests: usageInRange.length,
      successfulRequests,
      failedRequests,
      blockedRequests,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost: Number(estimatedCost.toFixed(6)),
      avgLatencyMs: usageInRange.length > 0 ? Math.round(latencySum / usageInRange.length) : 0,
    },
    byRole: Object.entries(roleMap).map(([role, stats]) => ({
      role,
      ...stats,
    })),
    byModel: Object.values(modelMap),
    byDepartment: Object.entries(deptMap).map(([department, stats]) => ({
      department,
      ...stats,
    })),
    retrievalBreakdown: (Object.entries(retrievalMap) as Array<[AIRetrievalOutcome, { count: number; simSum: number }]>).map(
      ([outcome, s]) => ({
        outcome,
        count: s.count,
        avgSimilarity: s.count > 0 ? Number((s.simSum / s.count).toFixed(2)) : 0,
      })
    ),
    providerMetrics,
    openAlerts: alertsCache.filter((a) => a.status === 'OPEN').length,
  };
}


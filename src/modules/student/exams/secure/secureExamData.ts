import type {
  ExamDefinition,
  ExamSecurityPolicy,
  ExamSession,
} from './examTypes';

export interface SecureExamCatalogItem {
  id: string;
  code: string;
  title: string;
  subject: string;
  unitCode: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  startsAt: string;
  endsAt: string;
  windowOpen: boolean;
  securityLevel: 'LEVEL_1_WEB' | 'LEVEL_2_LOCKED';
  securityPolicy: ExamSecurityPolicy;
  attemptsUsed: number;
  maxAttempts: number;
  activeSessionId: string | null;
  latestStatus: string | null;
}

export const DEFAULT_CLIENT_SECURITY_POLICY: ExamSecurityPolicy = {
  securityLevel: 'LEVEL_1_WEB',
  requireFullscreen: true,
  disableCopy: true,
  disablePaste: true,
  disableCut: true,
  disableRightClick: true,
  blockProhibitedShortcuts: true,
  trackTabSwitching: true,
  trackFullscreenExit: true,
  autoSaveAnswers: true,
  autoSubmitOnExpiry: true,
  logSecurityIncidents: true,
  requireWebcamMonitoring: false,
  requireScreenRecording: false,
  restrictToManagedDevices: false,
  requireSafeExamBrowser: false,
  tabSwitchWarningAt: 1,
  tabSwitchIncidentAt: 2,
  tabSwitchSupervisorAt: 3,
  fullscreenExitSupervisorAt: 2,
};

export const FALLBACK_SECURE_EXAMS: ExamDefinition[] = [
  {
    id: 'sec-exam-net-cat',
    code: 'NET-204-CAT',
    title: 'Computer Networking CAT',
    subject: 'ICT 204 · Computer Networking & Routing',
    unitCode: 'ICT 204',
    durationMinutes: 60,
    totalMarks: 30,
    startsAt: new Date(Date.now() - 86_400_000).toISOString(),
    endsAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    instructions: [
      'Ensure a stable internet connection before launching Secure Examination Mode.',
      'Do not switch browser tabs, exit fullscreen, or open external resources while the session is active.',
      'All objective and structured answers autosave automatically and submit on expiry.',
      'Contact the examination supervisor immediately if your device experiences a hardware or power fault.',
    ],
    questions: [
      {
        id: 'net-q1',
        number: 1,
        type: 'LONG_ANSWER',
        instruction: 'Provide concise, numbered points with technical terminology.',
        text: 'Explain three core functions of a router in a computer network.',
        marks: 9,
      },
      {
        id: 'net-q2',
        number: 2,
        type: 'SINGLE_CHOICE',
        text: 'At which layer of the OSI reference model does a standard IP router primarily forward packets?',
        marks: 3,
        options: [
          { id: 'opt-a', text: 'Layer 1 — Physical Layer' },
          { id: 'opt-b', text: 'Layer 2 — Data Link Layer' },
          { id: 'opt-c', text: 'Layer 3 — Network Layer' },
          { id: 'opt-d', text: 'Layer 4 — Transport Layer' },
        ],
      },
      {
        id: 'net-q3',
        number: 3,
        type: 'MULTIPLE_CHOICE',
        instruction: 'Select all protocols that operate cleanly over TCP.',
        text: 'Which of the following application-layer protocols rely on TCP for reliable transport?',
        marks: 6,
        options: [
          { id: 'opt-http', text: 'HTTP / HTTPS' },
          { id: 'opt-ssh', text: 'SSH' },
          { id: 'opt-dhcp', text: 'DHCP' },
          { id: 'opt-smtp', text: 'SMTP' },
        ],
      },
      {
        id: 'net-q4',
        number: 4,
        type: 'TRUE_FALSE',
        text: 'A /26 IPv4 subnet mask provides 62 usable host addresses per subnet.',
        marks: 4,
        options: [
          { id: 'opt-true', text: 'True' },
          { id: 'opt-false', text: 'False' },
        ],
      },
      {
        id: 'net-q5',
        number: 5,
        type: 'SHORT_ANSWER',
        text: 'State the command used on Cisco IOS routers to verify the active routing table and explain two columns shown.',
        marks: 8,
      },
    ],
  },
  {
    id: 'sec-exam-csc301',
    code: 'CSC-301-MID',
    title: 'CSC 301 Data Structures & Algorithms CBT',
    subject: 'CSC 301 · Advanced Data Structures & Algorithms',
    unitCode: 'CSC 301',
    durationMinutes: 45,
    totalMarks: 25,
    startsAt: new Date(Date.now() - 86_400_000).toISOString(),
    endsAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    instructions: [
      'Complete all questions within the 45-minute countdown.',
      'Copy, paste, right-click, and developer tools shortcuts are blocked during the exam.',
      'Your server-authoritative timer continues running even if the browser refreshes.',
    ],
    questions: [
      {
        id: 'csc-q1',
        number: 1,
        type: 'SINGLE_CHOICE',
        text: 'Which data structure supports O(1) amortized insertion and LIFO retrieval?',
        marks: 5,
        options: [
          { id: 'opt-1', text: 'Array-backed Stack' },
          { id: 'opt-2', text: 'Binary Heap' },
          { id: 'opt-3', text: 'Adjacency Matrix' },
          { id: 'opt-4', text: 'Trie' },
        ],
      },
      {
        id: 'csc-q2',
        number: 2,
        type: 'TRUE_FALSE',
        text: 'Breadth-First Search (BFS) guarantees the shortest path in an unweighted graph.',
        marks: 5,
        options: [
          { id: 'opt-t', text: 'True' },
          { id: 'opt-f', text: 'False' },
        ],
      },
      {
        id: 'csc-q3',
        number: 3,
        type: 'SHORT_ANSWER',
        text: 'Compare the worst-case time complexity of Merge Sort and QuickSort and identify when Merge Sort is preferred.',
        marks: 15,
      },
    ],
  },
];

export function buildFallbackCatalog(): SecureExamCatalogItem[] {
  return FALLBACK_SECURE_EXAMS.map((exam) => ({
    id: exam.id,
    code: exam.code ?? exam.id.toUpperCase(),
    title: exam.title,
    subject: exam.subject,
    unitCode: exam.unitCode ?? 'EXAM',
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    questionCount: exam.questions.length,
    startsAt: exam.startsAt,
    endsAt: exam.endsAt,
    windowOpen: true,
    securityLevel: 'LEVEL_1_WEB',
    securityPolicy: { ...DEFAULT_CLIENT_SECURITY_POLICY },
    attemptsUsed: 0,
    maxAttempts: 2,
    activeSessionId: null,
    latestStatus: null,
  }));
}

export function buildInstructionSessionFromCatalog(
  item: SecureExamCatalogItem,
  candidate: { name: string; regNo: string },
  localPreviewMode = false
): ExamSession {
  const matched =
    FALLBACK_SECURE_EXAMS.find((e) => e.id === item.id) ?? FALLBACK_SECURE_EXAMS[0];

  return {
    id: item.activeSessionId || `PREVIEW-${item.id}`,
    status: 'instructions',
    candidateName: candidate.name,
    candidateRegNo: candidate.regNo,
    answers: [],
    securityPolicy: item.securityPolicy,
    localPreviewMode,
    exam: {
      ...matched,
      id: item.id,
      code: item.code,
      title: item.title,
      subject: item.subject,
      unitCode: item.unitCode,
      durationMinutes: item.durationMinutes,
      totalMarks: item.totalMarks,
    },
  };
}

export async function fetchAvailableSecureExams(): Promise<{
  items: SecureExamCatalogItem[];
  serverBacked: boolean;
}> {
  if (typeof fetch !== 'function') {
    return { items: buildFallbackCatalog(), serverBacked: false };
  }
  try {
    const res = await fetch('/api/student/exam-sessions/exams', {
      credentials: 'include',
    });
    if (!res.ok) {
      return { items: buildFallbackCatalog(), serverBacked: false };
    }
    const payload = (await res.json()) as {
      success?: boolean;
      data?: SecureExamCatalogItem[];
    };
    if (payload.success && Array.isArray(payload.data)) {
      return { items: payload.data, serverBacked: true };
    }
  } catch {
    // Fallback cleanly when offline or running client role-switcher preview
  }
  return { items: buildFallbackCatalog(), serverBacked: false };
}

export async function startServerSecureExamSession(
  examId: string,
  candidate: { name: string; regNo: string }
): Promise<ExamSession | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch(`/api/student/exam-sessions/${encodeURIComponent(examId)}/start`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId }),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      success?: boolean;
      data?: Omit<ExamSession, 'candidateName' | 'candidateRegNo'>;
    };
    if (!payload.success || !payload.data) return null;
    return {
      ...payload.data,
      status: 'active',
      candidateName: candidate.name,
      candidateRegNo: candidate.regNo,
      localPreviewMode: false,
    };
  } catch {
    return null;
  }
}

export async function resumeServerSecureExamSession(
  sessionId: string,
  candidate: { name: string; regNo: string }
): Promise<ExamSession | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch(`/api/student/exam-sessions/${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      success?: boolean;
      data?: Omit<ExamSession, 'candidateName' | 'candidateRegNo'>;
    };
    if (!payload.success || !payload.data) return null;
    return {
      ...payload.data,
      candidateName: candidate.name,
      candidateRegNo: candidate.regNo,
      localPreviewMode: false,
    };
  } catch {
    return null;
  }
}

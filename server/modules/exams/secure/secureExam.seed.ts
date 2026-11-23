import type {
  ExamSecurityPolicy,
  SecureExamAuditLogRecord,
  SecureExamDefinitionRecord,
  SecureExamIncidentRecord,
  SecureExamMessageRecord,
  SecureExamSecurityEventRecord,
  SecureExamSessionRecord,
} from './secureExam.types.ts';

export const DEFAULT_SECURITY_POLICY: ExamSecurityPolicy = {
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

export interface SecureExamStoreSlice {
  secureExamDefinitions: SecureExamDefinitionRecord[];
  secureExamSessions: SecureExamSessionRecord[];
  secureExamEvents: SecureExamSecurityEventRecord[];
  secureExamIncidents: SecureExamIncidentRecord[];
  secureExamAuditLogs: SecureExamAuditLogRecord[];
  secureExamMessages: SecureExamMessageRecord[];
}

export function createSecureExamSeed(): SecureExamStoreSlice {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const pastStart = new Date(now - oneDayMs).toISOString();
  const futureEnd = new Date(now + 14 * oneDayMs).toISOString();

  const definitions: SecureExamDefinitionRecord[] = [
    {
      id: 'sec-exam-net-cat',
      code: 'NET-204-CAT',
      title: 'Computer Networking CAT',
      subject: 'ICT 204 · Computer Networking & Routing',
      unitCode: 'ICT 204',
      durationMinutes: 60,
      totalMarks: 30,
      isPublished: true,
      startsAt: pastStart,
      endsAt: futureEnd,
      maxAttempts: 2,
      instructions: [
        'Ensure a stable internet connection before launching Secure Examination Mode.',
        'Do not switch browser tabs, exit fullscreen, or open external resources while the session is active.',
        'All objective and structured answers autosave automatically and submit on expiry.',
        'Contact the examination supervisor immediately if your device experiences a hardware or power fault.',
      ],
      securityPolicy: { ...DEFAULT_SECURITY_POLICY },
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
          correctOptionIds: ['opt-c'],
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
          correctOptionIds: ['opt-http', 'opt-ssh', 'opt-smtp'],
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
          correctOptionIds: ['opt-true'],
        },
        {
          id: 'net-q5',
          number: 5,
          type: 'SHORT_ANSWER',
          text: 'State the command used on Cisco IOS routers to verify the active routing table and explain two columns shown.',
          marks: 8,
        },
      ],
      updatedAt: new Date(now).toISOString(),
    },
    {
      id: 'sec-exam-csc301',
      code: 'CSC-301-MID',
      title: 'CSC 301 Data Structures & Algorithms CBT',
      subject: 'CSC 301 · Advanced Data Structures & Algorithms',
      unitCode: 'CSC 301',
      durationMinutes: 45,
      totalMarks: 25,
      isPublished: true,
      startsAt: pastStart,
      endsAt: futureEnd,
      maxAttempts: 2,
      instructions: [
        'Complete all questions within the 45-minute countdown.',
        'Copy, paste, right-click, and developer tools shortcuts are blocked during the exam.',
        'Your server-authoritative timer continues running even if the browser refreshes.',
      ],
      securityPolicy: { ...DEFAULT_SECURITY_POLICY },
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
          correctOptionIds: ['opt-1'],
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
          correctOptionIds: ['opt-t'],
        },
        {
          id: 'csc-q3',
          number: 3,
          type: 'SHORT_ANSWER',
          text: 'Compare the worst-case time complexity of Merge Sort and QuickSort and identify when Merge Sort is preferred.',
          marks: 15,
        },
      ],
      updatedAt: new Date(now).toISOString(),
    },
  ];

  // Illustrative historical supervisor inspection record (Section 7)
  const sampleStarted = new Date(now - 35 * 60 * 1000).toISOString();
  const sampleExpires = new Date(now + 25 * 60 * 1000).toISOString();
  const sampleSessions: SecureExamSessionRecord[] = [
    {
      id: 'EXAM-SESSION-001',
      examId: 'sec-exam-net-cat',
      studentId: 'stu-sample-002',
      studentRegNo: 'HCA/STU/2026/014',
      studentName: 'Brian Kipkorir',
      attemptNumber: 1,
      status: 'ACTIVE',
      startedAt: sampleStarted,
      expiresAt: sampleExpires,
      lastSavedAt: new Date(now - 2 * 60 * 1000).toISOString(),
      lastHeartbeatAt: new Date(now - 2 * 60 * 1000).toISOString(),
      answers: [
        {
          questionId: 'net-q2',
          value: 'opt-c',
          updatedAt: new Date(now - 5 * 60 * 1000).toISOString(),
          savedAt: new Date(now - 5 * 60 * 1000).toISOString(),
        },
      ],
      createdAt: sampleStarted,
      updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    },
  ];

  const sampleEvents: SecureExamSecurityEventRecord[] = [
    {
      id: 'sec-ev-001',
      sessionId: 'EXAM-SESSION-001',
      eventType: 'TAB_HIDDEN',
      occurredAt: new Date(now - 12 * 60 * 1000).toISOString(),
      receivedAt: new Date(now - 12 * 60 * 1000).toISOString(),
      details: 'Candidate tab visibility changed to hidden.',
      responseTriggered: 'WARNING',
    },
    {
      id: 'sec-ev-002',
      sessionId: 'EXAM-SESSION-001',
      eventType: 'FULLSCREEN_EXIT',
      occurredAt: new Date(now - 11 * 60 * 1000).toISOString(),
      receivedAt: new Date(now - 11 * 60 * 1000).toISOString(),
      details: 'Browser exited fullscreen during active session.',
      responseTriggered: 'WARNING_AND_LOG',
    },
    {
      id: 'sec-ev-003',
      sessionId: 'EXAM-SESSION-001',
      eventType: 'COPY_ATTEMPT',
      occurredAt: new Date(now - 8 * 60 * 1000).toISOString(),
      receivedAt: new Date(now - 8 * 60 * 1000).toISOString(),
      details: 'Clipboard copy blocked inside exam workspace.',
      responseTriggered: 'BLOCK_AND_LOG',
    },
  ];

  const sampleIncidents: SecureExamIncidentRecord[] = [
    {
      id: 'INC-2026-001',
      sessionId: 'EXAM-SESSION-001',
      examId: 'sec-exam-net-cat',
      examTitle: 'Computer Networking CAT',
      studentId: 'stu-sample-002',
      studentRegNo: 'HCA/STU/2026/014',
      studentName: 'Brian Kipkorir',
      status: 'UNDER_REVIEW',
      severity: 'MEDIUM',
      summary: 'Multiple focus/fullscreen interruptions and blocked clipboard copy attempt recorded.',
      eventCount: 3,
      createdAt: new Date(now - 11 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 8 * 60 * 1000).toISOString(),
    },
  ];

  const sampleLogs: SecureExamAuditLogRecord[] = [
    {
      id: 'seclog-001',
      sessionId: 'EXAM-SESSION-001',
      examId: 'sec-exam-net-cat',
      actorId: 'stu-sample-002',
      actorName: 'Brian Kipkorir',
      action: 'SESSION_STARTED',
      detail: 'Started Computer Networking CAT under Level 1 Web Secure Mode.',
      timestampIso: sampleStarted,
    },
  ];

  const sampleMessages: SecureExamMessageRecord[] = [
    {
      id: 'EXAMMSG-001',
      sessionId: 'EXAM-SESSION-001',
      examId: 'sec-exam-net-cat',
      examTitle: 'Computer Networking CAT',
      studentId: 'stu-sample-002',
      studentName: 'Brian Kipkorir',
      studentRegNo: 'HCA/STU/2026/014',
      senderRole: 'STUDENT',
      senderId: 'stu-sample-002',
      senderName: 'Brian Kipkorir',
      kind: 'HELP_REQUEST',
      priority: 'URGENT',
      body: 'Browser exited fullscreen briefly after a low-battery notification appeared. Can I continue my attempt?',
      createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
      readByStudent: true,
      readBySupervisor: false,
    },
    {
      id: 'EXAMMSG-002',
      sessionId: 'EXAM-SESSION-001',
      examId: 'sec-exam-net-cat',
      examTitle: 'Computer Networking CAT',
      studentId: 'stu-sample-002',
      studentName: 'Brian Kipkorir',
      studentRegNo: 'HCA/STU/2026/014',
      senderRole: 'SUPERVISOR',
      senderId: 'usr-exam-01',
      senderName: 'Dr. Kiprop Chemweno',
      kind: 'SUPERVISOR_INSTRUCTION',
      priority: 'NORMAL',
      body: 'Noted. Click Re-enter Fullscreen and continue your assessment. Your answers remain saved.',
      createdAt: new Date(now - 9 * 60 * 1000).toISOString(),
      readByStudent: false,
      readBySupervisor: true,
    },
  ];

  return {
    secureExamDefinitions: definitions,
    secureExamSessions: sampleSessions,
    secureExamEvents: sampleEvents,
    secureExamIncidents: sampleIncidents,
    secureExamAuditLogs: sampleLogs,
    secureExamMessages: sampleMessages,
  };
}

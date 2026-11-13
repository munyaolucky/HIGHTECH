/**
 * HI-TECH College Examination & LMS Assessment Engine Service
 * Implements pure client-side business rules matching the LMS & ACA-002 specification:
 * - Safe recursive-descent formula evaluator (no eval / no Function constructor)
 * - Answer key stripping via candidateView() snapshot freeze
 * - DRAFT -> IN_REVIEW -> APPROVED (reviewer !== author) & immutable versioning
 * - Assessment publishing rules (publisher !== author, 100% approved items & pools)
 * - Server-clock deadline calculation (earlier of limit & closing time + extra time) + 30s grace
 * - Anonymous marking queue, rubric bounds validation & controlled release
 * - Advisory item analysis (difficulty p, discrimination D, option counts)
 * - Conflict-free venue seating, permit clearance, incidents & supplementary board decisions
 */

import {
  AssessmentDefinition,
  CandidateQuestionSnapshot,
  CandidateResponseValue,
  ExamAttempt,
  ExamIncidentRecord,
  ExamRolePersona,
  ExamSeatAllocation,
  ItemAnalysisStat,
  QuestionItem,
  QuestionMarkRecord,
  SupplementaryDecision,
} from '../types/examAssessment';

const STORAGE_KEY = 'hitech_exam_assessment_engine_v1';

export const ROLE_ACTORS: Record<ExamRolePersona, { id: string; name: string; title: string }> = {
  LECTURER_AUTHOR: {
    id: 'staff-lect-01',
    name: 'Dr. Peter Otieno',
    title: 'Senior Lecturer · School of Computing',
  },
  HOD_MODERATOR: {
    id: 'staff-hod-02',
    name: 'Prof. Mary Wangui',
    title: 'Head of Department & Chief Moderator',
  },
  EXAM_OFFICER: {
    id: 'staff-exam-03',
    name: 'Dr. Kiprop Chemweno',
    title: 'Chief Examination Officer & Registrar',
  },
  STUDENT_CANDIDATE: {
    id: 'stu-001',
    name: 'Amina Wanjiku',
    title: 'BSc Computer Science (HCA/STU/2026/001)',
  },
};

export interface ExamEngineState {
  questions: QuestionItem[];
  assessments: AssessmentDefinition[];
  attempts: ExamAttempt[];
  seatingAllocations: ExamSeatAllocation[];
  incidents: ExamIncidentRecord[];
  supplementaryDecisions: SupplementaryDecision[];
  auditLog: { id: string; timestampIso: string; actor: string; action: string; detail: string }[];
}

// ============================================================================
// SAFE FORMULA EVALUATOR (NO eval / NO new Function)
// Supports +, -, *, /, ^, parentheses, numeric literals, variables, sqrt/abs
// ============================================================================

type MathToken =
  | { type: 'NUM'; value: number }
  | { type: 'IDENT'; value: string }
  | { type: 'OP'; value: string }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' };

function tokenizeMath(input: string): MathToken[] {
  const tokens: MathToken[] = [];
  let i = 0;
  const s = input.trim();

  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < s.length && /[0-9.]/.test(s[i])) {
        numStr += s[i++];
      }
      const val = Number(numStr);
      if (Number.isNaN(val)) throw new Error(`Invalid number "${numStr}"`);
      tokens.push({ type: 'NUM', value: val });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) {
        ident += s[i++];
      }
      tokens.push({ type: 'IDENT', value: ident });
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }
    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }
    throw new Error(`Unsupported character "${ch}" in expression`);
  }
  return tokens;
}

export function evaluateSafeMathExpression(
  expression: string,
  variables: Record<string, number> = {}
): { ok: true; value: number } | { ok: false; error: string } {
  try {
    if (!expression.trim()) return { ok: false, error: 'Empty expression' };
    const tokens = tokenizeMath(expression);
    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    const parsePrimary = (): number => {
      const tok = peek();
      if (!tok) throw new Error('Unexpected end of expression');
      if (tok.type === 'NUM') {
        consume();
        return tok.value;
      }
      if (tok.type === 'IDENT') {
        consume();
        const lower = tok.value.toLowerCase();
        if (lower === 'sqrt' && peek()?.type === 'LPAREN') {
          consume();
          const inner = parseAddSub();
          if (consume()?.type !== 'RPAREN') throw new Error('Missing closing parenthesis');
          if (inner < 0) throw new Error('Square root of negative value');
          return Math.sqrt(inner);
        }
        if (lower === 'abs' && peek()?.type === 'LPAREN') {
          consume();
          const inner = parseAddSub();
          if (consume()?.type !== 'RPAREN') throw new Error('Missing closing parenthesis');
          return Math.abs(inner);
        }
        if (Object.prototype.hasOwnProperty.call(variables, tok.value)) {
          return variables[tok.value];
        }
        throw new Error(`Unknown variable "${tok.value}"`);
      }
      if (tok.type === 'LPAREN') {
        consume();
        const val = parseAddSub();
        if (consume()?.type !== 'RPAREN') throw new Error('Missing closing parenthesis');
        return val;
      }
      if (tok.type === 'OP' && tok.value === '-') {
        consume();
        return -parsePrimary();
      }
      throw new Error('Syntax error near token');
    };

    const parsePower = (): number => {
      let base = parsePrimary();
      while (peek()?.type === 'OP' && (peek() as { type: 'OP'; value: string }).value === '^') {
        consume();
        const exp = parsePower();
        base = Math.pow(base, exp);
      }
      return base;
    };

    const parseMulDiv = (): number => {
      let left = parsePower();
      while (
        peek()?.type === 'OP' &&
        ['*', '/'].includes((peek() as { type: 'OP'; value: string }).value)
      ) {
        const op = (consume() as { type: 'OP'; value: string }).value;
        const right = parsePower();
        if (op === '/' && right === 0) throw new Error('Division by zero');
        left = op === '*' ? left * right : left / right;
      }
      return left;
    };

    const parseAddSub = (): number => {
      let left = parseMulDiv();
      while (
        peek()?.type === 'OP' &&
        ['+', '-'].includes((peek() as { type: 'OP'; value: string }).value)
      ) {
        const op = (consume() as { type: 'OP'; value: string }).value;
        const right = parseMulDiv();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };

    const result = parseAddSub();
    if (pos < tokens.length) throw new Error('Trailing unexpected tokens');
    if (!Number.isFinite(result)) return { ok: false, error: 'Non-finite calculation' };
    return { ok: true, value: Number(result.toFixed(6)) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid formula' };
  }
}

// ============================================================================
// DETERMINISTIC PRNG & STRING FUZZY HELPERS
// ============================================================================

function seededRandom(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deterministicShuffle<T>(items: T[], seedStr: string): T[] {
  const arr = [...items];
  const rnd = seededRandom(seedStr);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// ============================================================================
// CANDIDATE VIEW SANITIZATION (NO ANSWER KEYS EXPOSED TO CANDIDATE)
// ============================================================================

export function toCandidateSnapshot(
  q: QuestionItem,
  seed: string
): CandidateQuestionSnapshot {
  const snapshot: CandidateQuestionSnapshot = {
    snapshotId: `snap-${q.id}-v${q.version}`,
    questionId: q.id,
    code: q.code,
    version: q.version,
    kind: q.kind,
    catalogueTypeId: q.catalogueTypeId,
    autoMarkable: q.autoMarkable,
    marks: q.marks,
    prompt: q.prompt,
  };

  if (q.passageSegments) snapshot.passageSegments = [...q.passageSegments];
  if (q.options) {
    snapshot.options =
      q.kind === 'TRUE_FALSE_UNCERTAIN'
        ? [...q.options]
        : deterministicShuffle(q.options, `${seed}-${q.id}-opts`);
  }
  if (q.clozeChoices) snapshot.clozeChoices = q.clozeChoices.map((c) => [...c]);
  if (q.matchingPairs) {
    snapshot.matchingLefts = q.matchingPairs.map((p) => p.left);
    snapshot.matchingRightsShuffled = deterministicShuffle(
      q.matchingPairs.map((p) => p.right),
      `${seed}-${q.id}-match`
    );
  }
  if (q.orderingSequence) {
    snapshot.orderingItemsShuffled = deterministicShuffle(
      q.orderingSequence,
      `${seed}-${q.id}-order`
    );
  }
  if (q.formulaVariables) snapshot.formulaVariables = { ...q.formulaVariables };
  if (q.starterCode) snapshot.starterCode = q.starterCode;
  if (q.checklistSteps) snapshot.checklistSteps = [...q.checklistSteps];
  if (q.rubricCriteria) {
    snapshot.rubricCriteria = q.rubricCriteria.map((r) => ({ ...r }));
  }

  return snapshot;
}

// ============================================================================
// INITIAL SEED DATASET
// Includes File Management & I/O Management sample drafts + Approved CSC/TVET/KNEC banks
// ============================================================================

function buildSeedState(): ExamEngineState {
  const questions: QuestionItem[] = [
    // Approved Core CSC 301 & System Architecture Question Bank (usable for published CBT & Random Pools)
    {
      id: 'q-csc-01',
      code: 'CSC301-Q01',
      version: 1,
      unitCode: 'CSC 301',
      topic: 'Linear Data Structures',
      difficulty: 'EASY',
      catalogueTypeId: 1,
      kind: 'MCQ_SINGLE',
      autoMarkable: true,
      marks: 10,
      prompt: 'Which data structure strictly enforces a Last-In, First-Out (LIFO) discipline for insertion and removal?',
      options: ['Circular Queue', 'Call Stack', 'Red-Black Tree', 'Adjacency List'],
      correctOptions: ['Call Stack'],
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      reviewNote: 'Verified against CSC 301 syllabus outcomes.',
      createdAt: '2026-02-10T09:00:00Z',
      approvedAt: '2026-02-11T14:20:00Z',
    },
    {
      id: 'q-csc-02',
      code: 'CSC301-Q02',
      version: 1,
      unitCode: 'CSC 301',
      topic: 'Algorithmic Complexity',
      difficulty: 'MEDIUM',
      catalogueTypeId: 2,
      kind: 'MCQ_MULTI',
      autoMarkable: true,
      marks: 15,
      prompt: 'Select ALL sorting algorithms whose worst-case OR guaranteed average time complexity is O(n log n):',
      options: ['Merge Sort', 'Heap Sort', 'Bubble Sort', 'Timsort'],
      correctOptions: ['Merge Sort', 'Heap Sort', 'Timsort'],
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-10T09:15:00Z',
      approvedAt: '2026-02-11T14:22:00Z',
    },
    {
      id: 'q-csc-03',
      code: 'CSC301-Q03',
      version: 1,
      unitCode: 'CSC 301',
      topic: 'Institutional Architecture & Prefixing',
      difficulty: 'EASY',
      catalogueTypeId: 5,
      kind: 'FILL_BLANK_FUZZY',
      autoMarkable: true,
      marks: 10,
      prompt: 'In the atomic registration sequence HCA/STAFF/2026/001, the prefix HCA identifies which accredited college?',
      correctText: 'HI-TECH College',
      acceptedSynonyms: ['HI TECH College', 'Hitech College', 'HI-TECH College Africa'],
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-10T09:30:00Z',
      approvedAt: '2026-02-11T14:25:00Z',
    },
    {
      id: 'q-csc-04',
      code: 'CSC301-Q04',
      version: 1,
      unitCode: 'CSC 301',
      topic: 'Traversal Sequences',
      difficulty: 'MEDIUM',
      catalogueTypeId: 8,
      kind: 'ORDERING',
      autoMarkable: true,
      marks: 15,
      prompt: 'Order the four standard stages of Dijkstra shortest-path initialization and relaxation from first to last:',
      orderingSequence: [
        'Initialize source distance to 0 and all others to infinity',
        'Extract unvisited vertex u with minimum tentative distance',
        'Relax outgoing edges (u, v) updating distance[v] if shorter',
        'Mark vertex u as settled and repeat until priority queue is empty',
      ],
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-10T10:00:00Z',
      approvedAt: '2026-02-11T14:30:00Z',
    },
    {
      id: 'q-csc-05',
      code: 'CSC301-Q05',
      version: 1,
      unitCode: 'CSC 301',
      topic: 'Recurrence & Asymptotic Analysis',
      difficulty: 'HARD',
      catalogueTypeId: 39,
      kind: 'FORMULA_SAFE',
      autoMarkable: true,
      marks: 15,
      prompt: 'Enter a valid arithmetic expression representing the maximum number of nodes in a binary tree of height h (where root height = 0, tested with h = 4 -> 31):',
      formulaVariables: { h: 4 },
      formulaTargetExpression: '2^(h + 1) - 1',
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-10T10:20:00Z',
      approvedAt: '2026-02-11T14:35:00Z',
    },
    {
      id: 'q-csc-06',
      code: 'CSC301-Q06',
      version: 1,
      unitCode: 'CSC 301',
      topic: 'Programming Lab',
      difficulty: 'MEDIUM',
      catalogueTypeId: 21,
      kind: 'CODE_SANDBOX',
      autoMarkable: true,
      marks: 15,
      prompt: 'Complete the Python function is_prime(n) so it accurately returns True for prime integers and False otherwise.',
      starterCode:
        'def is_prime(n):\n    if n <= 1:\n        return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0:\n            return False\n    # Finish return statement\n',
      expectedCodePattern: 'return True',
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-10T10:40:00Z',
      approvedAt: '2026-02-11T14:40:00Z',
    },
    {
      id: 'q-csc-07',
      code: 'CSC301-Q07',
      version: 1,
      unitCode: 'CSC 301',
      topic: 'Engineering Architecture Critique',
      difficulty: 'HARD',
      catalogueTypeId: 48,
      kind: 'ESSAY_RUBRIC',
      autoMarkable: false,
      marks: 20,
      prompt:
        'Compare B-Tree indexing vs Hash indexing for an academic transcript verification lookup table serving 250,000+ records under range queries and point lookups.',
      rubricCriteria: [
        {
          id: 'crit-1',
          label: 'Complexity Comparison',
          description: 'Accurately contrasts O(log n) tree traversal against O(1) amortized hash lookup.',
          maxMarks: 8,
        },
        {
          id: 'crit-2',
          label: 'Range Query & Disk I/O Justification',
          description: 'Explains why B-Trees minimize disk block reads and support sequential range scans.',
          maxMarks: 7,
        },
        {
          id: 'crit-3',
          label: 'Institutional Recommendation',
          description: 'Recommends composite index strategy for verification codes vs semester sorting.',
          maxMarks: 5,
        },
      ],
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-10T11:00:00Z',
      approvedAt: '2026-02-11T14:45:00Z',
    },

    // Random Pool Approved Questions for Operating Systems & File/IO (KNEC / TVET)
    {
      id: 'q-os-01',
      code: 'FMIO-POOL-01',
      version: 1,
      unitCode: 'KNEC-2920',
      topic: 'File Allocation Methods',
      difficulty: 'EASY',
      catalogueTypeId: 7,
      kind: 'MATCHING',
      autoMarkable: true,
      marks: 10,
      prompt: 'Match each disk file allocation strategy to its primary operational trade-off:',
      matchingPairs: [
        { left: 'Contiguous Allocation', right: 'Fast sequential read but suffers external fragmentation' },
        { left: 'Linked Allocation', right: 'No external fragmentation but slow random block access' },
        { left: 'Indexed Allocation (i-node)', right: 'Direct random block access with pointer block overhead' },
      ],
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-14T08:00:00Z',
      approvedAt: '2026-02-15T10:00:00Z',
    },
    {
      id: 'q-os-02',
      code: 'FMIO-POOL-02',
      version: 1,
      unitCode: 'KNEC-2920',
      topic: 'I/O Hardware & DMA',
      difficulty: 'MEDIUM',
      catalogueTypeId: 40,
      kind: 'NUMERIC_TOLERANCE',
      autoMarkable: true,
      marks: 10,
      prompt: 'A 7200 RPM magnetic disk completes one full revolution in how many milliseconds (answer to 2 decimal places, +/- 2% tolerance)?',
      numericTarget: 8.33,
      numericTolerance: 2,
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-14T08:15:00Z',
      approvedAt: '2026-02-15T10:15:00Z',
    },
    {
      id: 'q-os-03',
      code: 'FMIO-POOL-03',
      version: 1,
      unitCode: 'KNEC-2920',
      topic: 'File System Mounting & VFS',
      difficulty: 'MEDIUM',
      catalogueTypeId: 6,
      kind: 'DROPDOWN_CLOZE',
      autoMarkable: true,
      marks: 10,
      prompt: 'Select the correct Virtual File System (VFS) layers for the POSIX storage stack:',
      passageSegments: [
        'When a process invokes open(), the kernel resolves pathnames via the ',
        ' before delegating block caching to the ',
        '.',
      ],
      clozeChoices: [
        ['Virtual File System (VFS)', 'DMA Controller', 'Interrupt Vector'],
        ['Buffer Cache', 'BIOS Bootloader', 'ALU Register'],
      ],
      clozeAnswers: ['Virtual File System (VFS)', 'Buffer Cache'],
      status: 'APPROVED',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      reviewerId: 'staff-hod-02',
      reviewerName: 'Prof. Mary Wangui',
      createdAt: '2026-02-14T08:30:00Z',
      approvedAt: '2026-02-15T10:30:00Z',
    },

    // Sample Converted Content from "File Management and I/O Management — Notes and Assignment"
    // Loaded strictly as DRAFT / IN_REVIEW awaiting independent HOD/Moderator review per LMS-ASSESSMENT-ENGINE.md
    {
      id: 'q-fmio-quiz-1',
      code: 'FMIO-SCQ-01',
      version: 1,
      unitCode: 'OS-FMIO',
      topic: 'File Attributes & Access Control',
      difficulty: 'EASY',
      catalogueTypeId: 3,
      kind: 'TRUE_FALSE_UNCERTAIN',
      autoMarkable: true,
      marks: 6,
      prompt: '[Sample Self-Check Quiz] Direct (random) access allows a programme to read logical block n without reading preceding blocks 0..n-1.',
      options: ['True', 'False', 'Cannot Determine'],
      correctOptions: ['True'],
      status: 'DRAFT',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      createdAt: '2026-02-28T11:00:00Z',
    },
    {
      id: 'q-fmio-part-c10a',
      code: 'C10a',
      version: 1,
      unitCode: 'OS-FMIO',
      topic: 'I/O Management — Practical Checklist (Part C)',
      difficulty: 'MEDIUM',
      catalogueTypeId: 59,
      kind: 'PRACTICAL_CHECKLIST',
      autoMarkable: false,
      marks: 10,
      prompt:
        '[100-Mark Assignment · Unambiguous Label C10a] Execute DMA vs Interrupt-Driven I/O simulation checks in the systems lab (placeholder 1–2 marks per practical checkpoint pending HOD rubric confirmation).',
      checklistSteps: [
        'Verify IRQ vector table entry binds disk controller interrupt handler',
        'Configure DMA descriptor ring buffer without CPU polling',
        'Capture latency delta between PIO and DMA 64KB block transfer',
        'Verify clean interrupt acknowledgement on completion signal',
      ],
      rubricCriteria: [
        {
          id: 'c10a-r1',
          label: 'Lab Execution & Telemetry Capture',
          description: 'All 4 I/O steps verified cleanly without bus contention.',
          maxMarks: 10,
        },
      ],
      status: 'DRAFT',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      createdAt: '2026-02-28T11:10:00Z',
    },
    {
      id: 'q-fmio-part-d12',
      code: 'D12',
      version: 1,
      unitCode: 'OS-FMIO',
      topic: 'Disk Scheduling & RAID Case Study (Part D)',
      difficulty: 'HARD',
      catalogueTypeId: 49,
      kind: 'SHORT_ANSWER',
      autoMarkable: false,
      marks: 20,
      prompt:
        '[100-Mark Assignment · Unambiguous Label D12] Calculate total head movement cylinders using SCAN (Elevator) vs C-SCAN for request queue [98, 183, 37, 122, 14, 124, 65, 67] starting at cylinder 53 moving toward 0, and justify starvation prevention.',
      correctText: 'SCAN',
      acceptedSynonyms: ['236', '382', 'starvation', 'elevator'],
      rubricCriteria: [
        {
          id: 'd12-r1',
          label: 'SCAN Cylinder Arithmetic',
          description: 'Correct sweep 53 -> 37 -> 14 -> 0 -> 65 -> 183 (236 cylinders).',
          maxMarks: 10,
        },
        {
          id: 'd12-r2',
          label: 'C-SCAN Comparison & Starvation Critique',
          description: 'Explains uniform wait-time variance under heavy inner-track load.',
          maxMarks: 10,
        },
      ],
      status: 'IN_REVIEW',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      createdAt: '2026-02-28T11:20:00Z',
    },
    {
      id: 'q-fmio-hotspot',
      code: 'FMIO-HOT-01',
      version: 1,
      unitCode: 'OS-FMIO',
      topic: 'I/O Subsystem Architecture',
      difficulty: 'MEDIUM',
      catalogueTypeId: 11,
      kind: 'HOTSPOT_GRID',
      autoMarkable: true,
      marks: 10,
      prompt: 'Pinpoint the Direct Memory Access (DMA) Controller zone on the Kernel-to-Device Hardware Bus Diagram (Row 2, Col 3 = DMA Bridge):',
      hotspotTarget: { row: 2, col: 3, label: 'DMA Bus Master Controller' },
      status: 'DRAFT',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      createdAt: '2026-02-28T11:30:00Z',
    },
  ];

  const assessments: AssessmentDefinition[] = [
    {
      id: 'asm-csc301-cbt',
      code: 'ASM-CSC301-FINAL',
      title: 'CSC 301 Data Structures & Algorithms Proctored CBT Exam',
      unitCode: 'CSC 301',
      assessmentKind: 'EXAMINATION',
      examBody: 'HI-TECH INTERNAL',
      totalMarks: 100,
      passMarkPercent: 50,
      durationMinutes: 45,
      closingTimeIso: '2026-12-30T17:00:00Z',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      publisherId: 'staff-hod-02',
      publisherName: 'Prof. Mary Wangui',
      publishedAt: '2026-02-20T09:00:00Z',
      status: 'PUBLISHED',
      fixedQuestionIds: ['q-csc-01', 'q-csc-02', 'q-csc-03', 'q-csc-04', 'q-csc-05', 'q-csc-06', 'q-csc-07'],
      randomPools: [],
      sourceNote: 'Combines objective, safe formula evaluation, Python coding sandbox, and rubric-graded architectural essay.',
    },
    {
      id: 'asm-knec-pool',
      code: 'ASM-KNEC-2920-CAT1',
      title: 'KNEC 2920 Operating Systems Random-Pool CAT 1',
      unitCode: 'KNEC-2920',
      assessmentKind: 'CAT',
      examBody: 'KNEC',
      totalMarks: 20,
      passMarkPercent: 40,
      durationMinutes: 20,
      closingTimeIso: '2026-12-20T17:00:00Z',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      publisherId: 'staff-exam-03',
      publisherName: 'Dr. Kiprop Chemweno',
      publishedAt: '2026-02-22T12:00:00Z',
      status: 'PUBLISHED',
      fixedQuestionIds: [],
      randomPools: [
        {
          id: 'pool-os-1',
          label: 'Operating Systems File & I/O Core Pool',
          unitCode: 'KNEC-2920',
          count: 2,
          marksPerQuestion: 10,
        },
      ],
      sourceNote: 'Draws 2 seeded random approved questions per student attempt from 3 approved pool items.',
    },
    {
      id: 'asm-fmio-draft',
      code: 'ASM-OS-FMIO-100',
      title: 'File Management & I/O Management — 100-Mark Assignment & Quiz Pack',
      unitCode: 'OS-FMIO',
      assessmentKind: 'ASSIGNMENT',
      examBody: 'TVET CDACC',
      totalMarks: 46,
      passMarkPercent: 50,
      durationMinutes: 60,
      closingTimeIso: '2026-12-15T18:00:00Z',
      authorId: 'staff-lect-01',
      authorName: 'Dr. Peter Otieno',
      status: 'DRAFT',
      fixedQuestionIds: ['q-fmio-quiz-1', 'q-fmio-part-c10a', 'q-fmio-part-d12', 'q-fmio-hotspot'],
      randomPools: [],
      isSampleConverted: true,
      sourceNote:
        'Converted from File Management & I/O Management Notes/Assignment with unambiguous sub-labels (C10a, D12). Held in DRAFT until every question passes independent review.',
    },
  ];

  // Pre-seed two realistic attempts:
  // 1. Amina's attempt with auto-marked objective items + Essay awaiting anonymous rubric marking (passFailOutcome = null)
  // 2. Brian's fully marked & released attempt (powers Item Analysis alongside Amina's)
  const seedAttempt1Snapshots = ['q-csc-01', 'q-csc-02', 'q-csc-03', 'q-csc-07']
    .map((qid) => questions.find((q) => q.id === qid)!)
    .map((q) => toCandidateSnapshot(q, 'seed-attempt-1'));

  const attempts: ExamAttempt[] = [
    {
      id: 'att-anon-4091',
      assessmentId: 'asm-csc301-cbt',
      assessmentTitle: 'CSC 301 Data Structures & Algorithms Proctored CBT Exam',
      unitCode: 'CSC 301',
      anonymousScriptId: 'ANON-2026-4091',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Amina Wanjiku',
      extraTimePercent: 0,
      startedAtIso: '2026-02-24T09:05:00Z',
      effectiveDeadlineIso: '2026-02-24T09:50:00Z',
      submittedAtIso: '2026-02-24T09:42:10Z',
      ignoredLateSaveCount: 0,
      frozenQuestions: seedAttempt1Snapshots,
      responses: {
        'q-csc-01': 'Call Stack',
        'q-csc-02': ['Merge Sort', 'Heap Sort', 'Timsort'],
        'q-csc-03': 'HI-TECH College',
        'q-csc-07':
          'B-Tree indexes keep sorted disk pages enabling efficient O(log n) traversal and range scans across verification batches, whereas hash tables only accelerate exact point equality keys.',
      },
      questionMarks: [
        { questionId: 'q-csc-01', code: 'CSC301-Q01', maxMarks: 10, awardedMarks: 10, autoMarked: true },
        { questionId: 'q-csc-02', code: 'CSC301-Q02', maxMarks: 15, awardedMarks: 15, autoMarked: true },
        { questionId: 'q-csc-03', code: 'CSC301-Q03', maxMarks: 10, awardedMarks: 10, autoMarked: true },
        {
          questionId: 'q-csc-07',
          code: 'CSC301-Q07',
          maxMarks: 20,
          awardedMarks: null,
          autoMarked: false,
          provisionalKeywordHint: 'Matched technical keywords: B-Tree, O(log n), range scans (provisional suggestion only)',
        },
      ],
      totalAwarded: 35,
      maxPossibleMarks: 55,
      hasUnmarkedItems: true,
      passFailOutcome: null, // Strictly blank while CSC301-Q07 is unmarked
      moderationStatus: 'AUTO_PENDING_HUMAN',
    },
    {
      id: 'att-anon-4088',
      assessmentId: 'asm-csc301-cbt',
      assessmentTitle: 'CSC 301 Data Structures & Algorithms Proctored CBT Exam',
      unitCode: 'CSC 301',
      anonymousScriptId: 'ANON-2026-4088',
      studentRegNo: 'HCA/STU/2026/002',
      studentName: 'Brian Kipruto',
      extraTimePercent: 25,
      startedAtIso: '2026-02-24T09:05:00Z',
      effectiveDeadlineIso: '2026-02-24T10:01:15Z',
      submittedAtIso: '2026-02-24T09:51:00Z',
      ignoredLateSaveCount: 0,
      frozenQuestions: seedAttempt1Snapshots,
      responses: {
        'q-csc-01': 'Call Stack',
        'q-csc-02': ['Merge Sort', 'Bubble Sort'],
        'q-csc-03': 'Hitech College',
        'q-csc-07': 'B-Trees are balanced multi-way search trees ideal for secondary storage indexing.',
      },
      questionMarks: [
        { questionId: 'q-csc-01', code: 'CSC301-Q01', maxMarks: 10, awardedMarks: 10, autoMarked: true },
        { questionId: 'q-csc-02', code: 'CSC301-Q02', maxMarks: 15, awardedMarks: 5, autoMarked: true },
        { questionId: 'q-csc-03', code: 'CSC301-Q03', maxMarks: 10, awardedMarks: 10, autoMarked: true },
        {
          questionId: 'q-csc-07',
          code: 'CSC301-Q07',
          maxMarks: 20,
          awardedMarks: 14,
          autoMarked: false,
          rubricScores: { 'crit-1': 6, 'crit-2': 5, 'crit-3': 3 },
          markerNote: 'Solid block-size rationale; expand on hash collision overflow chains.',
        },
      ],
      totalAwarded: 39,
      maxPossibleMarks: 55,
      hasUnmarkedItems: false,
      passFailOutcome: 'PASS',
      moderationStatus: 'RELEASED',
      moderatedBy: 'Prof. Mary Wangui',
      releasedBy: 'Dr. Kiprop Chemweno',
      releasedAtIso: '2026-02-26T15:00:00Z',
    },
  ];

  const seatingAllocations: ExamSeatAllocation[] = [
    {
      id: 'seat-001',
      examId: 'exam-01',
      unitCode: 'CSC 301',
      examDate: '2026-03-24',
      timeWindow: '09:00 AM - 12:00 PM',
      venue: 'Examination Centre Room A-1',
      seatNumber: 'A1-R01-S01',
      studentRegNo: 'HCA/STU/2026/001',
      studentName: 'Amina Wanjiku',
      attendancePercent: 96,
      feeClearedPercent: 100,
      permitStatus: 'CLEARED',
      checkedIn: true,
    },
    {
      id: 'seat-002',
      examId: 'exam-01',
      unitCode: 'CSC 301',
      examDate: '2026-03-24',
      timeWindow: '09:00 AM - 12:00 PM',
      venue: 'Examination Centre Room A-1',
      seatNumber: 'A1-R01-S02',
      studentRegNo: 'HCA/STU/2026/002',
      studentName: 'Brian Kipruto',
      attendancePercent: 88,
      feeClearedPercent: 100,
      permitStatus: 'CLEARED',
      checkedIn: false,
    },
    {
      id: 'seat-003',
      examId: 'exam-01',
      unitCode: 'CSC 301',
      examDate: '2026-03-24',
      timeWindow: '09:00 AM - 12:00 PM',
      venue: 'Examination Centre Room A-1',
      seatNumber: 'A1-R01-S03',
      studentRegNo: 'HCA/STU/2026/014',
      studentName: 'Dennis Mutiso',
      attendancePercent: 82,
      feeClearedPercent: 68,
      permitStatus: 'BLOCKED_FEE',
      checkedIn: false,
    },
    {
      id: 'seat-004',
      examId: 'exam-02',
      unitCode: 'TVET-ICT-M2',
      examDate: '2026-04-02',
      timeWindow: '02:00 PM - 05:00 PM',
      venue: 'Main Assembly Hall',
      seatNumber: 'MAH-C04-S12',
      studentRegNo: 'HCA/STU/2026/019',
      studentName: 'Grace Chebet',
      attendancePercent: 64,
      feeClearedPercent: 100,
      permitStatus: 'BLOCKED_ATTENDANCE',
      checkedIn: false,
    },
  ];

  const incidents: ExamIncidentRecord[] = [
    {
      id: 'inc-2026-01',
      examId: 'exam-01',
      unitCode: 'CSC 301',
      venue: 'Examination Centre Room A-1',
      studentRegNo: 'HCA/STU/2026/009',
      category: 'DEVICE_FAILURE',
      severity: 'MEDIUM',
      summary: 'Workstation #14 lost LAN link for 4 minutes; candidate shifted to hot-standby station #19 with +5m time restoration logged.',
      recordedBy: 'Dr. Kiprop Chemweno',
      recordedAtIso: '2026-02-24T09:18:00Z',
      resolutionStatus: 'RESOLVED',
      resolutionNote: 'Server snapshot preserved all prior autosaves; verified by chief invigilator.',
    },
  ];

  const supplementaryDecisions: SupplementaryDecision[] = [
    {
      id: 'sup-2026-01',
      studentRegNo: 'HCA/STU/2025/142',
      studentName: 'Kevin Mwangi',
      unitCode: 'NET 303',
      originalScore: 36,
      decisionType: 'SUPPLEMENTARY',
      reason: 'Scored 36% (threshold 40%); eligible for May 2026 supplementary sitting upon fee clearance.',
      proposedById: 'staff-lect-01',
      proposedByName: 'Dr. Peter Otieno',
      status: 'PENDING_BOARD',
      scheduledDate: '2026-05-14',
    },
  ];

  return {
    questions,
    assessments,
    attempts,
    seatingAllocations,
    incidents,
    supplementaryDecisions,
    auditLog: [
      {
        id: 'aud-01',
        timestampIso: '2026-02-28T11:30:00Z',
        actor: 'System Importer',
        action: 'IMPORT_SAMPLE_DRAFTS',
        detail: 'Loaded File Management & I/O Management quiz/assignment questions (C10a, D12) as DRAFT for lecturer/HOD review.',
      },
    ],
  };
}

class ExamAssessmentService {
  private state: ExamEngineState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): ExamEngineState {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as ExamEngineState;
      } catch {
        // Fallback to clean seed
      }
    }
    return buildSeedState();
  }

  private saveState(): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Ignore storage quota restrictions
      }
    }
  }

  private appendAudit(actor: string, action: string, detail: string): void {
    this.state.auditLog.unshift({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      timestampIso: new Date().toISOString(),
      actor,
      action,
      detail,
    });
    if (this.state.auditLog.length > 60) {
      this.state.auditLog = this.state.auditLog.slice(0, 60);
    }
  }

  getState(): ExamEngineState {
    return this.state;
  }

  resetDemoState(): ExamEngineState {
    this.state = buildSeedState();
    this.saveState();
    return this.state;
  }

  // ============================================================================
  // 1. QUESTION BANK LIFECYCLE (DRAFT -> IN_REVIEW -> APPROVED + VERSIONING)
  // ============================================================================

  createDraftQuestion(
    input: {
      code: string;
      unitCode: string;
      topic: string;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      catalogueTypeId: number;
      kind: QuestionItem['kind'];
      marks: number;
      prompt: string;
      options?: string[];
      correctOptions?: string[];
      correctText?: string;
      formulaVariables?: Record<string, number>;
      formulaTargetExpression?: string;
      numericTarget?: number;
      numericTolerance?: number;
    },
    actor: ExamRolePersona
  ): { ok: true; question: QuestionItem } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Candidates cannot author question bank items.' };
    }
    if (!input.code.trim() || !input.prompt.trim() || input.marks <= 0) {
      return { ok: false, error: 'Code, prompt, and positive marks are required.' };
    }
    const person = ROLE_ACTORS[actor];
    const autoMarkable = !['ESSAY_RUBRIC', 'SHORT_ANSWER', 'PRACTICAL_CHECKLIST', 'FILE_UPLOAD'].includes(
      input.kind
    );
    const created: QuestionItem = {
      id: `q-${Date.now()}`,
      code: input.code.trim().toUpperCase(),
      version: 1,
      unitCode: input.unitCode.trim() || 'CSC 301',
      topic: input.topic.trim() || 'General',
      difficulty: input.difficulty,
      catalogueTypeId: input.catalogueTypeId,
      kind: input.kind,
      autoMarkable,
      marks: input.marks,
      prompt: input.prompt.trim(),
      options: input.options,
      correctOptions: input.correctOptions,
      correctText: input.correctText,
      formulaVariables: input.formulaVariables,
      formulaTargetExpression: input.formulaTargetExpression,
      numericTarget: input.numericTarget,
      numericTolerance: input.numericTolerance,
      rubricCriteria: !autoMarkable
        ? [
            {
              id: `crit-${Date.now()}`,
              label: 'Technical Accuracy & Justification',
              description: 'Meets programme rubric standard.',
              maxMarks: input.marks,
            },
          ]
        : undefined,
      status: 'DRAFT',
      authorId: person.id,
      authorName: person.name,
      createdAt: new Date().toISOString(),
    };
    this.state.questions.unshift(created);
    this.appendAudit(person.name, 'CREATE_QUESTION_DRAFT', `Created ${created.code} v1 (${created.kind})`);
    this.saveState();
    return { ok: true, question: created };
  }

  submitQuestionForReview(
    questionId: string,
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    const q = this.state.questions.find((item) => item.id === questionId);
    if (!q) return { ok: false, error: 'Question not found.' };
    if (q.status !== 'DRAFT') return { ok: false, error: 'Only DRAFT questions can be submitted for review.' };
    q.status = 'IN_REVIEW';
    this.appendAudit(ROLE_ACTORS[actor].name, 'SUBMIT_QUESTION_REVIEW', `Submitted ${q.code} v${q.version} for review`);
    this.saveState();
    return { ok: true };
  }

  reviewQuestion(
    questionId: string,
    decision: 'APPROVE' | 'RETURN_DRAFT',
    note: string,
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Candidates cannot review questions.' };
    }
    const q = this.state.questions.find((item) => item.id === questionId);
    if (!q) return { ok: false, error: 'Question not found.' };
    if (q.status !== 'IN_REVIEW' && q.status !== 'DRAFT') {
      return { ok: false, error: 'Approved or archived questions cannot be re-reviewed directly; create a new version.' };
    }
    const reviewer = ROLE_ACTORS[actor];
    if (decision === 'APPROVE' && reviewer.id === q.authorId) {
      return {
        ok: false,
        error: `Separation of duties enforced: Author (${q.authorName}) cannot self-approve ${q.code}. Switch role to HOD / Moderator or Exam Officer.`,
      };
    }

    if (decision === 'APPROVE') {
      q.status = 'APPROVED';
      q.reviewerId = reviewer.id;
      q.reviewerName = reviewer.name;
      q.reviewNote = note.trim() || 'Moderated and approved for assessment pool.';
      q.approvedAt = new Date().toISOString();
      this.appendAudit(reviewer.name, 'APPROVE_QUESTION', `Approved ${q.code} v${q.version}`);
    } else {
      q.status = 'DRAFT';
      q.reviewerId = reviewer.id;
      q.reviewerName = reviewer.name;
      q.reviewNote = note.trim() || 'Returned to author for revision.';
      this.appendAudit(reviewer.name, 'RETURN_QUESTION_DRAFT', `Returned ${q.code} v${q.version} to DRAFT`);
    }
    this.saveState();
    return { ok: true };
  }

  createNewQuestionVersion(
    approvedQuestionId: string,
    updatedPrompt: string,
    updatedMarks: number,
    actor: ExamRolePersona
  ): { ok: true; newQuestion: QuestionItem } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Unauthorized action.' };
    }
    const orig = this.state.questions.find((q) => q.id === approvedQuestionId);
    if (!orig) return { ok: false, error: 'Source question not found.' };
    const person = ROLE_ACTORS[actor];
    const nextVersion =
      Math.max(
        ...this.state.questions
          .filter((q) => q.code === orig.code)
          .map((q) => q.version)
      ) + 1;

    const cloned: QuestionItem = {
      ...orig,
      id: `q-${Date.now()}`,
      version: nextVersion,
      parentQuestionId: orig.id,
      prompt: updatedPrompt.trim() || orig.prompt,
      marks: updatedMarks > 0 ? updatedMarks : orig.marks,
      status: 'DRAFT',
      authorId: person.id,
      authorName: person.name,
      reviewerId: undefined,
      reviewerName: undefined,
      reviewNote: `New version v${nextVersion} branched from immutable v${orig.version}.`,
      createdAt: new Date().toISOString(),
      approvedAt: undefined,
    };

    this.state.questions.unshift(cloned);
    this.appendAudit(
      person.name,
      'VERSION_QUESTION',
      `Created immutable branch ${cloned.code} v${cloned.version} from v${orig.version}`
    );
    this.saveState();
    return { ok: true, newQuestion: cloned };
  }

  // ============================================================================
  // 2. ASSESSMENT BUILDER & SEPARATION-OF-DUTIES PUBLISHING
  // ============================================================================

  createAssessmentDraft(
    input: {
      code: string;
      title: string;
      unitCode: string;
      assessmentKind: AssessmentDefinition['assessmentKind'];
      examBody: AssessmentDefinition['examBody'];
      durationMinutes: number;
      passMarkPercent: number;
      fixedQuestionIds: string[];
      randomPoolUnit?: string;
      randomPoolCount?: number;
    },
    actor: ExamRolePersona
  ): { ok: true; assessment: AssessmentDefinition } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Candidates cannot create assessments.' };
    }
    if (!input.title.trim() || !input.code.trim()) {
      return { ok: false, error: 'Assessment code and title are required.' };
    }
    const fixedMarks = input.fixedQuestionIds.reduce((sum, qid) => {
      const q = this.state.questions.find((item) => item.id === qid);
      return sum + (q?.marks ?? 0);
    }, 0);

    const randomCount = input.randomPoolCount && input.randomPoolCount > 0 ? input.randomPoolCount : 0;
    const randomPools =
      randomCount > 0 && input.randomPoolUnit
        ? [
            {
              id: `pool-${Date.now()}`,
              label: `${input.randomPoolUnit} Approved Pool`,
              unitCode: input.randomPoolUnit,
              count: randomCount,
              marksPerQuestion: 10,
            },
          ]
        : [];
    const totalMarks = fixedMarks + randomCount * 10;

    if (input.fixedQuestionIds.length === 0 && randomPools.length === 0) {
      return { ok: false, error: 'Select at least one fixed question or a random pool rule.' };
    }

    const author = ROLE_ACTORS[actor];
    const asm: AssessmentDefinition = {
      id: `asm-${Date.now()}`,
      code: input.code.trim().toUpperCase(),
      title: input.title.trim(),
      unitCode: input.unitCode.trim() || 'CSC 301',
      assessmentKind: input.assessmentKind,
      examBody: input.examBody,
      totalMarks,
      passMarkPercent: input.passMarkPercent || 50,
      durationMinutes: Math.max(5, input.durationMinutes || 30),
      closingTimeIso: '2026-12-31T20:00:00Z',
      authorId: author.id,
      authorName: author.name,
      status: 'DRAFT',
      fixedQuestionIds: input.fixedQuestionIds,
      randomPools,
    };

    this.state.assessments.unshift(asm);
    this.appendAudit(author.name, 'CREATE_ASSESSMENT', `Created ${asm.code} (${asm.totalMarks} marks) as DRAFT`);
    this.saveState();
    return { ok: true, assessment: asm };
  }

  publishAssessment(
    assessmentId: string,
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Unauthorized action.' };
    }
    const asm = this.state.assessments.find((a) => a.id === assessmentId);
    if (!asm) return { ok: false, error: 'Assessment not found.' };
    if (asm.status !== 'DRAFT') return { ok: false, error: 'Only DRAFT assessments can be published.' };

    const publisher = ROLE_ACTORS[actor];
    if (publisher.id === asm.authorId) {
      return {
        ok: false,
        error: `Separation of duties enforced: Author (${asm.authorName}) cannot publish ${asm.code}. Switch to HOD / Moderator or Exam Officer.`,
      };
    }

    // Rule 1: All fixed questions must be APPROVED
    const unapprovedFixed = asm.fixedQuestionIds
      .map((qid) => this.state.questions.find((q) => q.id === qid))
      .filter((q) => !q || q.status !== 'APPROVED');
    if (unapprovedFixed.length > 0) {
      return {
        ok: false,
        error: `Publish blocked: ${unapprovedFixed.length} fixed question(s) (${unapprovedFixed
          .map((q) => q?.code ?? 'missing')
          .join(', ')}) are not yet APPROVED by an independent reviewer.`,
      };
    }

    // Rule 2: All random pools must have enough APPROVED questions
    for (const pool of asm.randomPools) {
      const eligible = this.state.questions.filter(
        (q) =>
          q.status === 'APPROVED' &&
          q.unitCode === pool.unitCode &&
          (!pool.topic || q.topic === pool.topic)
      );
      if (eligible.length < pool.count) {
        return {
          ok: false,
          error: `Publish blocked: Random pool "${pool.label}" requires ${pool.count} APPROVED questions but only ${eligible.length} are approved.`,
        };
      }
    }

    asm.status = 'PUBLISHED';
    asm.publisherId = publisher.id;
    asm.publisherName = publisher.name;
    asm.publishedAt = new Date().toISOString();
    this.appendAudit(publisher.name, 'PUBLISH_ASSESSMENT', `Published ${asm.code} (${asm.totalMarks} marks)`);
    this.saveState();
    return { ok: true };
  }

  // ============================================================================
  // 3. ATTEMPT ENGINE (SNAPSHOT FREEZE, SEEDED ORDER, DEADLINE, GRACE & AUTO-MARK)
  // ============================================================================

  startAttempt(
    assessmentId: string,
    extraTimePercent = 0,
    studentRegNo = ROLE_ACTORS.STUDENT_CANDIDATE.id === 'stu-001' ? 'HCA/STU/2026/001' : 'HCA/STU/2026/001',
    studentName = ROLE_ACTORS.STUDENT_CANDIDATE.name
  ): { ok: true; attempt: ExamAttempt } | { ok: false; error: string } {
    const asm = this.state.assessments.find((a) => a.id === assessmentId);
    if (!asm) return { ok: false, error: 'Assessment not found.' };
    if (asm.status === 'DRAFT') {
      return { ok: false, error: 'Cannot launch a DRAFT assessment. It must first be published by an independent approver.' };
    }

    const nowMs = Date.now();
    const closingMs = new Date(asm.closingTimeIso).getTime();
    if (nowMs > closingMs) {
      return { ok: false, error: 'This assessment closing deadline has passed.' };
    }

    const attemptId = `att-${nowMs}`;
    const seed = `${attemptId}-${studentRegNo}`;

    // Resolve fixed questions + draw seeded random pool questions
    const chosenQuestions: QuestionItem[] = [];
    for (const qid of asm.fixedQuestionIds) {
      const q = this.state.questions.find((item) => item.id === qid);
      if (q) chosenQuestions.push(q);
    }

    for (const pool of asm.randomPools) {
      const candidates = this.state.questions.filter(
        (q) =>
          q.status === 'APPROVED' &&
          q.unitCode === pool.unitCode &&
          (!pool.topic || q.topic === pool.topic) &&
          !chosenQuestions.some((already) => already.id === q.id)
      );
      const picked = deterministicShuffle(candidates, `${seed}-${pool.id}`).slice(0, pool.count);
      chosenQuestions.push(...picked);
    }

    const frozenQuestions = deterministicShuffle(chosenQuestions, `${seed}-qorder`).map((q) =>
      toCandidateSnapshot(q, seed)
    );

    const effectiveMinutes = asm.durationMinutes * (1 + extraTimePercent / 100);
    const limitDeadlineMs = nowMs + effectiveMinutes * 60 * 1000;
    const effectiveDeadlineMs = Math.min(limitDeadlineMs, closingMs);

    const maxPossibleMarks = frozenQuestions.reduce((s, q) => s + q.marks, 0);
    const anonNum = Math.floor(1000 + Math.random() * 8999);

    const attempt: ExamAttempt = {
      id: attemptId,
      assessmentId: asm.id,
      assessmentTitle: asm.title,
      unitCode: asm.unitCode,
      anonymousScriptId: `ANON-2026-${anonNum}`,
      studentRegNo,
      studentName,
      extraTimePercent,
      startedAtIso: new Date(nowMs).toISOString(),
      effectiveDeadlineIso: new Date(effectiveDeadlineMs).toISOString(),
      ignoredLateSaveCount: 0,
      frozenQuestions,
      responses: {},
      questionMarks: [],
      totalAwarded: 0,
      maxPossibleMarks,
      hasUnmarkedItems: false,
      passFailOutcome: null,
      moderationStatus: 'AUTO_PENDING_HUMAN',
    };

    this.state.attempts.unshift(attempt);
    this.appendAudit(studentName, 'START_ATTEMPT', `Started ${asm.code} as ${attempt.anonymousScriptId} (+${extraTimePercent}% extra time)`);
    this.saveState();
    return { ok: true, attempt };
  }

  saveAttemptAnswer(
    attemptId: string,
    questionId: string,
    value: CandidateResponseValue,
    simulatedPastSecondsLate = 0
  ): { ok: true; savedAtIso: string } | { ok: false; ignoredLate: true; error: string } {
    const attempt = this.state.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { ok: false, ignoredLate: true, error: 'Attempt not found.' };
    if (attempt.submittedAtIso) {
      return { ok: false, ignoredLate: true, error: 'Attempt already submitted.' };
    }

    const nowMs = Date.now() + simulatedPastSecondsLate * 1000;
    const deadlineMs = new Date(attempt.effectiveDeadlineIso).getTime();
    const graceCutoffMs = deadlineMs + 30_000; // Strictly 30s grace window

    if (nowMs > graceCutoffMs) {
      attempt.ignoredLateSaveCount += 1;
      this.saveState();
      return {
        ok: false,
        ignoredLate: true,
        error: 'Answer ignored: Server clock exceeded deadline + 30s grace window.',
      };
    }

    attempt.responses[questionId] = value;
    attempt.lastAutosavedAtIso = new Date().toISOString();
    this.saveState();
    return { ok: true, savedAtIso: attempt.lastAutosavedAtIso };
  }

  private markSingleQuestion(q: QuestionItem, resp: CandidateResponseValue | undefined): QuestionMarkRecord {
    if (!q.autoMarkable) {
      let keywordHint: string | undefined;
      if (q.kind === 'SHORT_ANSWER' && typeof resp === 'string' && q.acceptedSynonyms?.length) {
        const lower = resp.toLowerCase();
        const hits = q.acceptedSynonyms.filter((kw) => lower.includes(kw.toLowerCase()));
        keywordHint =
          hits.length > 0
            ? `Provisional keyword match: ${hits.join(', ')} (${Math.round((hits.length / q.acceptedSynonyms.length) * q.marks)}/${q.marks} hint)`
            : 'No configured rubric keywords matched yet';
      }
      return {
        questionId: q.id,
        code: q.code,
        maxMarks: q.marks,
        awardedMarks: null,
        autoMarked: false,
        provisionalKeywordHint: keywordHint,
      };
    }

    let awarded = 0;

    switch (q.kind) {
      case 'MCQ_SINGLE':
      case 'TRUE_FALSE_UNCERTAIN': {
        if (typeof resp === 'string' && q.correctOptions?.includes(resp)) {
          awarded = q.marks;
        }
        break;
      }
      case 'MCQ_MULTI': {
        const selected = Array.isArray(resp)
          ? resp.filter((v): v is string => typeof v === 'string')
          : [];
        const expected = q.correctOptions ?? [];
        if (expected.length > 0) {
          const hits = selected.filter((s) => expected.includes(s)).length;
          const wrong = selected.filter((s) => !expected.includes(s)).length;
          const rawRatio = Math.max(0, (hits - wrong * 0.5) / expected.length);
          awarded = Math.round(rawRatio * q.marks * 10) / 10;
        }
        break;
      }
      case 'FILL_BLANK_EXACT': {
        if (typeof resp === 'string' && q.correctText) {
          if (resp.trim().toLowerCase() === q.correctText.trim().toLowerCase()) {
            awarded = q.marks;
          }
        }
        break;
      }
      case 'FILL_BLANK_FUZZY': {
        if (typeof resp === 'string') {
          const norm = resp.trim().toLowerCase();
          const targets = [q.correctText ?? '', ...(q.acceptedSynonyms ?? [])]
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          const matched = targets.some((t) => t === norm || levenshtein(norm, t) <= 2);
          if (matched) awarded = q.marks;
        }
        break;
      }
      case 'DROPDOWN_CLOZE': {
        const chosen = Array.isArray(resp) ? resp : [];
        const expected = q.clozeAnswers ?? [];
        if (expected.length > 0) {
          let hits = 0;
          expected.forEach((ans, idx) => {
            if (chosen[idx] === ans) hits++;
          });
          awarded = Math.round((hits / expected.length) * q.marks * 10) / 10;
        }
        break;
      }
      case 'MATCHING': {
        const map = (resp && typeof resp === 'object' && !Array.isArray(resp) ? resp : {}) as Record<string, string>;
        const pairs = q.matchingPairs ?? [];
        if (pairs.length > 0) {
          const hits = pairs.filter((p) => map[p.left] === p.right).length;
          awarded = Math.round((hits / pairs.length) * q.marks * 10) / 10;
        }
        break;
      }
      case 'ORDERING': {
        const seq = Array.isArray(resp) ? resp : [];
        const expected = q.orderingSequence ?? [];
        if (expected.length > 0) {
          let exactPos = 0;
          expected.forEach((item, idx) => {
            if (seq[idx] === item) exactPos++;
          });
          awarded = Math.round((exactPos / expected.length) * q.marks * 10) / 10;
        }
        break;
      }
      case 'NUMERIC_TOLERANCE': {
        const num = typeof resp === 'string' ? Number(resp) : NaN;
        if (!Number.isNaN(num) && typeof q.numericTarget === 'number') {
          const tolPct = q.numericTolerance ?? 0;
          const allowedDiff = Math.abs(q.numericTarget) * (tolPct / 100);
          if (Math.abs(num - q.numericTarget) <= Math.max(allowedDiff, 0.0001)) {
            awarded = q.marks;
          }
        }
        break;
      }
      case 'FORMULA_SAFE': {
        if (typeof resp === 'string' && q.formulaTargetExpression) {
          const vars = q.formulaVariables ?? {};
          const expectedEval = evaluateSafeMathExpression(q.formulaTargetExpression, vars);
          const candidateEval = evaluateSafeMathExpression(resp, vars);
          if (
            expectedEval.ok &&
            candidateEval.ok &&
            Math.abs(expectedEval.value - candidateEval.value) < 0.001
          ) {
            awarded = q.marks;
          }
        }
        break;
      }
      case 'HOTSPOT_GRID': {
        if (resp && typeof resp === 'object' && 'row' in resp && q.hotspotTarget) {
          if (resp.row === q.hotspotTarget.row && resp.col === q.hotspotTarget.col) {
            awarded = q.marks;
          }
        }
        break;
      }
      case 'CODE_SANDBOX':
      case 'SQL_SANDBOX': {
        if (typeof resp === 'string' && q.expectedCodePattern) {
          if (resp.toLowerCase().includes(q.expectedCodePattern.toLowerCase())) {
            awarded = q.marks;
          }
        }
        break;
      }
      default:
        break;
    }

    return {
      questionId: q.id,
      code: q.code,
      maxMarks: q.marks,
      awardedMarks: awarded,
      autoMarked: true,
    };
  }

  submitAttempt(attemptId: string): { ok: true; attempt: ExamAttempt } | { ok: false; error: string } {
    const attempt = this.state.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { ok: false, error: 'Attempt not found.' };
    if (attempt.submittedAtIso) return { ok: true, attempt };

    const nowMs = Date.now();
    const deadlineMs = new Date(attempt.effectiveDeadlineIso).getTime();
    if (nowMs > deadlineMs) {
      attempt.graceAppliedSeconds = Math.min(30, Math.round((nowMs - deadlineMs) / 1000));
    }
    attempt.submittedAtIso = new Date(nowMs).toISOString();

    const marks: QuestionMarkRecord[] = attempt.frozenQuestions.map((snap) => {
      const q = this.state.questions.find((item) => item.id === snap.questionId && item.version === snap.version)
        ?? this.state.questions.find((item) => item.id === snap.questionId)!;
      return this.markSingleQuestion(q, attempt.responses[snap.questionId]);
    });

    attempt.questionMarks = marks;
    this.recalculateAttemptTotals(attempt);
    this.appendAudit(attempt.studentName, 'SUBMIT_ATTEMPT', `Submitted ${attempt.anonymousScriptId}`);
    this.saveState();
    return { ok: true, attempt };
  }

  private recalculateAttemptTotals(attempt: ExamAttempt): void {
    const hasUnmarked = attempt.questionMarks.some((m) => m.awardedMarks === null);
    attempt.hasUnmarkedItems = hasUnmarked;
    attempt.totalAwarded = attempt.questionMarks.reduce((s, m) => s + (m.awardedMarks ?? 0), 0);

    const asm = this.state.assessments.find((a) => a.id === attempt.assessmentId);
    const passPct = asm?.passMarkPercent ?? 50;
    const pct = attempt.maxPossibleMarks > 0 ? (attempt.totalAwarded / attempt.maxPossibleMarks) * 100 : 0;

    // Strict LMS Rule: Pass/fail stays blank while anything is unmarked or unreleased
    if (hasUnmarked) {
      attempt.passFailOutcome = null;
      attempt.moderationStatus = 'AUTO_PENDING_HUMAN';
    } else if (attempt.moderationStatus === 'RELEASED') {
      attempt.passFailOutcome = pct >= passPct ? 'PASS' : 'FAIL';
    } else {
      attempt.passFailOutcome = null;
      if (attempt.moderationStatus === 'AUTO_PENDING_HUMAN') {
        attempt.moderationStatus = 'MARKED_AWAITING_MODERATOR';
      }
    }
  }

  // ============================================================================
  // 4. ANONYMOUS MARKING QUEUE, RUBRIC VALIDATION & CONTROLLED RELEASE
  // ============================================================================

  scoreRubricQuestion(
    attemptId: string,
    questionId: string,
    rubricScores: Record<string, number>,
    markerNote: string,
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Candidates cannot mark scripts.' };
    }
    const attempt = this.state.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { ok: false, error: 'Script not found.' };

    const markRow = attempt.questionMarks.find((m) => m.questionId === questionId);
    if (!markRow) return { ok: false, error: 'Question mark entry not found.' };

    const snap = attempt.frozenQuestions.find((f) => f.questionId === questionId);
    const criteria = snap?.rubricCriteria ?? [];

    let totalRubric = 0;
    for (const c of criteria) {
      const val = rubricScores[c.id] ?? 0;
      if (val < 0 || val > c.maxMarks) {
        return {
          ok: false,
          error: `Rubric score for "${c.label}" (${val}) exceeds allowed range 0–${c.maxMarks}.`,
        };
      }
      totalRubric += val;
    }

    if (criteria.length === 0) {
      const directVal = rubricScores['direct'] ?? 0;
      if (directVal < 0 || directVal > markRow.maxMarks) {
        return { ok: false, error: `Score must be between 0 and ${markRow.maxMarks}.` };
      }
      totalRubric = directVal;
    }

    markRow.rubricScores = { ...rubricScores };
    markRow.awardedMarks = Math.min(markRow.maxMarks, totalRubric);
    markRow.markerNote = markerNote.trim();

    this.recalculateAttemptTotals(attempt);
    this.appendAudit(
      ROLE_ACTORS[actor].name,
      'MARK_ANONYMOUS_SCRIPT',
      `Marked ${attempt.anonymousScriptId} · ${markRow.code}: ${markRow.awardedMarks}/${markRow.maxMarks}`
    );
    this.saveState();
    return { ok: true };
  }

  releaseAttemptResults(
    attemptId: string,
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    if (actor !== 'EXAM_OFFICER' && actor !== 'HOD_MODERATOR') {
      return {
        ok: false,
        error: 'Only Examination Officer or HOD / Moderator may authorize controlled result release.',
      };
    }
    const attempt = this.state.attempts.find((a) => a.id === attemptId);
    if (!attempt) return { ok: false, error: 'Attempt not found.' };
    if (attempt.hasUnmarkedItems || attempt.questionMarks.some((m) => m.awardedMarks === null)) {
      return { ok: false, error: 'Release blocked: Cannot release results while any question remains unmarked.' };
    }

    const person = ROLE_ACTORS[actor];
    attempt.moderatedBy = attempt.moderatedBy || person.name;
    attempt.moderationStatus = 'RELEASED';
    attempt.releasedBy = person.name;
    attempt.releasedAtIso = new Date().toISOString();
    this.recalculateAttemptTotals(attempt);

    this.appendAudit(person.name, 'RELEASE_RESULTS', `Released results for ${attempt.anonymousScriptId} (${attempt.passFailOutcome})`);
    this.saveState();
    return { ok: true };
  }

  // ============================================================================
  // 5. ADVISORY ITEM ANALYSIS (NEVER MUTATES MARKS)
  // ============================================================================

  computeItemAnalysis(assessmentId: string): {
    reliabilityEstimate: number | null;
    items: ItemAnalysisStat[];
  } {
    const relevantAttempts = this.state.attempts.filter(
      (a) => a.assessmentId === assessmentId && a.submittedAtIso && !a.hasUnmarkedItems
    );
    if (relevantAttempts.length === 0) {
      return { reliabilityEstimate: null, items: [] };
    }

    // Rank attempts by total score for top/bottom discrimination index
    const sorted = [...relevantAttempts].sort((a, b) => b.totalAwarded - a.totalAwarded);
    const half = Math.max(1, Math.floor(sorted.length / 2));
    const upperGroup = sorted.slice(0, half);
    const lowerGroup = sorted.slice(-half);

    const seenQuestions = new Map<string, { snap: CandidateQuestionSnapshot; scores: number[]; optionCounts: Record<string, number> }>();

    for (const att of relevantAttempts) {
      for (const snap of att.frozenQuestions) {
        const mark = att.questionMarks.find((m) => m.questionId === snap.questionId);
        const score = mark?.awardedMarks ?? 0;
        if (!seenQuestions.has(snap.questionId)) {
          seenQuestions.set(snap.questionId, { snap, scores: [], optionCounts: {} });
        }
        const bucket = seenQuestions.get(snap.questionId)!;
        bucket.scores.push(score);

        const resp = att.responses[snap.questionId];
        if (typeof resp === 'string' && (snap.kind === 'MCQ_SINGLE' || snap.kind === 'TRUE_FALSE_UNCERTAIN')) {
          bucket.optionCounts[resp] = (bucket.optionCounts[resp] || 0) + 1;
        } else if (Array.isArray(resp) && snap.kind === 'MCQ_MULTI') {
          resp
            .filter((v): v is string => typeof v === 'string')
            .forEach((opt) => {
              bucket.optionCounts[opt] = (bucket.optionCounts[opt] || 0) + 1;
            });
        }
      }
    }

    const items: ItemAnalysisStat[] = [];
    for (const [qId, data] of seenQuestions.entries()) {
      const mean = data.scores.reduce((s, v) => s + v, 0) / data.scores.length;
      const diffIdx = data.snap.marks > 0 ? mean / data.snap.marks : 0;

      const avgFor = (group: ExamAttempt[]) => {
        const vals = group
          .map((g) => g.questionMarks.find((m) => m.questionId === qId)?.awardedMarks ?? 0);
        return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      };
      const upperAvg = avgFor(upperGroup);
      const lowerAvg = avgFor(lowerGroup);
      const discIdx = data.snap.marks > 0 ? (upperAvg - lowerAvg) / data.snap.marks : 0;

      items.push({
        questionId: qId,
        code: data.snap.code,
        promptSnippet: data.snap.prompt.slice(0, 72) + (data.snap.prompt.length > 72 ? '...' : ''),
        kind: data.snap.kind,
        attemptsCount: data.scores.length,
        maxMarks: data.snap.marks,
        meanScore: Number(mean.toFixed(2)),
        difficultyIndex: Number(diffIdx.toFixed(2)),
        discriminationIndex: Number(discIdx.toFixed(2)),
        optionCounts: Object.keys(data.optionCounts).length > 0 ? data.optionCounts : undefined,
      });
    }

    // Simplified KR-20 / item variance reliability indicator across graded attempts
    const totalScores = relevantAttempts.map((a) => a.totalAwarded);
    const meanTot = totalScores.reduce((s, v) => s + v, 0) / totalScores.length;
    const varTot = totalScores.reduce((s, v) => s + Math.pow(v - meanTot, 2), 0) / totalScores.length;
    let reliabilityEstimate: number | null = null;
    if (items.length > 1 && varTot > 0) {
      const k = items.length;
      const sumPQ = items.reduce((s, it) => s + it.difficultyIndex * (1 - it.difficultyIndex) * Math.pow(it.maxMarks, 2), 0);
      const rawKr = (k / (k - 1)) * (1 - sumPQ / varTot);
      reliabilityEstimate = Number(Math.max(0, Math.min(0.99, rawKr)).toFixed(2));
    }

    return { reliabilityEstimate, items };
  }

  // ============================================================================
  // 6. SEATING CLASH CHECK, INCIDENTS & SUPPLEMENTARY BOARD WORKFLOW
  // ============================================================================

  assignSeatWithClashCheck(input: {
    unitCode: string;
    examDate: string;
    timeWindow: string;
    venue: string;
    seatNumber: string;
    studentRegNo: string;
    studentName: string;
    attendancePercent: number;
    feeClearedPercent: number;
  }, actor: ExamRolePersona): { ok: true; seat: ExamSeatAllocation } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Only authorized examination staff can allocate exam seats.' };
    }
    const cleanSeat = input.seatNumber.trim().toUpperCase();
    const cleanReg = input.studentRegNo.trim().toUpperCase();

    // Check 1: Same seat double-booked in same venue/date/window
    const seatClash = this.state.seatingAllocations.find(
      (s) =>
        s.venue === input.venue &&
        s.examDate === input.examDate &&
        s.timeWindow === input.timeWindow &&
        s.seatNumber === cleanSeat
    );
    if (seatClash) {
      return {
        ok: false,
        error: `Seat clash detected: ${cleanSeat} in ${input.venue} (${input.examDate} ${input.timeWindow}) is already assigned to ${seatClash.studentRegNo}.`,
      };
    }

    // Check 2: Student double-scheduled in same date/window
    const studentClash = this.state.seatingAllocations.find(
      (s) =>
        s.studentRegNo === cleanReg &&
        s.examDate === input.examDate &&
        s.timeWindow === input.timeWindow
    );
    if (studentClash) {
      return {
        ok: false,
        error: `Timetable clash detected: ${cleanReg} already sits ${studentClash.unitCode} on ${input.examDate} (${input.timeWindow}).`,
      };
    }

    const permitStatus: ExamSeatAllocation['permitStatus'] =
      input.feeClearedPercent < 100
        ? 'BLOCKED_FEE'
        : input.attendancePercent < 75
        ? 'BLOCKED_ATTENDANCE'
        : 'CLEARED';

    const alloc: ExamSeatAllocation = {
      id: `seat-${Date.now()}`,
      examId: 'exam-custom',
      unitCode: input.unitCode,
      examDate: input.examDate,
      timeWindow: input.timeWindow,
      venue: input.venue,
      seatNumber: cleanSeat,
      studentRegNo: cleanReg,
      studentName: input.studentName.trim(),
      attendancePercent: input.attendancePercent,
      feeClearedPercent: input.feeClearedPercent,
      permitStatus,
      checkedIn: false,
    };

    this.state.seatingAllocations.unshift(alloc);
    this.appendAudit(ROLE_ACTORS[actor].name, 'ASSIGN_EXAM_SEAT', `Allocated ${alloc.seatNumber} (${alloc.permitStatus}) to ${alloc.studentRegNo}`);
    this.saveState();
    return { ok: true, seat: alloc };
  }

  toggleSeatCheckIn(seatId: string, actor: ExamRolePersona): { ok: true } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Invigilator or Exam Officer required for hall check-in.' };
    }
    const seat = this.state.seatingAllocations.find((s) => s.id === seatId);
    if (!seat) return { ok: false, error: 'Allocation not found.' };
    if (seat.permitStatus !== 'CLEARED') {
      return { ok: false, error: `Check-in denied: Candidate permit status is ${seat.permitStatus}.` };
    }
    seat.checkedIn = !seat.checkedIn;
    this.appendAudit(ROLE_ACTORS[actor].name, 'EXAM_HALL_CHECKIN', `${seat.checkedIn ? 'Checked in' : 'Unchecked'} ${seat.studentRegNo} at ${seat.seatNumber}`);
    this.saveState();
    return { ok: true };
  }

  logExamIncident(
    input: {
      unitCode: string;
      venue: string;
      studentRegNo?: string;
      category: ExamIncidentRecord['category'];
      severity: ExamIncidentRecord['severity'];
      summary: string;
    },
    actor: ExamRolePersona
  ): { ok: true; incident: ExamIncidentRecord } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Only invigilation or examination staff may log formal exam incidents.' };
    }
    if (!input.summary.trim()) {
      return { ok: false, error: 'Incident summary is required.' };
    }
    const person = ROLE_ACTORS[actor];
    const inc: ExamIncidentRecord = {
      id: `inc-${Date.now()}`,
      examId: 'exam-01',
      unitCode: input.unitCode,
      venue: input.venue,
      studentRegNo: input.studentRegNo?.trim() || undefined,
      category: input.category,
      severity: input.severity,
      summary: input.summary.trim(),
      recordedBy: person.name,
      recordedAtIso: new Date().toISOString(),
      resolutionStatus: 'OPEN',
    };
    this.state.incidents.unshift(inc);
    this.appendAudit(person.name, 'LOG_EXAM_INCIDENT', `[${inc.severity}] ${inc.category} in ${inc.venue}`);
    this.saveState();
    return { ok: true, incident: inc };
  }

  resolveExamIncident(
    incidentId: string,
    note: string,
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    if (actor !== 'EXAM_OFFICER' && actor !== 'HOD_MODERATOR') {
      return { ok: false, error: 'Exam Officer or HOD required to close examination incidents.' };
    }
    const inc = this.state.incidents.find((i) => i.id === incidentId);
    if (!inc) return { ok: false, error: 'Incident not found.' };
    inc.resolutionStatus = 'RESOLVED';
    inc.resolutionNote = note.trim() || 'Reviewed and resolved by Examination Board.';
    this.appendAudit(ROLE_ACTORS[actor].name, 'RESOLVE_INCIDENT', `Resolved ${inc.id}`);
    this.saveState();
    return { ok: true };
  }

  proposeSupplementaryDecision(
    input: {
      studentRegNo: string;
      studentName: string;
      unitCode: string;
      originalScore: number;
      decisionType: SupplementaryDecision['decisionType'];
      reason: string;
      scheduledDate: string;
    },
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    if (actor === 'STUDENT_CANDIDATE') {
      return { ok: false, error: 'Unauthorized action.' };
    }
    if (!input.studentRegNo.trim() || !input.reason.trim()) {
      return { ok: false, error: 'Registration number and board justification are required.' };
    }
    const person = ROLE_ACTORS[actor];
    const dec: SupplementaryDecision = {
      id: `sup-${Date.now()}`,
      studentRegNo: input.studentRegNo.trim().toUpperCase(),
      studentName: input.studentName.trim() || 'Candidate',
      unitCode: input.unitCode,
      originalScore: input.originalScore,
      decisionType: input.decisionType,
      reason: input.reason.trim(),
      proposedById: person.id,
      proposedByName: person.name,
      status: 'PENDING_BOARD',
      scheduledDate: input.scheduledDate || '2026-05-18',
    };
    this.state.supplementaryDecisions.unshift(dec);
    this.appendAudit(person.name, 'PROPOSE_SUPPLEMENTARY', `${dec.decisionType} proposed for ${dec.studentRegNo} (${dec.unitCode})`);
    this.saveState();
    return { ok: true };
  }

  decideSupplementary(
    decisionId: string,
    outcome: 'APPROVED' | 'REJECTED',
    actor: ExamRolePersona
  ): { ok: true } | { ok: false; error: string } {
    if (actor !== 'EXAM_OFFICER' && actor !== 'HOD_MODERATOR') {
      return { ok: false, error: 'Requires Examination Officer or HOD approval.' };
    }
    const dec = this.state.supplementaryDecisions.find((d) => d.id === decisionId);
    if (!dec) return { ok: false, error: 'Record not found.' };
    const approver = ROLE_ACTORS[actor];
    if (approver.id === dec.proposedById) {
      return {
        ok: false,
        error: `Separation of duties enforced: Proposer (${dec.proposedByName}) cannot approve their own supplementary recommendation.`,
      };
    }
    dec.status = outcome;
    dec.approvedById = approver.id;
    dec.approvedByName = approver.name;
    this.appendAudit(approver.name, 'DECIDE_SUPPLEMENTARY', `${outcome} ${dec.decisionType} for ${dec.studentRegNo}`);
    this.saveState();
    return { ok: true };
  }
}

export const examAssessmentService = new ExamAssessmentService();

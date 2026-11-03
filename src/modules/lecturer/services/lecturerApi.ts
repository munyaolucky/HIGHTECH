import type {
  TeachingAssignment,
  LessonPlanItem,
  SchemeOfWorkItem,
  SchemeWeek,
  LearningMaterialItem,
  TimetableEntry,
  CollegeClassroom,
  LaboratoryEquipmentItem,
  EquipmentFaultItem,
  OnlineClassItem,
  QuestionBankItem,
  LecturerAssessmentItem,
  LecturerAssessmentType,
} from "../types/lecturer";

export type {
  TeachingAssignment,
  LessonPlanItem,
  SchemeOfWorkItem,
  SchemeWeek,
  LearningMaterialItem,
  TimetableEntry,
  CollegeClassroom,
  LaboratoryEquipmentItem,
  EquipmentFaultItem,
  OnlineClassItem,
  QuestionBankItem,
  LecturerAssessmentItem,
  LecturerAssessmentType,
};


export interface LecturerProfileData {
  id: string;
  staffId: string;
  registrationNumber: string; // HCA/LECT/2026/001
  staffRegistrationNumber: string; // HCA/STAFF/2026/001
  fullName: string;
  officialEmail: string;
  phone: string;
  designation: string;
  employmentType: string;
  specialization: string;
  academicQualifications: string;
  professionalQualifications: string;
  employmentStatus: "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";
  department: string;
  school: string;
  campus: string;
  reportingHod: string;
  officeLocation: string;
  hireDate: string;
}

export interface ProfileCorrectionRequest {
  id: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedBy?: string;
}

export interface EnrolledStudentItem {
  id: string;
  studentId: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  courseName: string;
  studyYear: string;
  attendancePercentage: number;
  catAverage: number;
  status: "APPROVED" | "PROVISIONAL" | "SUSPENDED";
}

export interface TimetableChangeRequestItem {
  id: string;
  assignmentId: string;
  unitCode: string;
  currentDate: string;
  requestedDate: string;
  currentStart: string;
  requestedStart: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

// STORAGE KEYS
const STORAGE_PREFIX = "hca_lecturer_";

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage save failed", e);
  }
}

// SEED DATA
const INITIAL_PROFILE: LecturerProfileData = {
  id: "lect-001",
  staffId: "staff-001",
  registrationNumber: "HCA/LECT/2026/001",
  staffRegistrationNumber: "HCA/STAFF/2026/001",
  fullName: "Dr. Peter Otieno Onyango",
  officialEmail: "p.otieno@hitech.ac.ke",
  phone: "+254 712 345 678",
  designation: "Senior Lecturer & Computing Laboratory Director",
  employmentType: "Permanent & Pensionable",
  specialization: "Advanced Algorithms, Distributed Systems & Network Forensics",
  academicQualifications: "Ph.D. Computer Science (UoN), M.Sc. Software Engineering (JKUAT), B.Sc. Computer Science 1st Class (Strathmore)",
  professionalQualifications: "CISSP Certified Information Systems Security Professional, CCNA Routing & Switching, TVET CDACC Lead Assessor",
  employmentStatus: "ACTIVE",
  department: "Department of Computer Science & Software Engineering",
  school: "School of Computing & Informatics",
  campus: "Nairobi Main Campus",
  reportingHod: "Prof. Grace Wanjiku (HOD Computing)",
  officeLocation: "Technology Block C, Room 304",
  hireDate: "2019-08-15",
};

const INITIAL_ASSIGNMENTS: TeachingAssignment[] = [
  {
    id: "asg-csc301",
    lecturerId: "lect-001",
    courseId: "crs-bsc-cs",
    courseName: "BSc Computer Science",
    unitId: "CSC 301",
    unitName: "Advanced Data Structures & Algorithms",
    classGroupId: "GRP-CS-3A",
    academicYear: "2025/2026",
    semester: "Semester 1",
    campusId: "campus-nbi-main",
    campusName: "Nairobi Main Campus",
    enrolledStudentsCount: 42,
    active: true,
  },
  {
    id: "asg-net303",
    lecturerId: "lect-001",
    courseId: "crs-dip-cyber",
    courseName: "Diploma in Cyber Security & Digital Forensics",
    unitId: "NET 303",
    unitName: "Cybersecurity Architectures & Forensics",
    classGroupId: "GRP-CYBER-2A",
    academicYear: "2025/2026",
    semester: "Semester 1",
    campusId: "campus-nbi-main",
    campusName: "Nairobi Main Campus",
    enrolledStudentsCount: 38,
    active: true,
  },
];

const INITIAL_LESSONS: LessonPlanItem[] = [
  {
    id: "lp-001",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    unitTitle: "Advanced Data Structures & Algorithms",
    lessonDate: "2026-03-02",
    durationMinutes: 180,
    topic: "Balanced Binary Search Trees & AVL Rotations",
    subtopic: "Left/Right Double Rotations & Balance Factor Calculations",
    objectives: "Enable students to compute balance factors, identify unbalance triggers, and write rotation routines in C++ and Python.",
    teachingMethods: "Interactive whiteboard lecture, live debugger demonstration, algorithmic tracing.",
    activities: "Students implement AVL balance verification on whiteboard and compile code in Lab 3B.",
    resources: "CLRS Textbook Ch. 13, Interactive Tree Visualizer, Lab Worksheet 04.",
    assessmentMethods: "Formative coding quiz and peer-reviewed complexity proofs.",
    remarks: "Class completed with high engagement. 92% passed the formative micro-quiz.",
    status: "APPROVED",
    createdAt: "2026-02-28",
  },
  {
    id: "lp-002",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    unitTitle: "Cybersecurity Architectures & Forensics",
    lessonDate: "2026-03-04",
    durationMinutes: 180,
    topic: "Digital Forensics & Volatile Memory Acquisition",
    subtopic: "LiME kernel module and Volatility 3 framework analysis",
    objectives: "Perform raw memory dumps on Linux endpoints and extract process trees without memory corruption.",
    teachingMethods: "Virtual Machine hands-on lab demonstration and forensic live imaging.",
    activities: "Executing FTK Imager and Volatility plugins on simulated infected VM snapshots.",
    resources: "Forensic Workstation Suite, Kali Linux ISO, Sanitized incident dump samples.",
    assessmentMethods: "Submission of MD5/SHA256 evidence chain-of-custody hashes.",
    remarks: "Pending HOD final review.",
    status: "SUBMITTED",
    createdAt: "2026-03-01",
  },
];

const INITIAL_SCHEMES: SchemeOfWorkItem[] = [
  {
    id: "sch-001",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    unitTitle: "Advanced Data Structures & Algorithms",
    title: "CSC 301 Scheme of Work - Term 1 2026",
    academicYear: "2026",
    semester: "Semester 1",
    status: "APPROVED",
    createdAt: "2026-01-10",
    weeks: [
      {
        weekNumber: 1,
        plannedDate: "2026-01-12",
        actualDate: "2026-01-12",
        topic: "Asymptotic Analysis & Recurrences",
        subtopic: "Master Theorem & Substitution Method",
        learningOutcome: "Derive asymptotic bounds for divide-and-conquer algorithms",
        activities: "Lecture, Mathematical derivations, Problem set walkthrough",
        resources: "Lecture Slide Deck 1, Problem Sheet 1",
        assessment: "In-class formative check",
        completed: true,
      },
      {
        weekNumber: 2,
        plannedDate: "2026-01-19",
        actualDate: "2026-01-19",
        topic: "Advanced Heaps & Priority Queues",
        subtopic: "Binomial & Fibonacci Heaps",
        learningOutcome: "Analyze amortized complexity of decrease-key operations",
        activities: "Algorithm animation, pointer diagramming",
        resources: "Heap Visualizer, Code Templates",
        assessment: "Lab Practical 1",
        completed: true,
      },
      {
        weekNumber: 3,
        plannedDate: "2026-01-26",
        actualDate: "2026-01-26",
        topic: "Self-Balancing Trees",
        subtopic: "AVL Trees & Red-Black Trees",
        learningOutcome: "Perform insertion, deletion and tree coloring invariants",
        activities: "Step-by-step whiteboard tracing and C++ implementation",
        resources: "Lab Manual Ch. 3",
        assessment: "CAT 1 Exam",
        completed: true,
      },
      {
        weekNumber: 4,
        plannedDate: "2026-02-02",
        actualDate: "2026-02-02",
        topic: "Graph Traversal & Shortest Paths",
        subtopic: "Dijkstra, Bellman-Ford, Johnson's Algorithm",
        learningOutcome: "Implement graph algorithms on adjacency lists and sparse matrices",
        activities: "Network routing simulation in Python",
        resources: "Jupyter Notebooks, Graph Datasets",
        assessment: "Assignment 1 Submission",
        completed: true,
      },
      {
        weekNumber: 5,
        plannedDate: "2026-02-09",
        actualDate: "2026-02-09",
        topic: "Dynamic Programming Architectures",
        subtopic: "Optimal substructure & memoization tables",
        learningOutcome: "Formulate DP state transitions for Knapsack and Matrix Chain",
        activities: "Pair programming in Lab 3B",
        resources: "Lecture Slides 5",
        assessment: "Practical Coding Challenge",
        completed: false,
      },
    ],
  },
];

const INITIAL_MATERIALS: LearningMaterialItem[] = [
  {
    id: "mat-001",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "Lecture Notes 04: AVL Tree Rotations & Invariant Proofs",
    description: "Detailed step-by-step mathematical proofs and C++ implementation notes.",
    topic: "Balanced Search Trees",
    fileName: "CSC301_Module4_AVL_Trees.pdf",
    fileSize: "2.4 MB",
    mimeType: "application/pdf",
    published: true,
    publishedAt: "2026-02-25",
    downloadCount: 41,
  },
  {
    id: "mat-002",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "Lab Practical Sheet: Red-Black Trees Verification Harness",
    description: "Automated test harness and skeleton code for student submissions.",
    topic: "Tree Structures",
    fileName: "Lab04_RedBlackTree_Harness.zip",
    fileSize: "8.1 MB",
    mimeType: "application/zip",
    published: true,
    publishedAt: "2026-02-27",
    downloadCount: 38,
  },
  {
    id: "mat-003",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    title: "Forensic Evidence Chain of Custody Standard Operating Procedure",
    description: "Compliance handbook adhering to DCI Cybercrime Division guidelines.",
    topic: "Digital Forensics",
    fileName: "NET303_Forensic_Chain_Of_Custody_SOP.pdf",
    fileSize: "1.8 MB",
    mimeType: "application/pdf",
    published: true,
    publishedAt: "2026-02-20",
    downloadCount: 36,
  },
  {
    id: "mat-004",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    title: "Memory Forensics Volatility 3 Cheat Sheet",
    description: "Quick command reference for Linux/Windows memory dump triage.",
    topic: "Memory Analysis",
    fileName: "Volatility3_Command_Cheatsheet.pdf",
    fileSize: "640 KB",
    mimeType: "application/pdf",
    published: false,
    downloadCount: 0,
  },
];

const INITIAL_TIMETABLE: TimetableEntry[] = [
  {
    id: "tt-001",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    unitTitle: "Advanced Data Structures & Algorithms",
    classGroupId: "GRP-CS-3A",
    roomName: "Computer Laboratory 3B",
    roomCode: "LAB-3B",
    building: "Technology Block C",
    startTime: "08:00 AM",
    endTime: "11:00 AM",
    dayOfWeek: "Monday",
    sessionType: "Lab Practical",
  },
  {
    id: "tt-002",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    unitTitle: "Cybersecurity Architectures & Forensics",
    classGroupId: "GRP-CYBER-2A",
    roomName: "Cybersecurity Forensics Lab 1A",
    roomCode: "CYBER-1A",
    building: "Science & Innovation Complex",
    startTime: "02:00 PM",
    endTime: "05:00 PM",
    dayOfWeek: "Wednesday",
    sessionType: "Lab Practical",
  },
  {
    id: "tt-003",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    unitTitle: "Advanced Data Structures & Algorithms",
    classGroupId: "GRP-CS-3A",
    roomName: "Lecture Theatre LH 01",
    roomCode: "LH-01",
    building: "Main Academic Complex",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    dayOfWeek: "Thursday",
    sessionType: "Lecture",
  },
  {
    id: "tt-004",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    unitTitle: "Cybersecurity Architectures & Forensics",
    classGroupId: "GRP-CYBER-2A",
    roomName: "Tutorial Room T-102",
    roomCode: "TR-102",
    building: "Technology Block C",
    startTime: "08:30 AM",
    endTime: "10:30 AM",
    dayOfWeek: "Friday",
    sessionType: "Tutorial",
  },
];

const INITIAL_CLASSROOMS: CollegeClassroom[] = [
  {
    id: "rm-001",
    campusName: "Nairobi Main Campus",
    building: "Technology Block C",
    roomName: "Computer Laboratory 3B",
    roomCode: "LAB-3B",
    capacity: 45,
    roomType: "COMPUTER_LAB",
    active: true,
  },
  {
    id: "rm-002",
    campusName: "Nairobi Main Campus",
    building: "Science & Innovation Complex",
    roomName: "Cybersecurity Forensics Lab 1A",
    roomCode: "CYBER-1A",
    capacity: 40,
    roomType: "COMPUTER_LAB",
    active: true,
  },
  {
    id: "rm-003",
    campusName: "Nairobi Main Campus",
    building: "Main Academic Complex",
    roomName: "Lecture Hall LH 01",
    roomCode: "LH-01",
    capacity: 120,
    roomType: "LECTURE_HALL",
    active: true,
  },
  {
    id: "rm-004",
    campusName: "Nairobi Main Campus",
    building: "Technology Block C",
    roomName: "Tutorial Room 102",
    roomCode: "TR-102",
    capacity: 35,
    roomType: "CLASSROOM",
    active: true,
  },
];

const INITIAL_LAB_EQUIPMENT: LaboratoryEquipmentItem[] = [
  {
    id: "eq-001",
    laboratoryName: "Computer Laboratory 3B",
    assetCode: "HCA/EQ/LAB3B/WS-01",
    equipmentName: "Dell Precision 3660 High-Performance Workstation",
    manufacturer: "Dell Technologies",
    modelNumber: "Precision 3660 Tower (Core i9 12th Gen, 64GB RAM, RTX 3080)",
    condition: "GOOD",
    lastServiceDate: "2026-01-15",
  },
  {
    id: "eq-002",
    laboratoryName: "Computer Laboratory 3B",
    assetCode: "HCA/EQ/LAB3B/PROJ-01",
    equipmentName: "Epson 4K Laser Ceiling Projector",
    manufacturer: "Epson",
    modelNumber: "EB-L520U",
    condition: "GOOD",
    lastServiceDate: "2025-11-20",
  },
  {
    id: "eq-003",
    laboratoryName: "Cybersecurity Forensics Lab 1A",
    assetCode: "HCA/EQ/CYBER/SRV-01",
    equipmentName: "Dell PowerEdge R750 Virtualization Server",
    manufacturer: "Dell Enterprise",
    modelNumber: "R750 Rack Server (2x Intel Xeon Gold, 256GB ECC RAM)",
    condition: "GOOD",
    lastServiceDate: "2026-02-01",
  },
  {
    id: "eq-004",
    laboratoryName: "Cybersecurity Forensics Lab 1A",
    assetCode: "HCA/EQ/CYBER/SW-02",
    equipmentName: "Cisco Catalyst 3850 48-Port PoE+ Switch",
    manufacturer: "Cisco Systems",
    modelNumber: "WS-C3850-48P-L",
    condition: "FAIR",
    lastServiceDate: "2025-09-10",
  },
  {
    id: "eq-005",
    laboratoryName: "Cybersecurity Forensics Lab 1A",
    assetCode: "HCA/EQ/CYBER/TAP-01",
    equipmentName: "Garland Network TAP Passive Packet Sniffer",
    manufacturer: "Garland Technology",
    modelNumber: "P1GCCAS",
    condition: "DAMAGED",
    lastServiceDate: "2025-08-14",
  },
];

const INITIAL_FAULTS: EquipmentFaultItem[] = [
  {
    id: "flt-001",
    equipmentId: "eq-005",
    equipmentName: "Garland Network TAP Passive Packet Sniffer",
    assetCode: "HCA/EQ/CYBER/TAP-01",
    reportedBy: "Dr. Peter Otieno Onyango",
    description: "Port 2 TX fiber optical transceiver unresponsive during forensic packet mirroring session.",
    priority: "URGENT",
    status: "IN_PROGRESS",
    reportedAt: "2026-02-26 14:30",
  },
  {
    id: "flt-002",
    equipmentId: "eq-004",
    equipmentName: "Cisco Catalyst 3850 48-Port PoE+ Switch",
    assetCode: "HCA/EQ/CYBER/SW-02",
    reportedBy: "Dr. Peter Otieno Onyango",
    description: "Cooling fan assembly 2 emits intermittent high-pitch whine on full load.",
    priority: "NORMAL",
    status: "REPORTED",
    reportedAt: "2026-03-01 09:15",
  },
];

const INITIAL_ONLINE_CLASSES: OnlineClassItem[] = [
  {
    id: "onc-001",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "Virtual Remedial: Dynamic Programming State-Machine Formulations",
    description: "Evening live walkthrough and Q&A on LeetCode/Codeforces hard recurrence challenges.",
    scheduledStart: "2026-03-05T19:00:00",
    scheduledEnd: "2026-03-05T20:30:00",
    provider: "TEAMS",
    meetingUrl: "https://teams.microsoft.com/l/meetup-join/19%3ahca-csc301-remedial",
    status: "SCHEDULED",
  },
  {
    id: "onc-002",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    title: "Guest Industry Masterclass: Threat Intelligence with Safaricom Cyber SOC",
    description: "Live demonstration with Lead Threat Analyst on Cobalt Strike C2 beacon detection.",
    scheduledStart: "2026-03-08T14:00:00",
    scheduledEnd: "2026-03-08T16:00:00",
    provider: "GOOGLE_MEET",
    meetingUrl: "https://meet.google.com/hca-cyber-soc",
    status: "SCHEDULED",
  },
];

const INITIAL_STUDENTS: EnrolledStudentItem[] = [
  {
    id: "stu-001",
    studentId: "stu-001",
    registrationNumber: "HCA/STU/2026/001",
    fullName: "Faith Wangari Ndung'u",
    email: "f.wangari@student.hitech.ac.ke",
    phone: "+254 711 223 344",
    courseName: "BSc Computer Science",
    studyYear: "Year 3 Sem 1",
    attendancePercentage: 96,
    catAverage: 88,
    status: "APPROVED",
  },
  {
    id: "stu-002",
    studentId: "stu-002",
    registrationNumber: "HCA/STU/2026/002",
    fullName: "Brian Kipruto Korir",
    email: "b.kipruto@student.hitech.ac.ke",
    phone: "+254 722 334 455",
    courseName: "BSc Computer Science",
    studyYear: "Year 3 Sem 1",
    attendancePercentage: 92,
    catAverage: 79,
    status: "APPROVED",
  },
  {
    id: "stu-003",
    studentId: "stu-003",
    registrationNumber: "HCA/STU/2025/110",
    fullName: "Samuel Ochieng Odhiambo",
    email: "s.ochieng@student.hitech.ac.ke",
    phone: "+254 733 445 566",
    courseName: "BSc Computer Science",
    studyYear: "Year 3 Sem 1",
    attendancePercentage: 81,
    catAverage: 72,
    status: "APPROVED",
  },
  {
    id: "stu-004",
    studentId: "stu-004",
    registrationNumber: "HCA/STU/2025/142",
    fullName: "Dennis Mutiso Kyalo",
    email: "d.mutiso@student.hitech.ac.ke",
    phone: "+254 744 556 677",
    courseName: "BSc Computer Science",
    studyYear: "Year 3 Sem 1",
    attendancePercentage: 68,
    catAverage: 54,
    status: "APPROVED",
  },
  {
    id: "stu-005",
    studentId: "stu-005",
    registrationNumber: "HCA/STU/2026/044",
    fullName: "Mercy Chepngetich",
    email: "m.chepngetich@student.hitech.ac.ke",
    phone: "+254 755 667 788",
    courseName: "Diploma in Cyber Security",
    studyYear: "Year 2 Sem 1",
    attendancePercentage: 94,
    catAverage: 82,
    status: "APPROVED",
  },
  {
    id: "stu-006",
    studentId: "stu-006",
    registrationNumber: "HCA/STU/2026/058",
    fullName: "Kelvin Mwangi Karanja",
    email: "k.mwangi@student.hitech.ac.ke",
    phone: "+254 766 778 899",
    courseName: "Diploma in Cyber Security",
    studyYear: "Year 2 Sem 1",
    attendancePercentage: 89,
    catAverage: 76,
    status: "APPROVED",
  },
];

const INITIAL_ASSESSMENTS: LecturerAssessmentItem[] = [
  {
    id: "ass-001",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "Continuous Assessment Test 1: Asymptotic Notation & Balanced BSTs",
    instructions: "Answer all 25 randomized questions. No external reference materials allowed. Code compilation must pass standard gcc 12.2 flags.",
    assessmentType: "CAT",
    totalMarks: 30,
    passMark: 15,
    durationMinutes: 60,
    availableFrom: "2026-03-10T09:00:00",
    availableUntil: "2026-03-10T12:00:00",
    allowLate: false,
    randomizeQuestions: true,
    status: "PUBLISHED",
    questionsCount: 25,
    submissionsCount: 42,
    createdAt: "2026-02-18",
  },
  {
    id: "ass-002",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "Practical Assignment 1: Dijkstra & Graph Minimum Spanning Trees",
    instructions: "Submit single .zip archive containing source code, test cases, and a 2-page LaTeX analysis report.",
    assessmentType: "ASSIGNMENT",
    totalMarks: 20,
    passMark: 10,
    durationMinutes: 1440,
    availableFrom: "2026-03-01T08:00:00",
    availableUntil: "2026-03-15T23:59:00",
    allowLate: true,
    randomizeQuestions: false,
    status: "OPEN",
    questionsCount: 4,
    submissionsCount: 27,
    createdAt: "2026-02-28",
  },
  {
    id: "ass-003",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    title: "CAT 1: Forensic Network PCAP Analysis & IDS Signatures",
    instructions: "Download assigned network capture file and answer questions regarding attack origin, beaconing interval, and compromised exfiltration IP.",
    assessmentType: "CAT",
    totalMarks: 30,
    passMark: 15,
    durationMinutes: 90,
    availableFrom: "2026-03-12T14:00:00",
    availableUntil: "2026-03-12T17:00:00",
    allowLate: false,
    randomizeQuestions: true,
    status: "APPROVED",
    questionsCount: 20,
    submissionsCount: 0,
    createdAt: "2026-03-01",
  },
];

const INITIAL_QUESTIONS: QuestionBankItem[] = [
  {
    id: "q-001",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "AVL Tree Balance Factor Condition",
    prompt: "In an AVL balanced search tree, what is the valid allowable range for the balance factor BF(T) of every internal node?",
    instructions: "Select the single best answer.",
    topic: "Balanced Search Trees",
    type: "MCQ_SINGLE",
    marks: 2,
    difficulty: "EASY",
    options: [
      { id: "opt-1", text: "BF ∈ {-1, 0, 1}" },
      { id: "opt-2", text: "BF ∈ {0, 1, 2}" },
      { id: "opt-3", text: "BF ∈ {-2, 0, 2}" },
      { id: "opt-4", text: "BF ≤ 0 only" },
    ],
    answerConfig: { correctOptionIds: ["opt-1"] },
    explanation: "An AVL tree maintains height balance such that the height difference between left and right subtrees never exceeds 1.",
    status: "APPROVED",
    updatedAt: "2026-02-20",
  },
  {
    id: "q-002",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "Asymptotic Complexity of Red-Black Tree Lookup",
    prompt: "What is the worst-case time complexity of searching for a key in a Red-Black Tree containing N elements?",
    instructions: "Select the asymptotic class.",
    topic: "Red-Black Trees",
    type: "MCQ_SINGLE",
    marks: 2,
    difficulty: "MEDIUM",
    options: [
      { id: "opt-1", text: "O(1)" },
      { id: "opt-2", text: "O(log N)" },
      { id: "opt-3", text: "O(N)" },
      { id: "opt-4", text: "O(N log N)" },
    ],
    answerConfig: { correctOptionIds: ["opt-2"] },
    explanation: "Because a Red-Black tree has maximum height at most 2 * log2(N + 1), any search takes O(log N) operations.",
    status: "APPROVED",
    updatedAt: "2026-02-22",
  },
  {
    id: "q-003",
    assignmentId: "asg-net303",
    unitCode: "NET 303",
    title: "Digital Forensics Chain of Custody Invariant",
    prompt: "State whether the following assertion is True or False: Forensic imaging of physical storage media must always take place directly on the original drive without hardware write-blockers.",
    instructions: "Indicate True or False.",
    topic: "Digital Forensics SOP",
    type: "TRUE_FALSE",
    marks: 1.5,
    difficulty: "EASY",
    answerConfig: { correctAnswer: "false" },
    explanation: "Hardware write-blockers must always be utilized to prevent inadvertent OS writes or timestamp modification.",
    status: "APPROVED",
    updatedAt: "2026-02-25",
  },
  {
    id: "q-004",
    assignmentId: "asg-csc301",
    unitCode: "CSC 301",
    title: "Min-Heap Insertion Amortized Cost",
    prompt: "What is the tight worst-case time complexity to insert an element into a binary Min-Heap of size N?",
    instructions: "Type the exact big-O formula.",
    topic: "Priority Queues",
    type: "SHORT_ANSWER",
    marks: 3,
    difficulty: "MEDIUM",
    answerConfig: { acceptedAnswers: ["O(log N)", "O(log n)", "O(logn)"] },
    explanation: "Percolate-up requires at most height comparisons, which is floor(log2 N).",
    status: "DRAFT",
    updatedAt: "2026-03-01",
  },
];

// LECTURER API CLIENT CLASS
class LecturerApiClient {
  // 1. Dashboard
  async dashboard() {
    const profile = this.getProfile();
    const assignments = this.getAssignments();
    const lessonPlans = this.getLessonPlans();
    const assessments = this.getAssessments();

    const pendingLessons = lessonPlans.filter((l) => l.status === "SUBMITTED" || l.status === "DRAFT").length;
    const pendingAssess = assessments.filter((a) => a.status === "DRAFT" || a.status === "PENDING_APPROVAL").length;

    return {
      lecturer: {
        id: profile.id,
        name: profile.fullName,
        registrationNumber: profile.registrationNumber,
        staffRegistrationNumber: profile.staffRegistrationNumber,
        employmentStatus: profile.employmentStatus,
        designation: profile.designation,
        department: profile.department,
      },
      statistics: {
        assignedUnits: assignments.length,
        pendingLessonPlans: pendingLessons,
        pendingAttendance: 1, // Today's pending session
        pendingAssessments: pendingAssess,
        pendingResults: 2, // CAT 1 moderation queue
      },
      notifications: [
        {
          id: "notif-1",
          title: "HOD Approval: CSC 301 Lesson Plan 04 Approved",
          message: "Prof. Grace Wanjiku has approved your Lesson Plan for Balanced Binary Search Trees.",
        },
        {
          id: "notif-2",
          title: "Examination Office: CAT 1 Moderation Window Open",
          message: "All CAT 1 examination papers must be submitted for moderation by Friday 17:00.",
        },
        {
          id: "notif-3",
          title: "Laboratory Update: Workstation 12 Memory Upgraded",
          message: "ICT Hardware maintenance team completed 64GB ECC RAM installation in Lab 3B.",
        },
      ],
    };
  }

  // 2. Profile
  getProfile(): LecturerProfileData {
    return loadStorage<LecturerProfileData>("profile", INITIAL_PROFILE);
  }

  saveProfile(profile: LecturerProfileData): void {
    saveStorage("profile", profile);
  }

  getProfileCorrections(): ProfileCorrectionRequest[] {
    return loadStorage<ProfileCorrectionRequest[]>("profile_corrections", [
      {
        id: "pcr-001",
        fieldName: "phone",
        oldValue: "+254 700 111 222",
        newValue: "+254 712 345 678",
        reason: "Updated official Safaricom institutional line",
        status: "APPROVED",
        submittedAt: "2026-01-15",
        reviewedBy: "HR Manager - Sarah Muthoni",
      },
    ]);
  }

  requestProfileCorrection(data: { fieldName: string; newValue: string; reason: string }): ProfileCorrectionRequest {
    const list = this.getProfileCorrections();
    const profile = this.getProfile();
    const oldValue = (profile as Record<string, any>)[data.fieldName] || "";

    const newReq: ProfileCorrectionRequest = {
      id: "pcr-" + Date.now(),
      fieldName: data.fieldName,
      oldValue: String(oldValue),
      newValue: data.newValue,
      reason: data.reason,
      status: "PENDING",
      submittedAt: new Date().toISOString().split("T")[0],
    };

    list.unshift(newReq);
    saveStorage("profile_corrections", list);
    return newReq;
  }

  // 3. Teaching Assignments
  getAssignments(): TeachingAssignment[] {
    return loadStorage<TeachingAssignment[]>("assignments", INITIAL_ASSIGNMENTS);
  }

  // 4. Enrolled Students
  getClassStudents(assignmentId?: string, search = ""): EnrolledStudentItem[] {
    const students = loadStorage<EnrolledStudentItem[]>("students", INITIAL_STUDENTS);
    return students.filter((s) => {
      const matchSearch =
        !search ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.registrationNumber.toLowerCase().includes(search.toLowerCase());
      if (assignmentId === "asg-csc301") {
        return matchSearch && s.courseName.includes("Computer Science");
      }
      if (assignmentId === "asg-net303") {
        return matchSearch && s.courseName.includes("Cyber Security");
      }
      return matchSearch;
    });
  }

  getStudentProfile(studentId: string): EnrolledStudentItem | undefined {
    const students = this.getClassStudents();
    return students.find((s) => s.id === studentId || s.registrationNumber === studentId);
  }

  // 5. Lesson Plans
  getLessonPlans(): LessonPlanItem[] {
    return loadStorage<LessonPlanItem[]>("lesson_plans", INITIAL_LESSONS);
  }

  createLessonPlan(data: Omit<LessonPlanItem, "id" | "createdAt" | "status">): LessonPlanItem {
    const list = this.getLessonPlans();
    const newPlan: LessonPlanItem = {
      ...data,
      id: "lp-" + Date.now(),
      status: "SUBMITTED",
      createdAt: new Date().toISOString().split("T")[0],
    };
    list.unshift(newPlan);
    saveStorage("lesson_plans", list);
    return newPlan;
  }

  // 6. Schemes of Work
  getSchemes(): SchemeOfWorkItem[] {
    return loadStorage<SchemeOfWorkItem[]>("schemes", INITIAL_SCHEMES);
  }

  createScheme(data: Omit<SchemeOfWorkItem, "id" | "createdAt" | "status">): SchemeOfWorkItem {
    const list = this.getSchemes();
    const newScheme: SchemeOfWorkItem = {
      ...data,
      id: "sch-" + Date.now(),
      status: "DRAFT",
      createdAt: new Date().toISOString().split("T")[0],
    };
    list.unshift(newScheme);
    saveStorage("schemes", list);
    return newScheme;
  }

  // 7. Learning Materials
  getMaterials(): LearningMaterialItem[] {
    return loadStorage<LearningMaterialItem[]>("materials", INITIAL_MATERIALS);
  }

  uploadMaterial(data: Omit<LearningMaterialItem, "id" | "downloadCount">): LearningMaterialItem {
    const list = this.getMaterials();
    const newMat: LearningMaterialItem = {
      ...data,
      id: "mat-" + Date.now(),
      downloadCount: 0,
    };
    list.unshift(newMat);
    saveStorage("materials", list);
    return newMat;
  }

  toggleMaterialPublish(id: string): LearningMaterialItem | undefined {
    const list = this.getMaterials();
    const item = list.find((m) => m.id === id);
    if (item) {
      item.published = !item.published;
      if (item.published) {
        item.publishedAt = new Date().toISOString().split("T")[0];
      }
      saveStorage("materials", list);
    }
    return item;
  }

  // 8. Timetable
  getTimetable(): TimetableEntry[] {
    return loadStorage<TimetableEntry[]>("timetable", INITIAL_TIMETABLE);
  }

  getTimetableRequests(): TimetableChangeRequestItem[] {
    return loadStorage<TimetableChangeRequestItem[]>("timetable_requests", [
      {
        id: "ttr-001",
        assignmentId: "asg-csc301",
        unitCode: "CSC 301",
        currentDate: "2026-03-02",
        requestedDate: "2026-03-03",
        currentStart: "08:00 AM",
        requestedStart: "02:00 PM",
        reason: "Scheduled server room maintenance conflict in Lab 3B",
        status: "APPROVED",
        createdAt: "2026-02-27",
      },
    ]);
  }

  createTimetableRequest(data: Omit<TimetableChangeRequestItem, "id" | "status" | "createdAt">): TimetableChangeRequestItem {
    const list = this.getTimetableRequests();
    const newReq: TimetableChangeRequestItem = {
      ...data,
      id: "ttr-" + Date.now(),
      status: "PENDING",
      createdAt: new Date().toISOString().split("T")[0],
    };
    list.unshift(newReq);
    saveStorage("timetable_requests", list);
    return newReq;
  }

  // 9. Classrooms & Venues
  getClassrooms(): CollegeClassroom[] {
    return loadStorage<CollegeClassroom[]>("classrooms", INITIAL_CLASSROOMS);
  }

  // 10. Lab Equipment & Faults
  getLabEquipment(): LaboratoryEquipmentItem[] {
    return loadStorage<LaboratoryEquipmentItem[]>("equipment", INITIAL_LAB_EQUIPMENT);
  }

  getFaults(): EquipmentFaultItem[] {
    return loadStorage<EquipmentFaultItem[]>("faults", INITIAL_FAULTS);
  }

  reportFault(data: Omit<EquipmentFaultItem, "id" | "reportedAt" | "status">): EquipmentFaultItem {
    const list = this.getFaults();
    const newFault: EquipmentFaultItem = {
      ...data,
      id: "flt-" + Date.now(),
      status: "REPORTED",
      reportedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    list.unshift(newFault);
    saveStorage("faults", list);
    return newFault;
  }

  // 11. Online Classes
  getOnlineClasses(): OnlineClassItem[] {
    return loadStorage<OnlineClassItem[]>("online_classes", INITIAL_ONLINE_CLASSES);
  }

  scheduleOnlineClass(data: Omit<OnlineClassItem, "id" | "status">): OnlineClassItem {
    const list = this.getOnlineClasses();
    const newClass: OnlineClassItem = {
      ...data,
      id: "onc-" + Date.now(),
      status: "SCHEDULED",
    };
    list.unshift(newClass);
    saveStorage("online_classes", list);
    return newClass;
  }

  // 12. Assessments
  getAssessments(): LecturerAssessmentItem[] {
    return loadStorage<LecturerAssessmentItem[]>("assessments", INITIAL_ASSESSMENTS);
  }

  createAssessment(data: Omit<LecturerAssessmentItem, "id" | "createdAt" | "questionsCount" | "submissionsCount">): LecturerAssessmentItem {
    const list = this.getAssessments();
    const newAssessment: LecturerAssessmentItem = {
      ...data,
      id: "ass-" + Date.now(),
      questionsCount: 0,
      submissionsCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    list.unshift(newAssessment);
    saveStorage("assessments", list);
    return newAssessment;
  }

  getAssessmentById(id: string): LecturerAssessmentItem | undefined {
    return this.getAssessments().find((a) => a.id === id);
  }

  addQuestionsToAssessment(assessmentId: string, questionIds: string[]): boolean {
    const list = this.getAssessments();
    const item = list.find((a) => a.id === assessmentId);
    if (item) {
      item.questionsCount += questionIds.length;
      saveStorage("assessments", list);
      return true;
    }
    return false;
  }

  // 13. Question Bank
  getQuestions(filters?: { search?: string; type?: string; difficulty?: string; unitCode?: string }): QuestionBankItem[] {
    const list = loadStorage<QuestionBankItem[]>("questions", INITIAL_QUESTIONS);
    return list.filter((q) => {
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        if (!q.title.toLowerCase().includes(s) && !q.prompt.toLowerCase().includes(s)) {
          return false;
        }
      }
      if (filters?.type && filters.type !== "ALL" && q.type !== filters.type) return false;
      if (filters?.difficulty && filters.difficulty !== "ALL" && q.difficulty !== filters.difficulty) return false;
      if (filters?.unitCode && filters.unitCode !== "ALL" && q.unitCode !== filters.unitCode) return false;
      return true;
    });
  }

  createQuestion(data: Omit<QuestionBankItem, "id" | "updatedAt">): QuestionBankItem {
    const list = loadStorage<QuestionBankItem[]>("questions", INITIAL_QUESTIONS);
    const newQ: QuestionBankItem = {
      ...data,
      id: "q-" + Date.now(),
      updatedAt: new Date().toISOString().split("T")[0],
    };
    list.unshift(newQ);
    saveStorage("questions", list);
    return newQ;
  }
}

export const lecturerApi = new LecturerApiClient();

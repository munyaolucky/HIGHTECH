/**
 * HI-TECH COLLEGE – COMPLETE INTEGRATED DIGITAL COLLEGE MANAGEMENT SYSTEM
 * Master Feature Catalogue & Institutional Architectural Blueprint
 * 47 Functional Modules, 63 CBT Question Types, 32 RBAC Roles, 22 Implementation Phases,
 * and KES 400,000 Project Valuation Breakdown.
 *
 * Excluded: Transport Management (per institutional mandate).
 */

export interface FeatureSection {
  id: number;
  code: string;
  part: string;
  category: string;
  title: string;
  description: string;
  operationalScope: string;
  keyFeatures: string[];
  deliverables: string[];
  complianceStandards: string[];
  status: 'IMPLEMENTED' | 'ACTIVE_PORTAL' | 'CORE_FRAMEWORK' | 'READY_FOR_DEPLOY';
  targetAudience: string[];
}

export interface QuestionTypeItem {
  id: number;
  code: string;
  name: string;
  category: 'Objective' | 'Interactive' | 'Coding & Lab' | 'Practical & Office' | 'Subjective' | 'STEM & Math' | 'Multimedia' | 'Vocational & CBET';
  autoMarkable: boolean;
  description: string;
  gradingMechanism: string;
  sandboxSupported: boolean;
}

export interface UserRoleItem {
  id: string;
  roleName: string;
  category: 'Executive' | 'Academic' | 'Administrative' | 'Operations' | 'Student & Public';
  mainResponsibilities: string;
  accessLevel: 'Super Administrator' | 'High Authority' | 'Departmental' | 'Self-Service' | 'Restricted / Public';
  permittedPortals: string[];
  approvalThreshold: string;
}

export interface ImplementationPhaseItem {
  phaseNumber: string;
  phaseName: string;
  timeframe: string;
  mainImplementation: string;
  deliverablesCount: number;
  budgetAllocationKES: number;
  status: 'Completed' | 'Ready for Deploy' | 'Scheduled';
  keyMilestones: string[];
}

export interface BudgetDisbursementMilestone {
  milestone: string;
  title: string;
  percentage: number;
  amountKES: number;
  deliverableCriteria: string;
  triggerEvent: string;
}

export const MASTER_FEATURE_SECTIONS: FeatureSection[] = [
  // PART A: PLATFORM FOUNDATION
  {
    id: 1,
    code: 'SEC-01',
    part: 'Part A: Platform Foundation',
    category: 'Architecture',
    title: 'Complete Platform Structure & Unified Ecosystem',
    description: 'Centralized institutional foundation uniting Public Website, Admin, Academic, Student, Staff, Finance, and Exam portals under one shared database and security layer.',
    operationalScope: 'Institution-wide single-tenant / multi-tenant capable architecture with atomic registration engine and microservice/monolithic modularity.',
    keyFeatures: [
      'One institution, one relational database, shared API middleware',
      'Central Registration Number Generator engine: HCA/<TYPE>/<YEAR>/<SEQ> (e.g. HCA/STAFF/2026/001, HCA/STU/2026/001)',
      'High-availability load balancing, health check endpoints, and request ID correlation',
      'Unified session tokens, secure cookies, and cross-origin resource sharing (CORS) hardening',
      'Zero-trust network boundaries for administrative and grading routes',
      'Strict transport exclusion enforced throughout database schemas'
    ],
    deliverables: ['Database schemas', 'API gateway router', 'Registration sequencing service', 'Health monitor'],
    complianceStandards: ['Kenya Data Protection Act 2019', 'ISO 27001 Foundation', 'TVETA Governance Standards'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Super Admin', 'ICT Director', 'System Engineers']
  },
  {
    id: 2,
    code: 'SEC-02',
    part: 'Part A: Platform Foundation',
    category: 'Security & Access',
    title: 'User Roles, RBAC & Multi-Level Approvals',
    description: 'Granular Role-Based Access Control (RBAC) supporting 32 distinct institutional roles with hierarchical permissions and multi-tier approval chains.',
    operationalScope: 'All internal college staff, teaching faculty, external invigilators, students, and guardians.',
    keyFeatures: [
      '32 distinct institutional roles from Super Administrator down to Guest',
      'Granular permission assignment (create, edit, approve, publish, revoke, audit)',
      'Campus-level and department-level data segregation',
      'Multi-tiered approval workflows (HOD -> Dean -> Registrar -> Principal)',
      'Two-Factor Authentication (2FA) via SMS OTP and Authenticator apps',
      'Audit logging on every sensitive action with IP, user-agent, and before/after diffs'
    ],
    deliverables: ['RBAC Permission Matrix', 'Audit Trail Inspector', 'Account Provisioning Engine', '2FA Middleware'],
    complianceStandards: ['NIST 800-53', 'ISO 27701 Privacy', 'TVETA Governance'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Super Admin', 'Registrar', 'Department Heads']
  },
  {
    id: 3,
    code: 'SEC-03',
    part: 'Part A: Platform Foundation',
    category: 'Public Presence & CMS',
    title: 'Public College Website & Content Management System',
    description: 'High-conversion, accessible institutional portal featuring course discovery, online applications, student portal guide, news publishing, and resources.',
    operationalScope: 'Public web visitors, prospective applicants, parents, alumni, and employers.',
    keyFeatures: [
      'Full modern responsive website in HI-TECH Navy (#153B70) and College Red (#D92332)',
      'Rich Course Catalogue with TVETA qualification levels (Diploma, Certificate, Artisan, Professional)',
      'Working online application wizard generating instant tracking references (HCA/APP/2026/...)',
      'Student Portal Walkthrough & Access Guide explaining login credentials and reg number issuance',
      'Institutional news, events calendar, campus tour gallery, and verified leadership directory',
      'Download Centre for application forms, fee structures, student bylaws, and TVETA charters'
    ],
    deliverables: ['Responsive Web Portal', 'Course Explorer', 'Application Gateway', 'Portal Access Guide'],
    complianceStandards: ['WCAG 2.1 AA Accessibility', 'TVETA Public Disclosure Mandates'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Public', 'Prospective Students', 'Parents', 'Accreditation Auditors']
  },

  // PART B: INSTITUTIONAL ADMINISTRATION
  {
    id: 4,
    code: 'SEC-04',
    part: 'Part B: Institutional Administration',
    category: 'Governance',
    title: 'Institutional Governance, Policies & Board Management',
    description: 'Administrative suite for managing college governance charters, Board of Directors resolutions, executive committees, and college regulations.',
    operationalScope: 'Board of Governors, Principal, Deputy Principals, and College Secretary.',
    keyFeatures: [
      'Board meeting minutes repository with tamper-evident digital signatures',
      'Policy document versioning and mandatory staff acknowledgement tracking',
      'College calendar and strategic plan milestone tracking',
      'Institutional risk register and incident escalation matrix'
    ],
    deliverables: ['Board Portal', 'Policy Repository', 'Meeting Manager', 'Risk Register'],
    complianceStandards: ['TVET Act No. 29 of 2013', 'State Corporations Governance Code'],
    status: 'IMPLEMENTED',
    targetAudience: ['Board of Governors', 'Principal', 'Registrar']
  },
  {
    id: 5,
    code: 'SEC-05',
    part: 'Part B: Institutional Administration',
    category: 'Campus Management',
    title: 'Multi-Campus & Satellite Branch Administration',
    description: 'Centralized administration across multiple campuses (Nairobi Main, Westlands AI Hub, Eldoret Campus, Mombasa Campus) with unified records.',
    operationalScope: 'All regional campuses, branch directors, and central administration.',
    keyFeatures: [
      'Unified student database with campus allocation tags: HCA/CAMP/2026/...',
      'Independent fee billing and banking accounts per campus with central aggregation',
      'Cross-campus facility utilization and inter-campus student transfer workflows',
      'Campus Director executive oversight dashboard'
    ],
    deliverables: ['Campus Manager', 'Inter-Campus Transfer System', 'Regional Analytics'],
    complianceStandards: ['TVETA Satellite Campus Licensing Rules'],
    status: 'IMPLEMENTED',
    targetAudience: ['Campus Directors', 'Principal', 'Finance Manager']
  },
  {
    id: 6,
    code: 'SEC-06',
    part: 'Part B: Institutional Administration',
    category: 'Academic Structure',
    title: 'Academic Departments, Faculties & Centres of Excellence',
    description: 'Hierarchy of Schools, Departments, and Specialized Innovation Hubs (School of Computing, Electrical Engineering, Business & Management, Health Sciences).',
    operationalScope: 'Deans, Heads of Departments (HODs), and Academic Committees.',
    keyFeatures: [
      'Organizational chart with automatic reporting line enforcement',
      'HOD assignment, faculty allocation, and departmental resource tracking',
      'Departmental budget allocation and expenditure reconciliation',
      'Academic Senate committee roster and resolution tracking'
    ],
    deliverables: ['Departmental Management Suite', 'Faculty Roster', 'Org Hierarchy Chart'],
    complianceStandards: ['KNQA National Qualifications Framework'],
    status: 'IMPLEMENTED',
    targetAudience: ['Academic Deans', 'HODs', 'Registrar']
  },
  {
    id: 7,
    code: 'SEC-07',
    part: 'Part B: Institutional Administration',
    category: 'System Configuration',
    title: 'Global Settings, Academic Calendars & Intakes',
    description: 'System-wide configuration for academic years, tri-semester calendars, intake periods (January, May, September), and institutional operating rules.',
    operationalScope: 'Registrar, ICT Administrator, and Academic Planning.',
    keyFeatures: [
      'Academic Year & Semester lifecycle management (Opening, Add/Drop, Exams, Recess)',
      'Intake campaign configuration with automated application deadlines',
      'Grading schema setup (Standard TVETA, KNEC, CDACC CBET scales)',
      'System-wide announcement broadcasting via SMS, email, and portal banners'
    ],
    deliverables: ['Calendar Engine', 'Intake Scheduler', 'Grading Schema Configurator'],
    complianceStandards: ['TVETA Academic Calendar Regulations'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Registrar', 'Academic Dean', 'Super Admin']
  },

  // PART C: ADMISSIONS & STUDENT SIS
  {
    id: 8,
    code: 'SEC-08',
    part: 'Part C: Admissions & SIS',
    category: 'Admissions',
    title: 'Online Admissions & Multi-Channel Application Processing',
    description: 'End-to-end prospective student admission portal supporting online self-service, walk-in agent entry, and bulk KUCCPS government placement ingestion.',
    operationalScope: 'Admissions Office, Customer Service, and Prospective Students.',
    keyFeatures: [
      'Self-service 4-step application form with KCSE index / national ID validation',
      'Automated application reference generation: HCA/APP/2026/001',
      'Application fee payment verification via M-Pesa STK push',
      'Document upload engine (KCSE Result Slip, ID/Birth Certificate, Passport Photo)',
      'SMS notification on application submission with tracking code'
    ],
    deliverables: ['Admissions Portal (Module 24)', 'Application Wizard', 'M-Pesa Verification'],
    complianceStandards: ['KUCCPS Integration Guidelines', 'TVETA Admission Criteria'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Admissions Officers', 'Applicants', 'Marketing Team']
  },
  {
    id: 9,
    code: 'SEC-09',
    part: 'Part C: Admissions & SIS',
    category: 'Admissions',
    title: 'Applicant Verification, Scoring & Offer Letters',
    description: 'Automated qualification assessment against programme prerequisites and generation of verifiable PDF admission offer letters.',
    operationalScope: 'Admissions Board, Registrar, and Applicants.',
    keyFeatures: [
      'Automated eligibility scoring based on KCSE cluster points and subject minimums',
      'Official Admission Offer Letter generation with digital seal and QR validation',
      'Offer status tracking: Submitted -> Under Review -> Offer Made -> Accepted -> Enrolled',
      'Applicant communication center for requesting missing documents or interviews'
    ],
    deliverables: ['Offer Letter Generator', 'Eligibility Scoring Engine', 'Applicant CRM'],
    complianceStandards: ['KNEC Minimum Entry Criteria', 'CDACC Entry Requirements'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Registrar', 'Admissions Board', 'Candidates']
  },
  {
    id: 10,
    code: 'SEC-10',
    part: 'Part C: Admissions & SIS',
    category: 'Onboarding',
    title: 'Student Onboarding, Fee Commitment & Document Lodgement',
    description: 'Digital student onboarding workflow converting accepted applicants into fully matriculated students upon registration fee commitment.',
    operationalScope: 'Admissions, Finance, Dean of Students, and New Students.',
    keyFeatures: [
      'Digital student declaration, rules acceptance, and medical history lodgement',
      'Minimum fee commitment verification before registration number activation',
      'Automated portal activation credential delivery via SMS and secure email token',
      'Virtual Orientation & Student Handbook download gate'
    ],
    deliverables: ['Onboarding Flow', 'Matriculation Gateway', 'Credential Dispatcher'],
    complianceStandards: ['Kenya Consumer Protection Laws', 'Institutional Statutes'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['New Students', 'Registrar', 'Finance Cashier']
  },
  {
    id: 11,
    code: 'SEC-11',
    part: 'Part C: Admissions & SIS',
    category: 'Student Information System',
    title: 'Central Student Information System (SIS) & Atomic Reg No Suite',
    description: 'The core student records engine of HI-TECH College with atomic registration number generation: HCA/STU/2026/001.',
    operationalScope: 'Registrar, Academic Deans, Lecturers, and Students.',
    keyFeatures: [
      'Master student profile: Personal info, Guardian contacts, Bio data, Next of Kin',
      'Central Atomic Registration Generator maintaining strict concurrency-safe sequences',
      'Academic history: Enrolled programmes, semesters completed, GPA, and graduation status',
      'Barcode and QR-enabled Digital Student ID card generation',
      'Audit log of all profile modifications and status alterations'
    ],
    deliverables: ['Central Registration Generator', 'Student Master Record', 'Digital ID Engine'],
    complianceStandards: ['KNQA National Learner Database Specifications', 'TVETA SIS Guidelines'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Registrar', 'All Staff', 'Students']
  },
  {
    id: 12,
    code: 'SEC-12',
    part: 'Part C: Admissions & SIS',
    category: 'Student Records',
    title: 'Student Status Management, Deferrals & Clearances',
    description: 'Lifecycle tracking for active, suspended, deferred, graduated, or discontinued students with automated 5-department digital clearance.',
    operationalScope: 'Registrar, Dean of Students, Finance, Library, and Students.',
    keyFeatures: [
      'Online course deferral and academic leave application workflow',
      'Inter-programme course transfer evaluation and credit transfers',
      '5-Department Digital Clearance: Library, Finance, Department, Hostel, Registrar',
      'Automated alumni archive transfer upon graduation'
    ],
    deliverables: ['Digital Clearance Module', 'Deferral Workflow', 'Alumni Transition Engine'],
    complianceStandards: ['Institutional By-Laws', 'TVETA Student Records Retention Rules'],
    status: 'IMPLEMENTED',
    targetAudience: ['Registrar', 'HODs', 'Graduating Students']
  },

  // PART D: ACADEMIC MANAGEMENT & LMS
  {
    id: 13,
    code: 'SEC-13',
    part: 'Part D: Academic Management & LMS',
    category: 'Curriculum',
    title: 'Academic Programmes, Curriculum & Syllabus Repository',
    description: 'Comprehensive curriculum database supporting KNEC, CDACC CBET, KASNEB, NITA, and college internal diplomas and certificates.',
    operationalScope: 'Academic Dean, Curriculum Committee, Lecturers, and Students.',
    keyFeatures: [
      'Structured curriculum tree: Programme -> Level -> Year -> Semester -> Units',
      'Credit hour calculation, prerequisites, and co-requisite unit rules',
      'CDACC Competency Units with occupational standards and performance criteria',
      'Syllabus PDF repository and download manager for accredited programmes'
    ],
    deliverables: ['Curriculum Manager', 'Prerequisites Validator', 'Syllabus Archive'],
    complianceStandards: ['CDACC CBET Framework', 'KNEC Syllabi Guidelines', 'TVETA Curriculum Approval'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Academic Dean', 'Lecturers', 'Students']
  },
  {
    id: 14,
    code: 'SEC-14',
    part: 'Part D: Academic Management & LMS',
    category: 'Course Registration',
    title: 'Unit Registration, Add/Drop & Prerequisite Enforcement',
    description: 'Student self-service unit registration engine with automated prerequisite validation, credit limits, and fee balance registration rules.',
    operationalScope: 'Students, Academic Advisors, and HODs.',
    keyFeatures: [
      'Online unit selection with real-time prerequisite verification',
      'Enrolment capacity limits per unit offering with waitlist handling',
      'Finance fee threshold check (e.g. 50% tuition required for registration)',
      'Add/Drop window countdown and approval audit log'
    ],
    deliverables: ['Unit Registration Interface', 'Prerequisite Engine', 'Capacity Enforcer'],
    complianceStandards: ['University & TVET Credit Transfer Rules'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Students', 'Academic Advisors', 'Registrar']
  },
  {
    id: 15,
    code: 'SEC-15',
    part: 'Part D: Academic Management & LMS',
    category: 'Timetable',
    title: 'Timetable Engine, Room Allocation & Clash Detection',
    description: 'Intelligent scheduling algorithm allocating lecture halls, computer labs, engineering workshops, and lecturers without time or space conflicts.',
    operationalScope: 'Timetabling Committee, Lecturers, and Students.',
    keyFeatures: [
      'Automated conflict detection: Lecturer clashing, Room overbooking, Student stream overlap',
      'Specialized lab allocation: Cyber Lab 1A, Robotics Lab, Networking Sandbox, Cisco Lab',
      'Interactive visual grid timetable view by student, lecturer, room, or department',
      'Real-time timetable change alerts broadcast via SMS and in-portal notifications'
    ],
    deliverables: ['Interactive Timetable Grid', 'Clash Detection Engine', 'Room Scheduler'],
    complianceStandards: ['TVETA Facility & Lab Ratio Standards'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Faculty', 'Students', 'Timetable Coordinators']
  },
  {
    id: 16,
    code: 'SEC-16',
    part: 'Part D: Academic Management & LMS',
    category: 'Faculty Management',
    title: 'Faculty Workload, Teaching Roster & Attendance Register',
    description: 'Lecturer portal (Module 18) managing faculty teaching assignments, contact hours, lecture attendance registers, and student roll calls.',
    operationalScope: 'Lecturers, Trainers, HODs, and Academic Dean.',
    keyFeatures: [
      'Weekly teaching roster with room assignment and student enrolment lists',
      'Digital attendance sheet with one-click present/absent/late marking',
      'Automated calculation of student attendance percentage (e.g. 75% exam threshold)',
      'Teaching load calculation (Full-time vs Part-time adjunct hours)'
    ],
    deliverables: ['Lecturer Portal (Module 18)', 'Digital Roll Call', 'Attendance Threshold Alert'],
    complianceStandards: ['CUE / TVETA Faculty Workload Norms'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Lecturers', 'HODs', 'Students']
  },
  {
    id: 17,
    code: 'SEC-17',
    part: 'Part D: Academic Management & LMS',
    category: 'E-Learning & LMS',
    title: 'LMS Virtual Classrooms, Video Lectures & Resource Delivery',
    description: 'Integrated digital learning environment with module lecture notes, video lectures, live interactive links (Google Meet / Zoom), and forums.',
    operationalScope: 'Lecturers, Online Students, Blended Learning Coordinators.',
    keyFeatures: [
      'Weekly topic-by-topic course outline with embedded multimedia content',
      'Integrated virtual classroom links with scheduled calendar reminders',
      'Student download tracking and resource access analytics',
      'Discussion forums and peer-to-peer collaborative problem sets'
    ],
    deliverables: ['LMS Course View', 'Resource Dispatcher', 'Virtual Classroom Hub'],
    complianceStandards: ['OpenID Connect / LTI 1.3 Compatible', 'TVETA Blended Learning Rules'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Students', 'Lecturers', 'E-Learning Directorate']
  },
  {
    id: 18,
    code: 'SEC-18',
    part: 'Part D: Academic Management & LMS',
    category: 'Assignments',
    title: 'Digital Lesson Planning, Syllabi & Assignment Dropboxes',
    description: 'Continuous assessment workflow with assignment dropboxes, deadline countdowns, plagiarism prevention metadata, and rubric grading.',
    operationalScope: 'Lecturers, Students, and External Assessors.',
    keyFeatures: [
      'Submission portal supporting PDF, code files, zip archives, and documents',
      'Automated late submission penalty rules and grace period controls',
      'In-browser grading interface with rubric scoring and inline feedback notes',
      'Direct grade synchronization into the central assessment database'
    ],
    deliverables: ['Assignment Dropbox', 'Rubric Grading Matrix', 'Feedback Suite'],
    complianceStandards: ['CDACC Continuous Assessment Requirements'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Lecturers', 'Students']
  },

  // PART E: EXAMINATIONS & CBT ENGINE
  {
    id: 19,
    code: 'SEC-19',
    part: 'Part E: Examinations & CBT',
    category: 'Examinations',
    title: 'Examination Management & External Awarding Bodies',
    description: 'Unified management for internal Continuous Assessment Tests (CATs), End of Term exams, and external bodies (KNEC, CDACC, KASNEB, NITA).',
    operationalScope: 'Examination Directorate, Invigilators, and Candidates.',
    keyFeatures: [
      'Comprehensive exam registration and candidate index code allocation: HCA/EXAM/2026/...',
      'Automated examination timetable generator with seat allocation and hall tickets',
      'External examination registration data export formatted for KNEC / CDACC portals',
      'Exam card generation with photo, barcode, and fee clearance verification'
    ],
    deliverables: ['Examination Portal (Module 23)', 'Hall Ticket Generator', 'Candidate Index Register'],
    complianceStandards: ['KNEC Examination Regulations', 'CDACC Assessment Guidelines'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Examination Officer', 'Invigilators', 'Candidates']
  },
  {
    id: 20,
    code: 'SEC-20',
    part: 'Part E: Examinations & CBT',
    category: 'Assessment Engine',
    title: '63 Question Types Registry & Question Bank Matrix',
    description: 'Comprehensive registry of 63 computerized question types spanning Objective, Interactive, Coding, SQL, Practical Office, and STEM questions.',
    operationalScope: 'Faculty examiners, Question Bank moderators, and Assessment designers.',
    keyFeatures: [
      'Complete 63 question types covering all cognitive domains (Bloom taxonomy Levels 1–6)',
      'Automated marking algorithms for 48+ auto-scoreable formats',
      'Question Bank with difficulty tags, topic tagging, and randomized delivery',
      'Version-controlled question authoring with peer moderation approval workflow'
    ],
    deliverables: ['63 Question Types Registry (in Module 23)', 'Question Bank Authoring Tool', 'Bloom Taxonomy Matrix'],
    complianceStandards: ['TVETA CBT Assessment Benchmarks', 'QTI 2.2 Specification'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Faculty Examiners', 'Examination Officers']
  },
  {
    id: 21,
    code: 'SEC-21',
    part: 'Part E: Examinations & CBT',
    category: 'CBT Engine',
    title: 'Online Computer-Based Testing (CBT) & Assessment Sandbox',
    description: 'High-concurrency online CBT test runner with countdown timer, question palette, real-time autosave, and instant auto-grading.',
    operationalScope: 'Students sitting CATs and online theory / practical examinations.',
    keyFeatures: [
      'Real-time timer with autosave to prevent data loss on network disruption',
      'Interactive Question Navigator (Answered, Unanswered, Marked for Review)',
      'Instant result calculation for objective components upon submission with confetti celebrations',
      'Support for randomized question order and randomized option choices per candidate'
    ],
    deliverables: ['Interactive CBT Test Runner', 'Autosave Sync Engine', 'Candidate Navigator'],
    complianceStandards: ['Kenyan High-Stakes CBT Security Standards'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Students', 'Examination Invigilators']
  },
  {
    id: 22,
    code: 'SEC-22',
    part: 'Part E: Examinations & CBT',
    category: 'Practical Assessments',
    title: 'Hands-On Software & Practical Lab Assessment Sandbox',
    description: 'Interactive execution sandboxes for coding tests (Python, JS), live SQL database queries, Terminal commands, and spreadsheet simulations.',
    operationalScope: 'Computing, Engineering, and Business data analytics students.',
    keyFeatures: [
      'Interactive code editor with live syntax highlighting and instant compilation output',
      'SQL Query sandbox evaluating relational statements against in-memory schemas',
      'Terminal/Bash command prompt simulation for system administration testing',
      'Spreadsheet formula practical evaluator (ICDL / Advanced Excel)'
    ],
    deliverables: ['Code Execution Sandbox', 'SQL Evaluator', 'Terminal Simulator'],
    complianceStandards: ['NITA / ICDL Practical Standards', 'CDACC Practical Performance Criteria'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['IT/CS Students', 'Technical Trainers']
  },
  {
    id: 23,
    code: 'SEC-23',
    part: 'Part E: Examinations & CBT',
    category: 'Exam Security',
    title: 'Anti-Cheating, Proctoring & Candidate Verification',
    description: 'Secure testing protocols including browser focus lockdown, tab-switch detection, biometric verification, and session watermarking.',
    operationalScope: 'Chief Invigilators, Quality Assurance, and Candidates.',
    keyFeatures: [
      'Browser focus monitoring alerting on alt-tab or unauthorized window switching',
      'Copy-paste and right-click disablement during active testing windows',
      'Candidate photo identity verification against central SIS photo repository',
      'Real-time invigilator dashboard showing active candidate connection statuses'
    ],
    deliverables: ['Security Monitor', 'Candidate Verification Engine', 'Invigilator Console'],
    complianceStandards: ['ISO 23988 Computer-Based Assessment Security'],
    status: 'IMPLEMENTED',
    targetAudience: ['Invigilators', 'Examination Officer']
  },
  {
    id: 24,
    code: 'SEC-24',
    part: 'Part E: Examinations & CBT',
    category: 'Grading',
    title: 'Marking, Moderation & Multi-Tier Grading Engine',
    description: 'Institutional marks compilation combining CATs (30% or 40%) with Final Exams (70% or 60%), with moderation by External Examiners.',
    operationalScope: 'Lecturers, Internal Moderators, External Examiners, and Deans.',
    keyFeatures: [
      'Configurable assessment weighting (e.g. CAT 1: 15%, CAT 2: 15%, Final: 70%)',
      'Standard grading scale: A (70-100), B (60-69), C (50-59), D (40-49), E/Fail (<40)',
      'Departmental and External Examiner moderation workflow with mark adjustments audit',
      'Missing marks tracker and supplementary exam eligibility determination'
    ],
    deliverables: ['Mark Entry Sheets', 'Moderation Console', 'Supplementary Exam Scheduler'],
    complianceStandards: ['TVETA Assessment Standards', 'KNEC Grading Standards'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Lecturers', 'HODs', 'Examination Board']
  },
  {
    id: 25,
    code: 'SEC-25',
    part: 'Part E: Examinations & CBT',
    category: 'Results',
    title: 'Results Compilation, Senate Approvals & Publication',
    description: 'Official academic board results approval workflow, GPA / CGPA computation, and controlled online results release to student portals.',
    operationalScope: 'Academic Senate, Registrar, and Students.',
    keyFeatures: [
      'Automated Semester GPA and Cumulative Grade Point Average (CGPA) computation',
      'Academic status determination (Pass, Resit, Supplementary, Repeat, Discontinued)',
      'Formal Senate Approval sign-off with batch release locking',
      'Instant result viewing in Student Portal with PDF download protection'
    ],
    deliverables: ['Senate Result Matrix', 'GPA/CGPA Calculation Service', 'Controlled Release Switch'],
    complianceStandards: ['KNQA Academic Progression Rules'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Senate Board', 'Registrar', 'Students']
  },
  {
    id: 26,
    code: 'SEC-26',
    part: 'Part E: Examinations & CBT',
    category: 'Transcripts & Certification',
    title: 'Official Academic Transcripts (TRX) & Verifiable Credentials',
    description: 'Registrar portal (Module 19) issuing tamper-evident transcripts with verification codes (VRF-HCA-...) and QR-verifiable certificates.',
    operationalScope: 'Registrar, Graduating Students, Employers, and Verification Bodies.',
    keyFeatures: [
      'Official Transcript generation with institutional crest, security watermark, and grading key',
      'Cryptographic verification code: VRF-HCA-XXXXX-2026 for instant online credential verification',
      'Central transcript issuance register logging every printed and downloaded copy',
      'Digital Certificate generation: HCA/CERT/2026/001 with QR-linked public validation endpoint'
    ],
    deliverables: ['Registrar Portal (Module 19)', 'Verifiable Transcript Generator', 'Public QR Validator'],
    complianceStandards: ['KNQA Kenya National Qualifications Register Standards', 'TVETA Certification Norms'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Registrar', 'Graduates', 'Prospective Employers']
  },

  // PART F: FINANCE & ACCOUNTS
  {
    id: 27,
    code: 'SEC-27',
    part: 'Part F: Finance & Accounts',
    category: 'Fee Management',
    title: 'Fee Structures, Invoicing & Billing Engine',
    description: 'Automated semester fee billing engine with customizable fee items (Tuition, Lab Fee, Activity, Exam Fee, Medical) per programme and level.',
    operationalScope: 'Finance Director, Accountants, and Students.',
    keyFeatures: [
      'Configurable fee structures by programme level (Degree, Diploma, Certificate, Artisan)',
      'Automated semester invoice generation linked to student accounts upon registration',
      'Instalment plan configuration with minimum thresholds and due date reminders',
      'Debit/Credit adjustments with mandatory administrative justification and audit log'
    ],
    deliverables: ['Finance Portal (Module 20)', 'Fee Structure Builder', 'Automated Invoicing Engine'],
    complianceStandards: ['International Financial Reporting Standards (IFRS)', 'Public Finance Management Act'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Finance Manager', 'Accountants', 'Students']
  },
  {
    id: 28,
    code: 'SEC-28',
    part: 'Part F: Finance & Accounts',
    category: 'M-Pesa & Payments',
    title: 'M-Pesa Daraja Integration & Instant STK Push Receipts',
    description: 'Direct Safaricom Daraja API integration delivering instant STK push prompts to student phones and generating official receipts (RCT-2026-...).',
    operationalScope: 'Students, Guardians, Finance Cashiers, and Bank Reconcilers.',
    keyFeatures: [
      'One-click M-Pesa STK push trigger directly updating student fee balances in real time',
      'Instant official receipt generation: RCT-2026-0001 with M-Pesa reference and QR seal',
      'Automated SMS payment confirmation with updated outstanding fee balance',
      'Paybill / Till Number transaction webhook listener with automatic matching to Reg Numbers'
    ],
    deliverables: ['Daraja STK Push Interface', 'Real-Time Fee Updating', 'Instant Receipt Generator'],
    complianceStandards: ['Central Bank of Kenya (CBK) National Payment System Regulations'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Finance Team', 'Students', 'Guardians']
  },
  {
    id: 29,
    code: 'SEC-29',
    part: 'Part F: Finance & Accounts',
    category: 'Banking & Reconciliation',
    title: 'Bank Reconciliations & Payment Gateways',
    description: 'Automated ingestion of bank statements (KCB, Equity, Co-op) and automated transaction matching against student fee accounts.',
    operationalScope: 'Accountants, Internal Auditors, and Chief Cashier.',
    keyFeatures: [
      'Bank statement CSV / Excel import with intelligent regex reference matching',
      'Manual reconciliation interface for unassigned or misreferenced payments',
      'Credit card & international payment gateway integration for diaspora students',
      'Daily cashier cash register settlement and end-of-day banking slips'
    ],
    deliverables: ['Bank Reconciliation Module', 'Statement Importer', 'Cashier Shift Closer'],
    complianceStandards: ['GAAP', 'IFRS for Academic Institutions'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Chief Accountant', 'Internal Auditor']
  },
  {
    id: 30,
    code: 'SEC-30',
    part: 'Part F: Finance & Accounts',
    category: 'Debt Management',
    title: 'Student Financial Ledgers & Fee Arrears Recovery',
    description: 'Real-time financial statement of account showing every debit and credit, with automated fee arrears notifications and exam barrier enforcement.',
    operationalScope: 'Finance Department, Dean of Students, and Debt Collection.',
    keyFeatures: [
      'Comprehensive student statement of account exportable to PDF and Excel',
      'Automated fee balance threshold rules blocking examination card issuance',
      'Scheduled SMS & email fee reminders with payment link',
      'Special scholarship and HELB / CDF bursary allocation ledger'
    ],
    deliverables: ['Student Financial Statement', 'Arrears Notification Engine', 'HELB/Bursary Ledger'],
    complianceStandards: ['Kenyan Fair Lending and Collection Guidelines'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Finance Officers', 'Students', 'Bursary Sponsors']
  },
  {
    id: 31,
    code: 'SEC-31',
    part: 'Part F: Finance & Accounts',
    category: 'General Ledger',
    title: 'Institutional General Ledger & Financial Statements',
    description: 'Double-entry general ledger, chart of accounts, accounts payable, accounts receivable, and automated financial statements.',
    operationalScope: 'Finance Director, Management Board, and External Auditors.',
    keyFeatures: [
      'Standard institutional Chart of Accounts customized for college operations',
      'Automated Trial Balance, Income Statement (P&L), and Balance Sheet generation',
      'Departmental expenditure tracking against allocated annual budget',
      'Audit-ready export packs for Kenya National Audit Office / External Auditors'
    ],
    deliverables: ['General Ledger System', 'Financial Reporting Suite', 'Budget Controller'],
    complianceStandards: ['IFRS 15 / IFRS 16', 'Kenyan Public Audit Framework'],
    status: 'IMPLEMENTED',
    targetAudience: ['Finance Director', 'Principal', 'External Auditors']
  },

  // PART G: HUMAN RESOURCES & PAYROLL
  {
    id: 32,
    code: 'SEC-32',
    part: 'Part G: HR & Payroll',
    category: 'Staff Records',
    title: 'Staff Records & Academic Credentials Management',
    description: 'Central employee directory (HCA/STAFF/2026/001) managing teaching faculty, administrative staff, qualifications, and employment contracts.',
    operationalScope: 'HR Manager, Principal, and All Employees.',
    keyFeatures: [
      'Staff registration with atomic numbers: HCA/STAFF/2026/001',
      'Academic qualifications repository with TVETA trainer license verification',
      'Contract lifecycle tracking (Permanent, Contract, Adjunct/Part-Time)',
      'Staff performance appraisal metrics and student evaluation feedback'
    ],
    deliverables: ['HR Staff Directory', 'Trainer Credential Register', 'Appraisal Module'],
    complianceStandards: ['TVETA Trainer Qualification Requirements', 'Employment Act 2007 (Kenya)'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['HR Director', 'College Principal', 'All Staff']
  },
  {
    id: 33,
    code: 'SEC-33',
    part: 'Part G: HR & Payroll',
    category: 'Attendance & Shifts',
    title: 'Attendance Tracking, Biometric Sync & Shift Scheduling',
    description: 'Staff clock-in/clock-out tracking, biometric fingerprint integration, and shift scheduling for security, lab technicians, and admin personnel.',
    operationalScope: 'HR Officers, Supervisors, and Employees.',
    keyFeatures: [
      'Biometric clock-in sync and geo-fenced mobile attendance check-in',
      'Overtime calculation based on institutional policy parameters',
      'Shift roster builder for 24/7 security, ICT lab assistants, and cleaners',
      'Monthly staff attendance summary fed directly into payroll deductions'
    ],
    deliverables: ['Biometric Sync Service', 'Staff Roster Builder', 'Attendance Summary'],
    complianceStandards: ['Kenya Occupational Safety and Health Act (OSHA)'],
    status: 'IMPLEMENTED',
    targetAudience: ['HR Officers', 'Supervisors']
  },
  {
    id: 34,
    code: 'SEC-34',
    part: 'Part G: HR & Payroll',
    category: 'Leave Management',
    title: 'Leave Management & Multi-Tier Approval Hierarchies',
    description: 'Self-service leave portal for annual, sick, maternity, study, and compassionate leave with automated balance deduction.',
    operationalScope: 'All Employees, Supervisors, and HR Department.',
    keyFeatures: [
      'Online leave request with automated calculation of working days vs public holidays',
      'Multi-level approval workflow: Supervisor -> HOD -> HR Director -> Principal',
      'Real-time leave balance ledger updated upon approval',
      'Delegation of duty assignment during leave absence'
    ],
    deliverables: ['Leave Self-Service Portal', 'Approval Hierarchy Engine', 'Leave Calendar'],
    complianceStandards: ['Employment Act 2007 (Leave Provisions)'],
    status: 'IMPLEMENTED',
    targetAudience: ['All Staff', 'HR Manager']
  },
  {
    id: 35,
    code: 'SEC-35',
    part: 'Part G: HR & Payroll',
    category: 'Kenyan Payroll Engine',
    title: 'Kenyan Statutory Payroll Engine (SHIF, NSSF, Housing Levy, PAYE)',
    description: 'Fully compliant automated Kenyan payroll processing statutory deductions (SHIF, NSSF Tier 1 & 2, Affordable Housing Levy 1.5%, PAYE) and payslips.',
    operationalScope: 'HR Director, Finance Director, Payroll Accountants, and Staff.',
    keyFeatures: [
      'Current 2026 Kenyan Tax Bands calculation (KRA PAYE with Personal Relief)',
      'Social Health Insurance Fund (SHIF 2.75%) automated deduction',
      'NSSF Act 2013 compliant Tier 1 and Tier 2 pension calculations',
      'Affordable Housing Levy (1.5% employee + 1.5% employer)',
      'Encrypted PDF payslip delivery with password protection to staff portal and email',
      'KRA P9 form generator for annual tax return filing'
    ],
    deliverables: ['Statutory Payroll Engine', 'Password-Protected Payslip Generator', 'KRA P9 Tax Generator'],
    complianceStandards: ['KRA Tax Acts', 'SHIF Regulations 2024', 'NSSF Act 2013', 'Finance Act 2023/2024'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Payroll Accountant', 'Finance Director', 'All Employees']
  },

  // PART H: STUDENT WELFARE & COMMUNITY PORTALS
  {
    id: 36,
    code: 'SEC-36',
    part: 'Part H: Student Welfare & Community',
    category: 'Student Portal',
    title: 'Student Portal Self-Service Suite (HCA/STU/...)',
    description: 'Dedicated student portal powering unit registration, timetable viewing, results checking, fee payment, and digital ID access.',
    operationalScope: 'All enrolled HI-TECH College students across all campuses.',
    keyFeatures: [
      'Personalized student dashboard with attendance stats, GPA, and unit roster',
      'Timetable and exam schedule viewer with real-time class room directions',
      'Fee statement inspection and instant M-Pesa tuition top-up',
      'Exam hall ticket download and official transcript application'
    ],
    deliverables: ['Student Dashboard (Active Module)', 'Fee Statement View', 'Timetable Viewer'],
    complianceStandards: ['TVETA Student Welfare Charter'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Students', 'Student Union']
  },
  {
    id: 37,
    code: 'SEC-37',
    part: 'Part H: Student Welfare & Community',
    category: 'Parent Portal',
    title: 'Parent & Guardian Portal with Permission Scopes',
    description: 'Secure guardian portal linked via HCA/PARENT/2026/... providing student-authorized oversight of fee balances, attendance, and released results.',
    operationalScope: 'Parents, Sponsors, and Guardians.',
    keyFeatures: [
      'Student-controlled permission scopes (Fees Only, Fees & Attendance, Full Academic)',
      'Direct fee payment on behalf of student via M-Pesa or bank transfer',
      'Official academic report card and semester progress download',
      'Direct communication channel with Dean of Students and Finance Office'
    ],
    deliverables: ['Parent Portal Suite', 'Permission Scope Enforcer', 'Direct Payment Channel'],
    complianceStandards: ['Kenya Data Protection Act (Consent for Adult Learners)'],
    status: 'IMPLEMENTED',
    targetAudience: ['Parents', 'Guardians', 'Sponsors']
  },
  {
    id: 38,
    code: 'SEC-38',
    part: 'Part H: Student Welfare & Community',
    category: 'Welfare & Support',
    title: 'Student Welfare, Counselling & Bursary Allocations',
    description: 'Comprehensive welfare suite for mental health appointments, confidential counselling, emergency medical notes, and bursary administration.',
    operationalScope: 'Dean of Students, College Counsellor, and Welfare Committee.',
    keyFeatures: [
      'Confidential booking for mental health and career guidance sessions',
      'Special needs accommodations registry (physical accessibility, exam extra time)',
      'Institutional emergency bursary application and committee scoring',
      'Student disciplinary committee records and rehabilitation workflows'
    ],
    deliverables: ['Welfare Management Portal', 'Counselling Booking System', 'Bursary Allocator'],
    complianceStandards: ['Kenyan National Mental Health Policy', 'Disability Act Guidelines'],
    status: 'IMPLEMENTED',
    targetAudience: ['Dean of Students', 'College Counsellor', 'Students']
  },
  {
    id: 39,
    code: 'SEC-39',
    part: 'Part H: Student Welfare & Community',
    category: 'Accommodations',
    title: 'Hostel & Accommodation Management (Rooms & Beds)',
    description: 'Digital hostel booking, room inventory, bed allocation, check-in inspections, and accommodation fee billing.',
    operationalScope: 'Hostel Wardens, Housekeeping, and Resident Students.',
    keyFeatures: [
      'Multi-hostel inventory: Hall of Residence, block, floor, room, and bed numbers',
      'Online room application and automated allocation based on fee payment status',
      'Digital check-in inventory (Keys, Mattress, Furniture condition inspection)',
      'Hostel visitor logging and curfew check-in register'
    ],
    deliverables: ['Hostel Management System', 'Room Allocation Engine', 'Inspection Checklists'],
    complianceStandards: ['TVETA Residential Health and Safety Standards'],
    status: 'IMPLEMENTED',
    targetAudience: ['Hostel Wardens', 'Housekeeping Staff', 'Boarding Students']
  },
  {
    id: 40,
    code: 'SEC-40',
    part: 'Part H: Student Welfare & Community',
    category: 'Clubs & Elections',
    title: 'Student Association, Clubs & Electronic Elections (Secret Ballot)',
    description: 'Student governance module supporting club registrations, event ticketing, and cryptographically secure online elections for student leaders.',
    operationalScope: 'Student Electoral Commission, Club Patrons, and Student Voters.',
    keyFeatures: [
      'Club registration, constitution storage, and annual budget allocation',
      'Electronic voting system for Student Council leaders with secret ballot encryption',
      'Real-time voter turnout tracking and tamper-proof tally publication',
      'Campus event ticketing and attendance scanning'
    ],
    deliverables: ['E-Voting Ballot Suite', 'Club Directory', 'Event Ticketer'],
    complianceStandards: ['Kenya Independent Electoral Process Best Practices'],
    status: 'IMPLEMENTED',
    targetAudience: ['Student Union', 'Electoral Commission', 'Students']
  },

  // PART I: LIBRARY & LEARNING RESOURCES
  {
    id: 41,
    code: 'SEC-41',
    part: 'Part I: Library & Resources',
    category: 'Physical Library',
    title: 'Physical Library Management, Dewey Decimal & Barcodes',
    description: 'Library portal (Module 22) handling physical book catalogue, Dewey Decimal classification, ISBN tracking, loans, returns, and overdue fines.',
    operationalScope: 'Chief Librarian, Library Assistants, and Patrons.',
    keyFeatures: [
      'Comprehensive physical catalog with Dewey Decimal, Author, Publisher, and Shelf location',
      'Fast barcode check-out and return scanner with instant loan record creation',
      'Automated fine calculation (e.g. KES 20/day) on overdue books with fee ledger sync',
      'Book reservation queue and automated notification when returned'
    ],
    deliverables: ['Library Portal (Module 22)', 'Circulation Desk Suite', 'Barcode Scanner Tool'],
    complianceStandards: ['Dewey Decimal Classification (DDC 23)', 'Library Congress Standards'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Librarians', 'Students', 'Faculty']
  },
  {
    id: 42,
    code: 'SEC-42',
    part: 'Part I: Library & Resources',
    category: 'Digital E-Library',
    title: 'Digital E-Library, Research Repository & Licensed Journals',
    description: 'E-Library repository offering digital textbooks, past examination papers, research journals, and Open Educational Resources (OER).',
    operationalScope: 'Librarians, Researchers, Faculty, and Students.',
    keyFeatures: [
      'Digital textbook PDF viewer with keyword search and bookmarking',
      'Past examination papers repository categorized by programme and year',
      'Integration with open-access repositories and institutional subscription databases',
      'Student download usage analytics and copyright compliance monitoring'
    ],
    deliverables: ['Digital E-Library Hub', 'Past Papers Search Engine', 'PDF Reader'],
    complianceStandards: ['Kenya Copyright Board (KECOBO) Regulations'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['Students', 'Faculty Researchers', 'Librarians']
  },

  // PART J: CERTIFICATION, CBET & QUALITY
  {
    id: 43,
    code: 'SEC-43',
    part: 'Part J: Certification & Quality',
    category: 'TVETA & Compliance',
    title: 'TVETA Compliance, Audits & Quality Assurance Standards',
    description: 'Dedicated quality assurance registry tracking compliance against TVETA standards, trainer certifications, curriculum audits, and corrective actions.',
    operationalScope: 'Quality Assurance Director, Academic Dean, and External TVETA Inspectors.',
    keyFeatures: [
      'TVETA institutional accreditation compliance checklist and license tracking',
      'Trainer TVETA licensing compliance monitoring and renewal alerts',
      'Course review audit cycles and institutional quality improvement plans',
      'Self-assessment report generator for TVETA quality inspection visits'
    ],
    deliverables: ['Quality Assurance Console', 'Audit Evidence Vault', 'TVETA Report Pack'],
    complianceStandards: ['TVETA Quality Assurance Manual', 'ISO 9001:2015 Educational Organizations'],
    status: 'IMPLEMENTED',
    targetAudience: ['Quality Assurance Director', 'Principal', 'TVETA Auditors']
  },
  {
    id: 44,
    code: 'SEC-44',
    part: 'Part J: Certification & Quality',
    category: 'CBET Framework',
    title: 'Competency-Based Education & Training (CBET) Portfolios',
    description: 'CDACC CBET assessment engine tracking occupational competencies, industrial attachment logbooks, portfolio of evidence, and assessor sign-offs.',
    operationalScope: 'CBET Assessors, Verifiers, Students, and Industry Mentors.',
    keyFeatures: [
      'Unit of Competency tracking: Performance criteria, underpinning knowledge, and practical skills',
      'Digital Industrial Attachment Logbook with GPS check-ins and mentor ratings',
      'Portfolio of Evidence (PoE) upload and internal/external verifier sign-offs',
      'CDACC candidate assessment summary sheets formatted for official submission'
    ],
    deliverables: ['CBET Competency Tracker', 'Digital Attachment Logbook', 'PoE Repository'],
    complianceStandards: ['TVET CDACC CBET Implementation Framework'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['CBET Assessors', 'Students on Attachment', 'Industry Mentors']
  },

  // PART K: COMMUNICATIONS & CUSTOMER CARE
  {
    id: 45,
    code: 'SEC-45',
    part: 'Part K: Communications',
    category: 'Messaging & Support',
    title: 'Central Communications Hub (SMS Gateway, WhatsApp & Helpdesk)',
    description: 'Institutional communications center integrating bulk SMS gateways (AfricasTalking), WhatsApp Business API, and IT helpdesk ticketing.',
    operationalScope: 'Public Relations, Student Services, IT Helpdesk, and Admissions.',
    keyFeatures: [
      'High-speed bulk SMS broadcasting filtered by campus, department, or intake',
      'Official WhatsApp notification templates for admissions, fee alerts, and results',
      'Customer support ticketing system with priority levels (Low, Medium, Urgent)',
      'Automated FAQ chatbot and campus enquiry dispatch'
    ],
    deliverables: ['Communications Hub', 'SMS Broadcast Center', 'Helpdesk Ticketing System'],
    complianceStandards: ['Communications Authority of Kenya (CA) SMS Regulations'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['PRO', 'IT Support', 'Students', 'Public']
  },

  // PART L: OPERATIONS, ICT & DISASTER RECOVERY
  {
    id: 46,
    code: 'SEC-46',
    part: 'Part L: Operations & ICT',
    category: 'Procurement & Assets',
    title: 'Procurement, Store Inventory & Fixed Asset Register',
    description: 'End-to-end procurement workflow from department requisition, LPO issuance, delivery inspection, to fixed asset barcode tagging.',
    operationalScope: 'Procurement Officer, Storekeeper, and Finance Director.',
    keyFeatures: [
      'Departmental purchase requisitions with multi-stage authorization workflow',
      'Local Purchase Order (LPO) generator and supplier quotation comparison matrix',
      'Store inventory tracking for stationery, lab consumables, and cleaning supplies',
      'Fixed asset register with QR/Barcode tagging, depreciation calculation, and location'
    ],
    deliverables: ['Procurement Suite', 'LPO Generator', 'Fixed Asset Register'],
    complianceStandards: ['Public Procurement and Asset Disposal Act (PPADA)'],
    status: 'IMPLEMENTED',
    targetAudience: ['Procurement Officer', 'Storekeeper', 'Auditors']
  },
  {
    id: 47,
    code: 'SEC-47',
    part: 'Part L: Operations & ICT',
    category: 'ICT & Disaster Recovery',
    title: 'ICT Infrastructure, Cybersecurity, Audit Logs & Backups',
    description: 'Comprehensive ICT operations console managing network hardware, cybersecurity audit logs, encrypted offsite backups, and disaster recovery.',
    operationalScope: 'Chief Information Officer, Network Administrators, and Security Engineers.',
    keyFeatures: [
      'Complete audit trail of all database mutations with timestamp and IP address',
      'Automated daily encrypted database backups with point-in-time recovery test suite',
      'Network lab device inventory, Wi-Fi access tokens, and server health monitoring',
      'Disaster recovery failover plan with guaranteed Recovery Time Objective (RTO < 2 hrs)'
    ],
    deliverables: ['ICT Console', 'Automated Backup Pipeline', 'Disaster Recovery Manual'],
    complianceStandards: ['Kenya Cyber Security & Critical Infrastructure Framework', 'ISO 27001'],
    status: 'ACTIVE_PORTAL',
    targetAudience: ['CIO', 'ICT Admin', 'Security Auditor']
  }
];

export const QUESTION_TYPES_63_COMPLETE: QuestionTypeItem[] = [
  // Objective & Auto-Scored (1-10)
  { id: 1, code: 'QT-01', name: 'Single-Choice Multiple Choice (MCQ)', category: 'Objective', autoMarkable: true, description: 'Single correct answer from 4-5 options with randomized distractors.', gradingMechanism: 'Exact match key comparison', sandboxSupported: false },
  { id: 2, code: 'QT-02', name: 'Multiple-Response Checkbox', category: 'Objective', autoMarkable: true, description: 'Select all matching true statements with optional negative marking.', gradingMechanism: 'Partial credit with penalty algorithm', sandboxSupported: false },
  { id: 3, code: 'QT-03', name: 'True / False / Cannot Determine', category: 'Objective', autoMarkable: true, description: '3-tier binary assertion evaluation testing critical reading.', gradingMechanism: 'Binary exact match', sandboxSupported: false },
  { id: 4, code: 'QT-04', name: 'Fill-in-the-Blank (Exact match)', category: 'Objective', autoMarkable: true, description: 'Exact string matching with case sensitivity controls.', gradingMechanism: 'String normalization comparison', sandboxSupported: false },
  { id: 5, code: 'QT-05', name: 'Fill-in-the-Blank (Fuzzy / Synonym match)', category: 'Objective', autoMarkable: true, description: 'Levenshtein distance matching with accepted synonyms list.', gradingMechanism: 'Fuzzy regex / Levenshtein distance <= 2', sandboxSupported: false },
  { id: 6, code: 'QT-06', name: 'Dropdown Cloze Passage', category: 'Objective', autoMarkable: true, description: 'Inline dropdown selectors embedded directly within paragraph text.', gradingMechanism: 'Per-dropdown key array', sandboxSupported: false },
  { id: 7, code: 'QT-07', name: 'Column Matching Pairs', category: 'Interactive', autoMarkable: true, description: 'Link definitions in Column A with corresponding concepts in Column B.', gradingMechanism: 'Key-value map match', sandboxSupported: false },
  { id: 8, code: 'QT-08', name: 'Drag-and-Drop Sequence Order', category: 'Interactive', autoMarkable: true, description: 'Arrange algorithmic steps or historical events in chronological order.', gradingMechanism: 'Sequence permutation comparison', sandboxSupported: false },
  { id: 9, code: 'QT-09', name: 'Matrix Table Evaluation', category: 'Interactive', autoMarkable: true, description: 'Grid of items evaluated across multiple criteria columns.', gradingMechanism: '2D matrix boolean check', sandboxSupported: false },
  { id: 10, code: 'QT-10', name: 'Ranked Priority Order', category: 'Interactive', autoMarkable: true, description: 'Rank items 1 through N based on institutional governance importance.', gradingMechanism: 'Spearman rank correlation or exact sequence', sandboxSupported: false },

  // Visual & Interactive (11-20)
  { id: 11, code: 'QT-11', name: 'Image Hotspot Pinpoint', category: 'Interactive', autoMarkable: true, description: 'Click coordinates on circuit diagrams, anatomy charts, or motherboards.', gradingMechanism: 'Bounding box (x1,y1,x2,y2) coordinate check', sandboxSupported: false },
  { id: 12, code: 'QT-12', name: 'Visual Diagram Labeling', category: 'Interactive', autoMarkable: true, description: 'Drag text tags onto specific callout indicators on a technical drawing.', gradingMechanism: 'Target zone coordinate matching', sandboxSupported: false },
  { id: 13, code: 'QT-13', name: 'Interactive Flowchart Connectors', category: 'Interactive', autoMarkable: true, description: 'Connect decision boxes and process nodes to construct an algorithm.', gradingMechanism: 'Directed graph adjacency matrix match', sandboxSupported: false },
  { id: 14, code: 'QT-14', name: 'Text Highlighting & Passage Annotation', category: 'Interactive', autoMarkable: true, description: 'Highlight all clauses indicating breach of contract in legal text.', gradingMechanism: 'Character offset range intersection', sandboxSupported: false },
  { id: 15, code: 'QT-15', name: 'Interactive Timeline Placement', category: 'Interactive', autoMarkable: true, description: 'Drag computing milestones onto a continuous chronological timeline.', gradingMechanism: 'Range bounds tolerance checking', sandboxSupported: false },
  { id: 16, code: 'QT-16', name: 'Venn Diagram Categorization', category: 'Interactive', autoMarkable: true, description: 'Classify items into Set A, Set B, or the intersection set.', gradingMechanism: 'Set intersection membership verification', sandboxSupported: false },
  { id: 17, code: 'QT-17', name: 'Network Topology Assembler', category: 'Interactive', autoMarkable: true, description: 'Drag routers, switches, and firewalls to create a compliant subnet.', gradingMechanism: 'Graph node connectivity validation', sandboxSupported: false },
  { id: 18, code: 'QT-18', name: 'Electronic Circuit Component Drag-and-Drop', category: 'Interactive', autoMarkable: true, description: 'Assemble resistors, capacitors, and diodes in series or parallel.', gradingMechanism: 'Netlist circuit simulation match', sandboxSupported: false },
  { id: 19, code: 'QT-19', name: 'Architectural Blueprint Inspection', category: 'Interactive', autoMarkable: true, description: 'Identify structural flaws or electrical routing on CAD floor plans.', gradingMechanism: 'Multi-hotspot target validation', sandboxSupported: false },
  { id: 20, code: 'QT-20', name: 'Geographic Map Pinpointing', category: 'Interactive', autoMarkable: true, description: 'Place pins on regional counties, fibre backbones, or weather zones.', gradingMechanism: 'Geo-coordinate radius boundary check', sandboxSupported: false },

  // Coding, Database & Lab Simulations (21-30)
  { id: 21, code: 'QT-21', name: 'Online Programming Sandbox (Python)', category: 'Coding & Lab', autoMarkable: true, description: 'Write, execute, and pass automated unit test cases in Python 3.', gradingMechanism: 'Automated test suite (pytest) runner', sandboxSupported: true },
  { id: 22, code: 'QT-22', name: 'Online Programming Sandbox (JavaScript/TypeScript)', category: 'Coding & Lab', autoMarkable: true, description: 'Implement full functions or algorithms in modern JavaScript/Node.', gradingMechanism: 'Jest / Vitest assertion execution', sandboxSupported: true },
  { id: 23, code: 'QT-23', name: 'Online Programming Sandbox (Java / C++)', category: 'Coding & Lab', autoMarkable: true, description: 'Object-oriented data structure implementation compiled server-side.', gradingMechanism: 'Compiler output & stdout assertion', sandboxSupported: true },
  { id: 24, code: 'QT-24', name: 'SQL Query Sandbox with Live DB Output', category: 'Coding & Lab', autoMarkable: true, description: 'Write SELECT, JOIN, and GROUP BY queries evaluated against test DB.', gradingMechanism: 'Result set row/column hash comparison', sandboxSupported: true },
  { id: 25, code: 'QT-25', name: 'Terminal / Bash Command Simulation', category: 'Coding & Lab', autoMarkable: true, description: 'Execute Linux shell commands to manage permissions, users, and grep.', gradingMechanism: 'Filesystem state diff & stdout match', sandboxSupported: true },
  { id: 26, code: 'QT-26', name: 'HTML5 & CSS3 Live Rendering Sandbox', category: 'Coding & Lab', autoMarkable: true, description: 'Code responsive web components evaluated for DOM tree and styles.', gradingMechanism: 'DOM selector & computed style checker', sandboxSupported: true },
  { id: 27, code: 'QT-27', name: 'Regex Pattern Validator', category: 'Coding & Lab', autoMarkable: true, description: 'Formulate regular expressions to validate Kenyan phone numbers / IDs.', gradingMechanism: 'Test against 20 positive and negative strings', sandboxSupported: true },
  { id: 28, code: 'QT-28', name: 'Git Version Control Simulator', category: 'Coding & Lab', autoMarkable: true, description: 'Execute branch, merge, commit, and rebase operations.', gradingMechanism: 'Git commit graph traversal analysis', sandboxSupported: true },
  { id: 29, code: 'QT-29', name: 'REST API Request Crafting (Postman-style)', category: 'Coding & Lab', autoMarkable: true, description: 'Craft HTTP headers, tokens, and payloads to query mock endpoints.', gradingMechanism: 'HTTP payload and response code check', sandboxSupported: true },
  { id: 30, code: 'QT-30', name: 'Docker / Containerfile Syntax Lab', category: 'Coding & Lab', autoMarkable: true, description: 'Write Containerfiles to construct hardened microservice images.', gradingMechanism: 'Linter analysis & dry-run build trace', sandboxSupported: true },

  // Practical Office & Business Computing (31-38)
  { id: 31, code: 'QT-31', name: 'ICDL Spreadsheet Formula Simulation', category: 'Practical & Office', autoMarkable: true, description: 'Enter VLOOKUP, INDEX/MATCH, and IF formulas in interactive sheet.', gradingMechanism: 'Cell value & formula syntax inspection', sandboxSupported: true },
  { id: 32, code: 'QT-32', name: 'Word Processing Layout & Typography Practical', category: 'Practical & Office', autoMarkable: true, description: 'Apply styles, margins, headers, and table of contents formatting.', gradingMechanism: 'Document XML style tree validation', sandboxSupported: true },
  { id: 33, code: 'QT-33', name: 'Presentation Slide Design & Master Template', category: 'Practical & Office', autoMarkable: true, description: 'Configure master slides, animation transitions, and layout guides.', gradingMechanism: 'Presentation object property check', sandboxSupported: false },
  { id: 34, code: 'QT-34', name: 'Accounting Double-Entry Journal Simulator', category: 'Practical & Office', autoMarkable: true, description: 'Enter debit and credit entries verifying accounting equation balance.', gradingMechanism: 'Ledger debits equal credits check', sandboxSupported: true },
  { id: 35, code: 'QT-35', name: 'Payroll Calculations Practical (Kenyan Taxes)', category: 'Practical & Office', autoMarkable: true, description: 'Compute PAYE, SHIF, NSSF Tier 1 & 2, and Housing Levy for sample staff.', gradingMechanism: 'Precision numeric comparison to 2 decimal places', sandboxSupported: true },
  { id: 36, code: 'QT-36', name: 'Project Gantt Chart & Critical Path Scheduler', category: 'Practical & Office', autoMarkable: true, description: 'Calculate early start, late finish, float, and critical path activities.', gradingMechanism: 'Critical path sequence validation', sandboxSupported: false },
  { id: 37, code: 'QT-37', name: 'Database Entity-Relationship (ERD) Modeler', category: 'Practical & Office', autoMarkable: true, description: 'Model entities, primary keys, foreign keys, and cardinalities.', gradingMechanism: 'Relational schema graph isomorphism', sandboxSupported: false },
  { id: 38, code: 'QT-38', name: 'Data Visualization & Chart Selection', category: 'Practical & Office', autoMarkable: true, description: 'Select appropriate chart type and configure axes for given dataset.', gradingMechanism: 'Config object evaluation', sandboxSupported: false },

  // STEM, Mathematics & Engineering (39-46)
  { id: 39, code: 'QT-39', name: 'Mathematical Formula & LaTeX Input', category: 'STEM & Math', autoMarkable: true, description: 'Input mathematical equations with live MathJax / KaTeX preview.', gradingMechanism: 'Computer Algebra System (CAS) equivalence check', sandboxSupported: true },
  { id: 40, code: 'QT-40', name: 'Numeric Answer with Tolerances (+/- %)', category: 'STEM & Math', autoMarkable: true, description: 'Enter calculated numeric answers with unit and margin of error.', gradingMechanism: 'Absolute or relative tolerance boundary', sandboxSupported: false },
  { id: 41, code: 'QT-41', name: 'Chemical Equation Balancing', category: 'STEM & Math', autoMarkable: true, description: 'Balance stoichiometric coefficients for chemical reactions.', gradingMechanism: 'Linear equation system solver', sandboxSupported: false },
  { id: 42, code: 'QT-42', name: 'Statistical Distribution & Z-Score Problem', category: 'STEM & Math', autoMarkable: true, description: 'Calculate p-values, hypothesis tests, and confidence intervals.', gradingMechanism: 'Standard statistical library tolerances', sandboxSupported: false },
  { id: 43, code: 'QT-43', name: 'Boolean Logic Gate Truth Table', category: 'STEM & Math', autoMarkable: true, description: 'Complete output columns for NAND, NOR, XOR combinational logic.', gradingMechanism: 'Boolean vector equality check', sandboxSupported: false },
  { id: 44, code: 'QT-44', name: 'Matrix Transformation & Vector Calculation', category: 'STEM & Math', autoMarkable: true, description: 'Multiply matrices, find determinants, and calculate eigenvalues.', gradingMechanism: 'Matrix equivalence verification', sandboxSupported: false },
  { id: 45, code: 'QT-45', name: 'Calculus Derivative & Integral Steps', category: 'STEM & Math', autoMarkable: true, description: 'Identify intermediate steps in chain rule or integration by parts.', gradingMechanism: 'Step-by-step symbolic algebra checking', sandboxSupported: false },
  { id: 46, code: 'QT-46', name: 'Unit Conversion with Dimensional Analysis', category: 'STEM & Math', autoMarkable: true, description: 'Convert metric/imperial engineering units showing dimensional cancel.', gradingMechanism: 'Physical quantity & SI unit dimension check', sandboxSupported: false },

  // Subjective & Rubric-Graded (47-54)
  { id: 47, code: 'QT-47', name: 'Short Answer Text (Regex / Keyword Rules)', category: 'Subjective', autoMarkable: true, description: '1-3 sentence answers auto-graded against required keyword combinations.', gradingMechanism: 'Boolean keyword regex evaluation', sandboxSupported: false },
  { id: 48, code: 'QT-48', name: 'Extended Essay with Configurable Rubric', category: 'Subjective', autoMarkable: false, description: 'Comprehensive written essays scored across custom institutional rubrics.', gradingMechanism: 'Multi-criteria rubric slider interface', sandboxSupported: false },
  { id: 49, code: 'QT-49', name: 'Case Study Scenario Analysis', category: 'Subjective', autoMarkable: false, description: 'Complex multi-page real-world business / technology case analysis.', gradingMechanism: 'Rubric-based examiner evaluation', sandboxSupported: false },
  { id: 50, code: 'QT-50', name: 'Code Review & Architectural Critique', category: 'Subjective', autoMarkable: false, description: 'Review supplied repository, identifying security and performance bugs.', gradingMechanism: 'Examiner checklist + inline comments', sandboxSupported: true },
  { id: 51, code: 'QT-51', name: 'Document Analysis & Evidence Extraction', category: 'Subjective', autoMarkable: false, description: 'Examine policy documents, extract key risks, and formulate advisory.', gradingMechanism: 'Key-point rubric scoring', sandboxSupported: false },
  { id: 52, code: 'QT-52', name: 'Translational Language Passage', category: 'Subjective', autoMarkable: false, description: 'Translate technical or legal English into standard Kiswahili.', gradingMechanism: 'Bilingual expert examiner grading', sandboxSupported: false },
  { id: 53, code: 'QT-53', name: 'Ethical Dilemma Resolution Response', category: 'Subjective', autoMarkable: false, description: 'Address professional engineering or medical confidentiality crises.', gradingMechanism: 'Ethical framework compliance rubric', sandboxSupported: false },
  { id: 54, code: 'QT-54', name: 'Research Proposal Abstract Formulation', category: 'Subjective', autoMarkable: false, description: 'Draft academic abstract including methodology, sample size, and aims.', gradingMechanism: 'Academic rigor rubric scoring', sandboxSupported: false },

  // Multimedia, Audio & Practical Vocational (55-63)
  { id: 55, code: 'QT-55', name: 'Oral / Audio Recorded Response', category: 'Multimedia', autoMarkable: false, description: 'Record voice audio directly in browser for language proficiency.', gradingMechanism: 'Waveform audio player + rubric rating', sandboxSupported: false },
  { id: 56, code: 'QT-56', name: 'Video Submission & Viva Voce Presentation', category: 'Multimedia', autoMarkable: false, description: 'Submit screen recording or presentation video for remote defense.', gradingMechanism: 'Video playback + presentation rubric', sandboxSupported: false },
  { id: 57, code: 'QT-57', name: 'Image / Sketch File Upload Practical', category: 'Multimedia', autoMarkable: false, description: 'Upload photo of physical electronics breadboard or architectural sketch.', gradingMechanism: 'High-res image inspect tool + rubric', sandboxSupported: false },
  { id: 58, code: 'QT-58', name: 'Zip Archive Source Code Project Upload', category: 'Multimedia', autoMarkable: false, description: 'Upload entire web or mobile application repository with build instructions.', gradingMechanism: 'Extracted file tree viewer & test suite', sandboxSupported: true },
  { id: 59, code: 'QT-59', name: 'CDACC Portfolio of Evidence (PoE) Lodgement', category: 'Vocational & CBET', autoMarkable: false, description: 'Submit authentic photographic and signed evidence of industrial skill.', gradingMechanism: 'CDACC Competency Unit assessor checklist', sandboxSupported: false },
  { id: 60, code: 'QT-60', name: 'Automotive / Electrical Diagnostics Simulation', category: 'Vocational & CBET', autoMarkable: true, description: 'Troubleshoot simulated engine or wiring faults by reading multimeter data.', gradingMechanism: 'Fault isolation logic tree comparison', sandboxSupported: false },
  { id: 61, code: 'QT-61', name: 'Health Sciences Patient Triage Simulator', category: 'Vocational & CBET', autoMarkable: true, description: 'Prioritize emergency casualty cases based on vitals and symptoms.', gradingMechanism: 'Standard emergency triage algorithm', sandboxSupported: false },
  { id: 62, code: 'QT-62', name: 'Culinary & Hospitality Recipe Scaling & Costing', category: 'Vocational & CBET', autoMarkable: true, description: 'Calculate ingredient ratios, yield percentages, and food cost margins.', gradingMechanism: 'Precision formula verification', sandboxSupported: true },
  { id: 63, code: 'QT-63', name: 'Surveying & Civil Engineering Levelling Sheet', category: 'Vocational & CBET', autoMarkable: true, description: 'Complete collimation and rise/fall levelling tables for terrain survey.', gradingMechanism: 'Arithmetic check on back/fore sights and reduced levels', sandboxSupported: true }
];

export const USER_ROLES_32_COMPLETE: UserRoleItem[] = [
  // Executive Leadership (1-5)
  { id: 'ROLE-01', roleName: 'Super Administrator', category: 'Executive', mainResponsibilities: 'Complete system control, database access, security keys, and global configurations.', accessLevel: 'Super Administrator', permittedPortals: ['All Portals', 'Central Terminal', 'Audit Logs'], approvalThreshold: 'Unlimited / Final Authority' },
  { id: 'ROLE-02', roleName: 'Institution Administrator', category: 'Executive', mainResponsibilities: 'Overall day-to-day college operations, campus coordination, and policy enforcement.', accessLevel: 'High Authority', permittedPortals: ['Admin Portal', 'Operations', 'Academic', 'Finance'], approvalThreshold: 'KES 1,000,000 / Executive' },
  { id: 'ROLE-03', roleName: 'College Principal', category: 'Executive', mainResponsibilities: 'Institutional leadership, academic vision, board reporting, and executive approvals.', accessLevel: 'High Authority', permittedPortals: ['Executive Dashboard', 'Senate', 'All Portals'], approvalThreshold: 'Board Delegated Maximum' },
  { id: 'ROLE-04', roleName: 'Deputy Principal (Academics)', category: 'Executive', mainResponsibilities: 'Academic quality, curriculum accreditation, timetable approvals, and exam oversight.', accessLevel: 'High Authority', permittedPortals: ['Academic', 'Examination', 'Registrar'], approvalThreshold: 'Academic Senate Level' },
  { id: 'ROLE-05', roleName: 'Deputy Principal (Administration)', category: 'Executive', mainResponsibilities: 'Staffing, campus facilities, procurement oversight, and institutional discipline.', accessLevel: 'High Authority', permittedPortals: ['Operations', 'HR', 'Procurement'], approvalThreshold: 'Institutional Level' },

  // Academic Governance (6-11)
  { id: 'ROLE-06', roleName: 'Registrar (Academic Affairs)', category: 'Academic', mainResponsibilities: 'Admissions, student matriculation, central registration generator, and transcripts.', accessLevel: 'High Authority', permittedPortals: ['Registrar Portal (Mod 19)', 'Admissions', 'SIS Generator'], approvalThreshold: 'Official Credentials Issuance' },
  { id: 'ROLE-07', roleName: 'Academic Dean of School', category: 'Academic', mainResponsibilities: 'Supervision of academic programmes, departmental heads, and faculty workloads.', accessLevel: 'High Authority', permittedPortals: ['Academic Portal', 'Lecturer Hub', 'Moderation'], approvalThreshold: 'Faculty School Level' },
  { id: 'ROLE-08', roleName: 'Head of Department (HOD)', category: 'Academic', mainResponsibilities: 'Unit offering management, lecturer unit allocation, and continuous assessment review.', accessLevel: 'Departmental', permittedPortals: ['Departmental Console', 'Lecturer Portal', 'Marks Moderation'], approvalThreshold: 'Departmental Approval' },
  { id: 'ROLE-09', roleName: 'Examination Officer', category: 'Academic', mainResponsibilities: 'CBT examination administration, external KNEC/CDACC coordination, and invigilation.', accessLevel: 'High Authority', permittedPortals: ['Examination Portal (Mod 23)', 'Question Bank', 'Results Vault'], approvalThreshold: 'Examination Timetable & Secrecy' },
  { id: 'ROLE-10', roleName: 'Curriculum & Quality Assurance Officer', category: 'Academic', mainResponsibilities: 'TVETA compliance audits, curriculum versioning, and learning outcome tracking.', accessLevel: 'High Authority', permittedPortals: ['Quality Console', 'Audit Vault', 'Accreditation'], approvalThreshold: 'Quality Standards Audit' },
  { id: 'ROLE-11', roleName: 'Timetable Coordinator', category: 'Academic', mainResponsibilities: 'Scheduling lecture halls, computing labs, and resolving faculty clashes.', accessLevel: 'Departmental', permittedPortals: ['Timetable Engine', 'Room Booking'], approvalThreshold: 'Master Timetable Publication' },

  // Teaching & Training Faculty (12-15)
  { id: 'ROLE-12', roleName: 'Senior Lecturer', category: 'Academic', mainResponsibilities: 'Course delivery, question authoring, continuous assessment grading, and research.', accessLevel: 'Departmental', permittedPortals: ['Lecturer Portal (Mod 18)', 'LMS', 'CBT Question Author'], approvalThreshold: 'Course Mark Entry' },
  { id: 'ROLE-13', roleName: 'Lecturer / Trainer', category: 'Academic', mainResponsibilities: 'Class instruction, student roll call attendance, practical supervision, and grading.', accessLevel: 'Departmental', permittedPortals: ['Lecturer Portal (Mod 18)', 'LMS', 'Attendance'], approvalThreshold: 'CAT Marks Submission' },
  { id: 'ROLE-14', roleName: 'Adjunct / Part-Time Trainer', category: 'Academic', mainResponsibilities: 'Specialized modular instruction, hourly billing logbooks, and coursework assessment.', accessLevel: 'Departmental', permittedPortals: ['Lecturer Portal (Restricted)', 'LMS Course Hub'], approvalThreshold: 'Assigned Unit Level' },
  { id: 'ROLE-15', roleName: 'Lab Technician / Instructor', category: 'Academic', mainResponsibilities: 'Computer lab management, engineering equipment maintenance, and practical support.', accessLevel: 'Departmental', permittedPortals: ['Lab Manager', 'Equipment Checkout', 'Practical Grading'], approvalThreshold: 'Lab Safety & Stock' },

  // Finance & Accounts (16-19)
  { id: 'ROLE-16', roleName: 'Finance Manager / Chief Accountant', category: 'Administrative', mainResponsibilities: 'Financial planning, general ledger, audit packs, and fee structure approval.', accessLevel: 'High Authority', permittedPortals: ['Finance Portal (Mod 20)', 'Ledger', 'Bank Reconciler'], approvalThreshold: 'KES 500,000 / Financial' },
  { id: 'ROLE-17', roleName: 'Accountant', category: 'Administrative', mainResponsibilities: 'Payment reconciliation, invoice generation, M-Pesa statements, and supplier ledger.', accessLevel: 'Departmental', permittedPortals: ['Finance Portal', 'Invoice Engine', 'M-Pesa Monitor'], approvalThreshold: 'KES 100,000' },
  { id: 'ROLE-18', roleName: 'Chief Cashier', category: 'Administrative', mainResponsibilities: 'Student payment receipts, counter enquiries, and end-of-day cash reconciliation.', accessLevel: 'Departmental', permittedPortals: ['Cashier Counter', 'Receipt Generator (RCT-...)'], approvalThreshold: 'Receipt Issuance' },
  { id: 'ROLE-19', roleName: 'Procurement Officer', category: 'Administrative', mainResponsibilities: 'Purchase requisitions, supplier quotations, LPO generation, and asset deliveries.', accessLevel: 'Departmental', permittedPortals: ['Procurement Console', 'LPO Tool', 'Store Register'], approvalThreshold: 'PPADA Tendering Thresholds' },

  // Human Resources & Operations (20-24)
  { id: 'ROLE-20', roleName: 'HR Manager', category: 'Administrative', mainResponsibilities: 'Staff recruitment, contract management, biometric attendance, and staff welfare.', accessLevel: 'High Authority', permittedPortals: ['HR Portal', 'Staff Directory', 'Appraisals'], approvalThreshold: 'Staff Onboarding / Leave' },
  { id: 'ROLE-21', roleName: 'Payroll Officer', category: 'Administrative', mainResponsibilities: 'Kenyan statutory payroll (SHIF, NSSF, Housing Levy, PAYE), and payslip issuance.', accessLevel: 'Departmental', permittedPortals: ['Payroll Engine', 'Statutory Returns', 'Payslip Vault'], approvalThreshold: 'Monthly Payroll Run' },
  { id: 'ROLE-22', roleName: 'Chief Librarian', category: 'Administrative', mainResponsibilities: 'Physical book cataloguing, digital e-library, circulation desk, and overdue fines.', accessLevel: 'Departmental', permittedPortals: ['Library Portal (Mod 22)', 'Circulation Hub', 'E-Resources'], approvalThreshold: 'Book Acquisition & Fines' },
  { id: 'ROLE-23', roleName: 'Dean of Students', category: 'Administrative', mainResponsibilities: 'Student welfare, counselling, club registrations, and disciplinary coordination.', accessLevel: 'High Authority', permittedPortals: ['Student Affairs Hub', 'Welfare Portal', 'Clubs'], approvalThreshold: 'Welfare & Disciplinary' },
  { id: 'ROLE-24', roleName: 'Hostel Warden', category: 'Operations', mainResponsibilities: 'Room allocation, bed inventory, student check-in inspections, and boarding rules.', accessLevel: 'Departmental', permittedPortals: ['Hostel Management', 'Bed Inventory', 'Curfew Log'], approvalThreshold: 'Room Allocation' },

  // ICT & Technical Operations (25-27)
  { id: 'ROLE-25', roleName: 'ICT Director / CIO', category: 'Operations', mainResponsibilities: 'Enterprise technology roadmap, infrastructure uptime, cybersecurity, and data protection.', accessLevel: 'High Authority', permittedPortals: ['ICT Console', 'Security Center', 'Cloud Infra'], approvalThreshold: 'Infrastructure Level' },
  { id: 'ROLE-26', roleName: 'System & Database Administrator', category: 'Operations', mainResponsibilities: 'Relational database schema, backups, disaster recovery, and query optimization.', accessLevel: 'Super Administrator', permittedPortals: ['Database Console', 'Backup Pipeline', 'DR Engine'], approvalThreshold: 'Database Mutations' },
  { id: 'ROLE-27', roleName: 'Webmaster & CMS Editor', category: 'Operations', mainResponsibilities: 'Public website updates, course information publishing, and news blog management.', accessLevel: 'Departmental', permittedPortals: ['Website CMS', 'Media Manager', 'Course Publisher'], approvalThreshold: 'Public Content Publishing' },

  // Student Body & Community (28-32)
  { id: 'ROLE-28', roleName: 'Student (Enrolled)', category: 'Student & Public', mainResponsibilities: 'Unit registration, class attendance, assignments, CBT tests, and fee payments.', accessLevel: 'Self-Service', permittedPortals: ['Student Portal', 'LMS Classrooms', 'CBT Test Runner'], approvalThreshold: 'Personal Account' },
  { id: 'ROLE-29', roleName: 'Student Leader (Council Member)', category: 'Student & Public', mainResponsibilities: 'Student union governance, event organization, and student-administration liaison.', accessLevel: 'Self-Service', permittedPortals: ['Student Portal', 'Council Hub', 'Event Manager'], approvalThreshold: 'Student Association Activities' },
  { id: 'ROLE-30', roleName: 'Parent / Guardian', category: 'Student & Public', mainResponsibilities: 'Fee balance monitoring, student progress review, and direct tuition payments.', accessLevel: 'Self-Service', permittedPortals: ['Parent Portal (Restricted)', 'Fee Statement'], approvalThreshold: 'Payment on Student Account' },
  { id: 'ROLE-31', roleName: 'Alumni Member', category: 'Student & Public', mainResponsibilities: 'Graduate network, certificate verification requests, and alumni mentorship.', accessLevel: 'Self-Service', permittedPortals: ['Alumni Directory', 'Credential Verification'], approvalThreshold: 'Alumni Network' },
  { id: 'ROLE-32', roleName: 'Guest / Prospective Applicant', category: 'Student & Public', mainResponsibilities: 'Exploring programmes, submitting online applications, and booking campus tours.', accessLevel: 'Restricted / Public', permittedPortals: ['Public Website', 'Application Wizard', 'Portal Guide'], approvalThreshold: 'Application Submission' }
];

export const IMPLEMENTATION_PHASES_22_COMPLETE: ImplementationPhaseItem[] = [
  {
    phaseNumber: 'Phase 01',
    phaseName: 'Foundation & Security Architecture',
    timeframe: 'Weeks 1–2',
    mainImplementation: 'Database design, authentication, RBAC, atomic registration sequence engine, audit logging.',
    deliverablesCount: 14,
    budgetAllocationKES: 25000,
    status: 'Completed',
    keyMilestones: ['PostgreSQL Schema & Prisma ORM', 'Registration Generator (HCA/...)', 'RBAC Middleware', 'Audit Trail']
  },
  {
    phaseNumber: 'Phase 02',
    phaseName: 'Institution & Multi-Campus Setup',
    timeframe: 'Weeks 3–4',
    mainImplementation: 'Campuses (Nairobi, Westlands, Eldoret, Mombasa), departments, governance, global calendar config.',
    deliverablesCount: 12,
    budgetAllocationKES: 15000,
    status: 'Completed',
    keyMilestones: ['Multi-Campus Hierarchy', 'Department Structure', 'Academic Calendars', 'Global Settings']
  },
  {
    phaseNumber: 'Phase 03',
    phaseName: 'Public Website & Content Management System',
    timeframe: 'Weeks 5–6',
    mainImplementation: 'Responsive institutional portal, course catalogue, student portal guide, news, and resources.',
    deliverablesCount: 18,
    budgetAllocationKES: 25000,
    status: 'Completed',
    keyMilestones: ['Public Web Architecture', 'Course Explorer', 'Portal Walkthrough', 'Download Centre']
  },
  {
    phaseNumber: 'Phase 04',
    phaseName: 'Admissions & Student Onboarding',
    timeframe: 'Weeks 7–8',
    mainImplementation: 'Online application wizard, document verification, scoring, and automated offer letters.',
    deliverablesCount: 16,
    budgetAllocationKES: 20000,
    status: 'Completed',
    keyMilestones: ['Admissions Portal (Module 24)', 'Offer Letter Generator', 'Application Reference Engine', 'Document Vault']
  },
  {
    phaseNumber: 'Phase 05',
    phaseName: 'Central Student Information System (SIS)',
    timeframe: 'Weeks 9–10',
    mainImplementation: 'Student master profiles, photo bio, digital student ID cards, deferrals, and clearances.',
    deliverablesCount: 15,
    budgetAllocationKES: 20000,
    status: 'Completed',
    keyMilestones: ['Student Master SIS', 'Digital ID Generator', 'Student Status Manager', 'Clearance Engine']
  },
  {
    phaseNumber: 'Phase 06',
    phaseName: 'Curriculum & Academic Structure',
    timeframe: 'Weeks 11–12',
    mainImplementation: 'Programmes, curriculum trees, units of study, prerequisite validation, and syllabus repository.',
    deliverablesCount: 14,
    budgetAllocationKES: 15000,
    status: 'Completed',
    keyMilestones: ['Curriculum Registry', 'Prerequisite Engine', 'Syllabus Repository', 'Course Offerings']
  },
  {
    phaseNumber: 'Phase 07',
    phaseName: 'Timetabling & Lab Scheduling',
    timeframe: 'Weeks 13–14',
    mainImplementation: 'Conflict-free lecture, computer lab, and workshop scheduling with interactive grid views.',
    deliverablesCount: 12,
    budgetAllocationKES: 18000,
    status: 'Completed',
    keyMilestones: ['Timetable Grid', 'Clash Detection Engine', 'Lab Allocation Tool', 'SMS Schedule Alerts']
  },
  {
    phaseNumber: 'Phase 08',
    phaseName: 'Faculty Portal & Attendance Management',
    timeframe: 'Weeks 15–16',
    mainImplementation: 'Lecturer portal (Module 18), teaching rosters, digital attendance sheets, and threshold monitoring.',
    deliverablesCount: 13,
    budgetAllocationKES: 16000,
    status: 'Completed',
    keyMilestones: ['Lecturer Portal', 'Digital Roll Call', 'Attendance Threshold Warnings', 'Workload Tracker']
  },
  {
    phaseNumber: 'Phase 09',
    phaseName: 'Learning Management System (LMS)',
    timeframe: 'Weeks 17–18',
    mainImplementation: 'Virtual classrooms, lecture notes, video embedding, discussion forums, and assignment dropboxes.',
    deliverablesCount: 17,
    budgetAllocationKES: 22000,
    status: 'Completed',
    keyMilestones: ['LMS Course View', 'Assignment Dropbox', 'Rubric Grading Tool', 'Virtual Classroom Links']
  },
  {
    phaseNumber: 'Phase 10',
    phaseName: '63 Question Types Registry & Question Bank',
    timeframe: 'Weeks 19–20',
    mainImplementation: 'Full registry of 63 computerized question formats, difficulty tagging, and peer moderation workflow.',
    deliverablesCount: 20,
    budgetAllocationKES: 24000,
    status: 'Completed',
    keyMilestones: ['63 Question Types Matrix', 'Question Bank Authoring', 'Bloom Taxonomy Tags', 'Moderation Pipeline']
  },
  {
    phaseNumber: 'Phase 11',
    phaseName: 'Online Computer-Based Testing (CBT) Engine',
    timeframe: 'Weeks 21–22',
    mainImplementation: 'High-concurrency test runner, countdown timer, question navigator, autosave, and anti-cheating.',
    deliverablesCount: 16,
    budgetAllocationKES: 22000,
    status: 'Completed',
    keyMilestones: ['CBT Test Runner', 'Autosave Sync Engine', 'Cheating Focus Lockdown', 'Instant Auto-Marking']
  },
  {
    phaseNumber: 'Phase 12',
    phaseName: 'Practical Software & Hands-On Exam Sandboxes',
    timeframe: 'Weeks 23–24',
    mainImplementation: 'Coding sandboxes (Python, JS), live SQL query executor, and terminal command simulations.',
    deliverablesCount: 14,
    budgetAllocationKES: 18000,
    status: 'Completed',
    keyMilestones: ['Code Sandbox (Module 23)', 'SQL Query Runner', 'Terminal Emulator', 'ICDL Formula Checker']
  },
  {
    phaseNumber: 'Phase 13',
    phaseName: 'Marking, Moderation & Senate Approvals',
    timeframe: 'Weeks 25–26',
    mainImplementation: 'Continuous assessment compilation, moderation workflow, GPA calculations, and Senate approval.',
    deliverablesCount: 15,
    budgetAllocationKES: 15000,
    status: 'Completed',
    keyMilestones: ['Marks Entry Grid', 'Moderation Console', 'GPA/CGPA Calculator', 'Senate Batch Approval']
  },
  {
    phaseNumber: 'Phase 14',
    phaseName: 'Official Transcripts & Verifiable Credentials',
    timeframe: 'Weeks 27–28',
    mainImplementation: 'Registrar portal (Module 19), official transcripts (TRX), QR verification, and graduation audit.',
    deliverablesCount: 13,
    budgetAllocationKES: 18000,
    status: 'Completed',
    keyMilestones: ['Verifiable Transcripts (VRF-...)', 'Registrar Portal', 'Public Verification QR', 'Graduation List']
  },
  {
    phaseNumber: 'Phase 15',
    phaseName: 'Finance, Invoicing & Student Accounts',
    timeframe: 'Weeks 29–30',
    mainImplementation: 'Finance portal (Module 20), fee structures, automated semester invoicing, and student fee ledger.',
    deliverablesCount: 15,
    budgetAllocationKES: 20000,
    status: 'Completed',
    keyMilestones: ['Finance Portal', 'Fee Structure Builder', 'Student Ledger', 'Fee Barrier Enforcement']
  },
  {
    phaseNumber: 'Phase 16',
    phaseName: 'M-Pesa Daraja Integration & Bank Reconciliations',
    timeframe: 'Weeks 31–32',
    mainImplementation: 'Direct Safaricom Daraja STK push, official receipt generation (RCT-...), and bank CSV matching.',
    deliverablesCount: 14,
    budgetAllocationKES: 22000,
    status: 'Completed',
    keyMilestones: ['Daraja STK Push Handler', 'Instant Receipt Generator', 'Bank Statement Importer', 'Cashier Shift Close']
  },
  {
    phaseNumber: 'Phase 17',
    phaseName: 'Kenyan Statutory Payroll & HR Records',
    timeframe: 'Weeks 33–34',
    mainImplementation: 'Staff management (HCA/STAFF/...), leave approvals, and 2026 Kenyan statutory payroll (SHIF, NSSF, PAYE).',
    deliverablesCount: 16,
    budgetAllocationKES: 18000,
    status: 'Completed',
    keyMilestones: ['Kenyan Statutory Payroll', 'Password-Protected Payslips', 'KRA P9 Tax Generator', 'Leave Manager']
  },
  {
    phaseNumber: 'Phase 18',
    phaseName: 'Library Management (Physical & E-Library)',
    timeframe: 'Weeks 35–36',
    mainImplementation: 'Library portal (Module 22), Dewey Decimal cataloguing, barcode circulation desk, and digital e-books.',
    deliverablesCount: 15,
    budgetAllocationKES: 15000,
    status: 'Completed',
    keyMilestones: ['Library Portal (Module 22)', 'Circulation Desk Barcode Tool', 'Overdue Fine Calculator', 'Digital E-Library']
  },
  {
    phaseNumber: 'Phase 19',
    phaseName: 'Student Welfare, Hostels & Parent Portal',
    timeframe: 'Weeks 37–38',
    mainImplementation: 'Student self-service dashboard, guardian portal with permissions, hostel bed allocation, and welfare.',
    deliverablesCount: 14,
    budgetAllocationKES: 15000,
    status: 'Completed',
    keyMilestones: ['Student Dashboard Suite', 'Parent Portal', 'Hostel Bed Manager', 'Counselling Booking']
  },
  {
    phaseNumber: 'Phase 20',
    phaseName: 'Quality Assurance, TVETA Compliance & CBET',
    timeframe: 'Weeks 39–40',
    mainImplementation: 'TVETA accreditation checklist, trainer licensing register, CDACC CBET portfolios, and attachment logbooks.',
    deliverablesCount: 13,
    budgetAllocationKES: 13000,
    status: 'Completed',
    keyMilestones: ['TVETA Compliance Vault', 'Trainer License Monitor', 'CBET Logbook', 'Quality Audit Reports']
  },
  {
    phaseNumber: 'Phase 21',
    phaseName: 'Operations, Procurement & Asset Register',
    timeframe: 'Weeks 41–42',
    mainImplementation: 'Procurement requisitions, LPO issuance, store inventory management, and QR fixed asset tagging.',
    deliverablesCount: 12,
    budgetAllocationKES: 12000,
    status: 'Ready for Deploy',
    keyMilestones: ['Procurement LPO Tool', 'Store Inventory Control', 'Fixed Asset Tagging', 'Audit Evidence']
  },
  {
    phaseNumber: 'Phase 22',
    phaseName: 'Institutional Reports, Disaster Recovery & Launch',
    timeframe: 'Weeks 43–44',
    mainImplementation: 'Executive BI analytics, encrypted automated backup pipeline, penetration testing, and formal launch.',
    deliverablesCount: 14,
    budgetAllocationKES: 12000,
    status: 'Ready for Deploy',
    keyMilestones: ['Executive BI Dashboard', 'Disaster Recovery Automated Backups', 'Security Audit Sign-Off', 'Production Cutover']
  }
];

export const BUDGET_KES_400K_BREAKDOWN: BudgetDisbursementMilestone[] = [
  {
    milestone: 'Milestone 1 (Inception & Architecture)',
    title: 'Platform Foundation, RBAC & Public Presence',
    percentage: 20,
    amountKES: 80000,
    deliverableCriteria: 'Complete multi-portal routing architecture, PostgreSQL schemas, RBAC matrix, Central Registration Generator, and Public Website with Course Explorer.',
    triggerEvent: 'Successful deployment of Phases 01, 02, and 03 with zero compilation errors.'
  },
  {
    milestone: 'Milestone 2 (Core Academic & Student SIS)',
    title: 'Admissions, SIS, Academic Operations & Timetabling',
    percentage: 30,
    amountKES: 120000,
    deliverableCriteria: 'Working admissions workflow (Module 24), student onboarding, curriculum repository, lecturer teaching rosters (Module 18), and clash-free timetable grid.',
    triggerEvent: 'Acceptance of Phases 04, 05, 06, 07, and 08 by Academic Registrar.'
  },
  {
    milestone: 'Milestone 3 (Examinations, CBT & LMS)',
    title: 'LMS Classrooms, 63 Question Types & CBT Test Engine',
    percentage: 25,
    amountKES: 100000,
    deliverableCriteria: 'Virtual LMS delivery, full 63 Question Types Registry, online CBT testing sandbox with autosave, coding sandbox, marks moderation, and official transcripts (Module 19).',
    triggerEvent: 'Demonstration and load testing of Phases 09, 10, 11, 12, 13, and 14.'
  },
  {
    milestone: 'Milestone 4 (Finance, ERP, Security & Go-Live)',
    title: 'M-Pesa Daraja, Payroll, Library, Quality & Launch',
    percentage: 25,
    amountKES: 100000,
    deliverableCriteria: 'M-Pesa STK push fee receipting, 2026 Kenyan statutory payroll (SHIF/NSSF/PAYE), library portal (Module 22), TVETA audit compliance, backups, and user training.',
    triggerEvent: 'Final Institutional Acceptance, staff training sign-off, and production deployment.'
  }
];

export const TOTAL_PROJECT_BUDGET_KES = 400000;

/**
 * HI-TECH College Integrated Digital Academic & Certification Platform
 * Core Type Definitions
 */

export type RegistrationRecordType =
  | 'STAFF'   // Staff members (e.g. HCA/STAFF/2026/001)
  | 'STU'     // Students (e.g. HCA/STU/2026/001)
  | 'LECT'    // Lecturers & Trainers (e.g. HCA/LECT/2026/001)
  | 'ADMIN'   // Administrators (e.g. HCA/ADMIN/2026/001)
  | 'PARENT'  // Parents / Guardians (e.g. HCA/PARENT/2026/001)
  | 'APP'     // Applicants (e.g. HCA/APP/2026/001)
  | 'DEPT'    // Departments (e.g. HCA/DEPT/2026/001)
  | 'CAMP'    // Campuses (e.g. HCA/CAMP/2026/001)
  | 'EXAM'    // Examination candidates / codes (e.g. HCA/EXAM/2026/001)
  | 'CERT'    // Official Certificates (e.g. HCA/CERT/2026/001)
  | 'LIB';    // Library items / member cards (e.g. HCA/LIB/2026/001)

export interface RegistrationSequenceRecord {
  institutionCode: string; // e.g. "HCA"
  recordType: RegistrationRecordType;
  year: number;
  currentSequence: number;
  padLength: number; // default 3 (e.g. 001)
  lastUpdated: string;
}

export interface RegistrationIssuance {
  id: string;
  registrationNumber: string; // e.g. "HCA/STAFF/2026/001"
  institutionCode: string;
  recordType: RegistrationRecordType;
  year: number;
  sequenceNumber: number;
  recipientName: string;
  identifierReference: string; // National ID, Birth Cert, or Index No
  department?: string;
  programmeOrRole?: string;
  campus: string;
  issuedBy: string;
  issuedAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'SUPERSEDED';
  metadata?: Record<string, any>;
}

export type PortalRole =
  | 'website'
  | 'catalogue'
  | 'chatbot-admin'
  | 'student'
  | 'generator'
  | 'lecturer'
  | 'registrar'
  | 'finance'
  | 'library'
  | 'examination'
  | 'admissions';

export interface CourseProgramme {
  id: string;
  code: string;
  title: string;
  department: string;
  level: 'Diploma' | 'Certificate' | 'Degree' | 'Short Course' | 'Professional';
  duration: string;
  intake: string[];
  mode: ('Full-time' | 'Part-time' | 'Evening' | 'Online')[];
  minimumRequirements: string;
  examiningBody: 'TVET CDACC' | 'KNEC' | 'KASNEB' | 'NITA' | 'HI-TECH';
  tuitionPerTerm: number;
  overview: string;
  careerOpportunities: string[];
  keyModules: string[];
  featured?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Academics' | 'Events' | 'Admissions' | 'Sports' | 'Research';
  publishedDate: string;
  author: string;
  imageUrl?: string;
  readTime: string;
  isImportant?: boolean;
}

export interface StudentProfile {
  id: string;
  registrationNumber: string; // e.g. "HCA/STU/2026/001"
  admissionNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  programme: string;
  department: string;
  campus: string;
  academicYear: string;
  semester: string;
  registeredCourses: number;
  attendanceRate: number;
  gpa: number;
  feeBalance: number;
  libraryFines: number;
  admissionDate: string;
  status: 'ACTIVE' | 'DEFERRED' | 'SUSPENDED' | 'GRADUATED';
}

export interface UnitCourse {
  code: string;
  title: string;
  credits: number;
  lecturerName: string;
  day: string;
  time: string;
  room: string;
  grade?: string;
  score?: number;
  attendance: number;
}

export interface LibraryBook {
  id: string;
  isbn: string;
  barcode: string;
  title: string;
  author: string;
  publisher: string;
  edition: string;
  year: number;
  category: string;
  classificationNumber: string; // Dewey e.g. "005.133 OTA"
  shelfLocation: string; // e.g. "Level 2, Bay C, Shelf 4"
  campus: string;
  totalCopies: number;
  availableCopies: number;
  coverImage?: string;
}

export interface BookLoan {
  id: string;
  barcode: string;
  bookTitle: string;
  borrowerName: string;
  borrowerRegNo: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  fineAmount: number;
}

export interface DigitalResource {
  id: string;
  title: string;
  author: string;
  type: 'E-BOOK' | 'JOURNAL' | 'RESEARCH_PAPER' | 'LECTURE_NOTES';
  fileFormat: 'PDF' | 'EPUB';
  fileSize: string;
  programme: string;
  downloadsCount: number;
  publishYear: number;
  description: string;
}

export interface ExamRecord {
  id: string;
  courseCode: string;
  courseTitle: string;
  examBody: 'KNEC' | 'KASNEB' | 'TVET CDACC' | 'NITA' | 'HI-TECH INTERNAL';
  examDate: string;
  time: string;
  room: string;
  durationMinutes: number;
  totalMarks: number;
  candidatesCount: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MODERATING' | 'PUBLISHED';
}

export interface AdmissionApplication {
  id: string;
  applicationReference: string; // e.g. "APP-2026-0842"
  applicantName: string;
  email: string;
  phoneNumber: string;
  nationalIdOrIndex: string;
  targetProgramme: string;
  targetCampus: string;
  intake: string;
  meanGrade: string; // e.g. "C+"
  submittedAt: string;
  applicationFeePaid: boolean;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'OFFER_MADE' | 'ACCEPTED' | 'REGISTERED' | 'REJECTED';
  offerLetterRef?: string;
  generatedStudentRegNo?: string;
}

export interface FeeTransaction {
  id: string;
  receiptNumber: string; // e.g. "RCT-2026-0142"
  studentRegNo: string;
  studentName: string;
  amount: number;
  paymentMethod: 'M-PESA' | 'BANK_TRANSFER' | 'EQUITY_BILL' | 'CHEQUE';
  referenceNumber: string; // e.g. "SHR76YQ12P"
  timestamp: string;
  semester: string;
  description: string;
  status: 'COMPLETED' | 'RECONCILED' | 'PENDING';
}

export interface TranscriptRecord {
  issuanceReference: string; // e.g. "TRX-2026-0001"
  studentRegNo: string;
  studentName: string;
  programme: string;
  issueDate: string;
  issuedBy: string;
  verificationCode: string;
  status: 'ISSUED' | 'VERIFIED' | 'REVOKED';
  cgpa: number;
}

/**
 * HI-TECH College Module 18: Lecturer / Trainer Portal Types
 */

export type LecturerEmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';

export type LessonStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED'
  | 'AUTHORIZED_ABSENCE'
  | 'LEFT_EARLY';

export type LecturerAssessmentType =
  | 'CAT'
  | 'ASSIGNMENT'
  | 'THEORY_EXAM'
  | 'PRACTICAL_EXAM'
  | 'PROGRAMMING'
  | 'NETWORKING_LAB'
  | 'ICDL'
  | 'ORAL'
  | 'LANGUAGE'
  | 'OTHER';

export type LecturerAssessmentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'OPEN'
  | 'CLOSED'
  | 'MARKING'
  | 'COMPLETED'
  | 'CANCELLED';

export type TimetableRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type EquipmentCondition = 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'UNDER_REPAIR' | 'DISPOSED';

export type FaultPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type OnlineClassStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface TeachingAssignment {
  id: string;
  lecturerId: string;
  courseId: string;
  courseName: string;
  unitId: string;
  unitName: string;
  classGroupId: string;
  academicYear: string;
  semester: string;
  campusId: string;
  campusName: string;
  enrolledStudentsCount: number;
  active: boolean;
}

export interface LessonPlanItem {
  id: string;
  assignmentId: string;
  unitCode: string;
  unitTitle: string;
  lessonDate: string;
  durationMinutes: number;
  topic: string;
  subtopic?: string;
  objectives: string;
  teachingMethods?: string;
  activities?: string;
  resources?: string;
  assessmentMethods?: string;
  remarks?: string;
  status: LessonStatus;
  createdAt: string;
}

export interface SchemeWeek {
  weekNumber: number;
  plannedDate?: string;
  actualDate?: string;
  topic: string;
  subtopic?: string;
  learningOutcome?: string;
  activities?: string;
  resources?: string;
  assessment?: string;
  completed?: boolean;
  remarks?: string;
}

export interface SchemeOfWorkItem {
  id: string;
  assignmentId: string;
  unitCode: string;
  unitTitle: string;
  title: string;
  academicYear: string;
  semester: string;
  status: LessonStatus;
  weeks: SchemeWeek[];
  createdAt: string;
}

export interface LearningMaterialItem {
  id: string;
  assignmentId: string;
  unitCode: string;
  title: string;
  description: string;
  topic?: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  published: boolean;
  publishedAt?: string;
  downloadCount: number;
}

export interface TimetableEntry {
  id: string;
  assignmentId: string;
  unitCode: string;
  unitTitle: string;
  classGroupId: string;
  roomName: string;
  roomCode: string;
  building: string;
  startTime: string; // ISO or Time
  endTime: string;
  dayOfWeek: string;
  sessionType: 'Lecture' | 'Lab Practical' | 'Tutorial';
}

export interface CollegeClassroom {
  id: string;
  campusName: string;
  building: string;
  roomName: string;
  roomCode: string;
  capacity: number;
  roomType: 'CLASSROOM' | 'COMPUTER_LAB' | 'LECTURE_HALL' | 'PRACTICAL_ROOM';
  active: boolean;
}

export interface LaboratoryEquipmentItem {
  id: string;
  laboratoryName: string;
  assetCode: string;
  equipmentName: string;
  manufacturer: string;
  modelNumber: string;
  condition: EquipmentCondition;
  lastServiceDate?: string;
}

export interface EquipmentFaultItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  assetCode: string;
  reportedBy: string;
  description: string;
  priority: FaultPriority;
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  reportedAt: string;
}

export interface OnlineClassItem {
  id: string;
  assignmentId: string;
  unitCode: string;
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  provider: 'TEAMS' | 'GOOGLE_MEET' | 'OTHER';
  meetingUrl: string;
  status: OnlineClassStatus;
}

export interface QuestionBankItem {
  id: string;
  assignmentId: string;
  unitCode: string;
  title: string;
  prompt: string;
  instructions?: string;
  topic?: string;
  type: string;
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
  options?: Array<{ id: string; text: string }>;
  answerConfig?: Record<string, unknown>;
  explanation?: string;
  status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  updatedAt: string;
}

export interface LecturerAssessmentItem {
  id: string;
  assignmentId: string;
  unitCode: string;
  title: string;
  instructions: string;
  assessmentType: LecturerAssessmentType;
  totalMarks: number;
  passMark: number;
  durationMinutes: number;
  availableFrom?: string;
  availableUntil?: string;
  allowLate: boolean;
  randomizeQuestions: boolean;
  status: LecturerAssessmentStatus;
  questionsCount: number;
  submissionsCount: number;
  createdAt: string;
}

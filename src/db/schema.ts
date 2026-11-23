import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============================================================================
// 1. CENTRAL IDENTITY, SESSIONS, PASSWORD RECOVERY & MFA SECURITY
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or institutional UID
  email: text('email').notNull().unique(),
  registrationNumber: text('registration_number').unique(),
  fullName: text('full_name').notNull().default('Portal User'),
  primaryRole: text('primary_role').notNull().default('STUDENT'),
  accountStatus: text('account_status').notNull().default('ACTIVE'), // ACTIVE | INVITED | SUSPENDED | DISABLED
  passwordHash: text('password_hash'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  requiresProfileCompletion: boolean('requires_profile_completion').notNull().default(false),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  campusId: text('campus_id'),
  departmentId: text('department_id'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  deviceLabel: text('device_label').notNull().default('Web Browser'),
  ipAddress: text('ip_address').notNull().default('127.0.0.1'),
  userAgent: text('user_agent').notNull().default(''),
  rememberMe: boolean('remember_me').notNull().default(false),
  expiresAt: timestamp('expires_at').notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordRecoveryTokens = pgTable('password_recovery_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  requestedIp: text('requested_ip').notNull().default('127.0.0.1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const loginEvents = pgTable('login_events', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  identifier: text('identifier').notNull(),
  authMethod: text('auth_method').notNull().default('PASSWORD'), // PASSWORD | GOOGLE | MFA_TOTP | MFA_BACKUP
  outcome: text('outcome').notNull(), // SUCCESS | MFA_CHALLENGE | FAILED | BLOCKED
  failureReason: text('failure_reason'),
  ipAddress: text('ip_address').notNull().default('127.0.0.1'),
  deviceLabel: text('device_label').notNull().default('Web Browser'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mfaSettings = pgTable('mfa_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  method: text('method').notNull().default('TOTP'), // TOTP | EMAIL_OTP
  encryptedSecret: text('encrypted_secret').notNull(),
  pendingSecret: text('pending_secret'),
  verifiedAt: timestamp('verified_at'),
  enforcedByPolicy: boolean('enforced_by_policy').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mfaBackupCodes = pgTable('mfa_backup_codes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  codeHash: text('code_hash').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mfaChallenges = pgTable('mfa_challenges', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  challengeTokenHash: text('challenge_token_hash').notNull().unique(),
  emailOtpHash: text('email_otp_hash'),
  rememberMe: boolean('remember_me').notNull().default(false),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const trustedDevices = pgTable('trusted_devices', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  deviceTokenHash: text('device_token_hash').notNull().unique(),
  deviceLabel: text('device_label').notNull(),
  ipAddress: text('ip_address').notNull().default('127.0.0.1'),
  expiresAt: timestamp('expires_at').notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// 2. STUDENT INFORMATION SYSTEM (SIS)
// ============================================================================

export const registrationNumberSequences = pgTable(
  'registration_number_sequences',
  {
    id: serial('id').primaryKey(),
    category: text('category').notNull(), // STU | STAFF | PAR | ALU
    academicYear: integer('academic_year').notNull(),
    lastSequence: integer('last_sequence').notNull().default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('reg_seq_cat_year_idx').on(table.category, table.academicYear)]
);

export const studentProfiles = pgTable('student_profiles', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull()
    .unique(),
  admissionId: text('admission_id').unique(),
  registrationNumber: text('registration_number').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  dateOfBirth: timestamp('date_of_birth'),
  gender: text('gender').notNull().default('NOT_SPECIFIED'),
  nationality: text('nationality').default('Kenyan'),
  nationalIdHash: text('national_id_hash'),
  phoneNumber: text('phone_number'),
  alternatePhone: text('alternate_phone'),
  address: text('address'),
  campusId: text('campus_id'),
  campusName: text('campus_name'),
  departmentId: text('department_id'),
  departmentName: text('department_name'),
  programmeId: text('programme_id'),
  programmeName: text('programme_name'),
  intakeName: text('intake_name'),
  studyMode: text('study_mode').default('FULL_TIME'),
  feeCategory: text('fee_category').default('SELF_SPONSORED'),
  feeBalanceKes: integer('fee_balance_kes').notNull().default(0),
  attendanceRatePct: integer('attendance_rate_pct').notNull().default(92),
  meanGradeLabel: text('mean_grade_label').default('Credit (74%)'),
  admissionDate: timestamp('admission_date'),
  completionDate: timestamp('completion_date'),
  graduationDate: timestamp('graduation_date'),
  status: text('status').notNull().default('ADMITTED'),
  profileCompleted: boolean('profile_completed').notNull().default(false),
  welfareFlag: text('welfare_flag'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentGuardians = pgTable('student_guardians', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .references(() => studentProfiles.id, { onDelete: 'restrict' })
    .notNull(),
  guardianUserId: integer('guardian_user_id').references(() => users.id, { onDelete: 'set null' }),
  fullName: text('full_name').notNull(),
  relationship: text('relationship').notNull(),
  phoneNumber: text('phone_number'),
  email: text('email'),
  isPrimary: boolean('is_primary').notNull().default(false),
  portalAccess: boolean('portal_access').notNull().default(false),
  consentRecordedAt: timestamp('consent_recorded_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentEmergencyContacts = pgTable('student_emergency_contacts', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .references(() => studentProfiles.id, { onDelete: 'restrict' })
    .notNull(),
  fullName: text('full_name').notNull(),
  relationship: text('relationship').notNull(),
  phoneNumber: text('phone_number').notNull(),
  alternativePhone: text('alternative_phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentStatusHistory = pgTable('student_status_history', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .references(() => studentProfiles.id, { onDelete: 'restrict' })
    .notNull(),
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  reason: text('reason'),
  changedById: text('changed_by_id').notNull(),
  changedByName: text('changed_by_name').notNull().default('Authorized Officer'),
  effectiveAt: timestamp('effective_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentChangeRequests = pgTable('student_change_requests', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .references(() => studentProfiles.id, { onDelete: 'restrict' })
    .notNull(),
  changeType: text('change_type').notNull(), // PROGRAMME_TRANSFER | CAMPUS_TRANSFER | DEFERMENT | RESUMPTION | WITHDRAWAL | STATUS_CHANGE | PERSONAL_DETAILS | GRADUATION
  status: text('status').notNull().default('REQUESTED'), // REQUESTED | UNDER_REVIEW | APPROVED | REJECTED | CANCELLED | COMPLETED
  reason: text('reason').notNull(),
  requestedById: text('requested_by_id').notNull(),
  requestedByName: text('requested_by_name').notNull().default('Portal User'),
  reviewedById: text('reviewed_by_id'),
  reviewedByName: text('reviewed_by_name'),
  reviewComment: text('review_comment'),
  effectiveDate: timestamp('effective_date'),
  reviewedAt: timestamp('reviewed_at'),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// 3. CENTRAL NOTIFICATIONS & COMMUNICATIONS
// ============================================================================

export const notificationTemplates = pgTable('notification_templates', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  category: text('category').notNull(), // SECURITY | ACADEMIC | FINANCE | ADMISSIONS | DOCUMENT | SYSTEM | GENERAL
  titleTemplate: text('title_template').notNull(),
  bodyTemplate: text('body_template').notNull(),
  channels: jsonb('channels').$type<string[]>().notNull().default(['IN_APP']),
  mandatory: boolean('mandatory').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  recipientUserId: integer('recipient_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull().default('GENERAL'),
  priority: text('priority').notNull().default('NORMAL'), // LOW | NORMAL | HIGH | CRITICAL
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  senderName: text('sender_name').notNull().default('HI-TECH College System'),
  readAt: timestamp('read_at'),
  archivedAt: timestamp('archived_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: text('id').primaryKey(),
  notificationId: text('notification_id')
    .references(() => notifications.id, { onDelete: 'cascade' })
    .notNull(),
  channel: text('channel').notNull(), // IN_APP | EMAIL | SMS | PUSH
  status: text('status').notNull().default('DELIVERED'), // QUEUED | SENT | DELIVERED | FAILED
  attemptCount: integer('attempt_count').notNull().default(1),
  providerMessageId: text('provider_message_id'),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    category: text('category').notNull(),
    inAppEnabled: boolean('in_app_enabled').notNull().default(true),
    emailEnabled: boolean('email_enabled').notNull().default(true),
    smsEnabled: boolean('sms_enabled').notNull().default(false),
    pushEnabled: boolean('push_enabled').notNull().default(true),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('notif_pref_user_cat_idx').on(table.userId, table.category)]
);

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  endpoint: text('endpoint').notNull(),
  deviceLabel: text('device_label').notNull().default('Web Push Client'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const broadcastCampaigns = pgTable('broadcast_campaigns', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  targetAudience: text('target_audience').notNull(), // ALL_USERS | ALL_STUDENTS | ALL_STAFF | CAMPUS | ROLE
  targetScopeValue: text('target_scope_value'),
  channels: jsonb('channels').$type<string[]>().notNull().default(['IN_APP']),
  message: text('message').notNull(),
  recipientCount: integer('recipient_count').notNull().default(0),
  sentByUserId: integer('sent_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  sentByName: text('sent_by_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// 4. DIGITAL SIGNATURES & INSTITUTIONAL APPROVALS
// ============================================================================

export const signingAuthorities = pgTable('signing_authorities', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  staffId: text('staff_id').notNull(),
  fullName: text('full_name').notNull(),
  roleTitle: text('role_title').notNull(),
  departmentName: text('department_name').notNull(),
  authorizedCategories: jsonb('authorized_categories').$type<string[]>().notNull().default([]),
  maxApprovalLevel: text('max_approval_level').notNull().default('INSTITUTIONAL'),
  active: boolean('active').notNull().default(true),
  delegatedToStaffId: text('delegated_to_staff_id'),
  delegatedToName: text('delegated_to_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const signingCertificates = pgTable('signing_certificates', {
  id: text('id').primaryKey(),
  serialNumber: text('serial_number').notNull().unique(),
  subjectName: text('subject_name').notNull(),
  issuerName: text('issuer_name').notNull().default('HI-TECH College Institutional Root CA'),
  fingerprintSha256: text('fingerprint_sha256').notNull(),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | REVOKED | EXPIRED
  revokedReason: text('revoked_reason'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const signatureRequests = pgTable('signature_requests', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull(),
  documentTitle: text('document_title').notNull(),
  documentReference: text('document_reference'),
  versionNumber: integer('version_number').notNull().default(1),
  versionChecksumSha256: text('version_checksum_sha256').notNull(),
  signingMode: text('signing_mode').notNull().default('SEQUENTIAL'), // SEQUENTIAL | PARALLEL
  status: text('status').notNull().default('PENDING'), // PENDING | IN_PROGRESS | COMPLETED | REJECTED | CANCELLED
  verificationCode: text('verification_code').notNull().unique(),
  requestedById: text('requested_by_id').notNull(),
  requestedByName: text('requested_by_name').notNull(),
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documentSigners = pgTable('document_signers', {
  id: text('id').primaryKey(),
  requestId: text('request_id')
    .references(() => signatureRequests.id, { onDelete: 'cascade' })
    .notNull(),
  stepOrder: integer('step_order').notNull().default(1),
  signerStaffId: text('signer_staff_id').notNull(),
  signerName: text('signer_name').notNull(),
  signerRole: text('signer_role').notNull(),
  signerTitle: text('signer_title').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | SIGNED | DECLINED | DELEGATED
  declineReason: text('decline_reason'),
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const signatureRecords = pgTable('signature_records', {
  id: text('id').primaryKey(),
  requestId: text('request_id')
    .references(() => signatureRequests.id, { onDelete: 'cascade' })
    .notNull(),
  signerRowId: text('signer_row_id')
    .references(() => documentSigners.id, { onDelete: 'cascade' })
    .notNull(),
  documentId: text('document_id').notNull(),
  signerStaffId: text('signer_staff_id').notNull(),
  signerName: text('signer_name').notNull(),
  signerTitle: text('signer_title').notNull(),
  signatureType: text('signature_type').notNull().default('TYPED'), // TYPED | DRAWN | INSTITUTIONAL_CERT
  signaturePayload: text('signature_payload').notNull(), // Typed name or drawn data URI / hash reference
  certificateId: text('certificate_id').references(() => signingCertificates.id, { onDelete: 'set null' }),
  documentChecksumSha256: text('document_checksum_sha256').notNull(),
  signatureDigest: text('signature_digest').notNull().unique(),
  ipAddress: text('ip_address').notNull().default('127.0.0.1'),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
});

export const signatureAuditEvents = pgTable('signature_audit_events', {
  id: text('id').primaryKey(),
  requestId: text('request_id')
    .references(() => signatureRequests.id, { onDelete: 'cascade' })
    .notNull(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  eventType: text('event_type').notNull(),
  detail: text('detail').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// 5. INSTITUTIONAL ACADEMIC STRUCTURE & ACADEMIC REGISTRATION (PRIORITY 1)
// ============================================================================

export const campuses = pgTable('campuses', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  isMain: boolean('is_main').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  facultyName: text('faculty_name').notNull().default('School of Computing & Technology'),
  campusId: text('campus_id')
    .references(() => campuses.id, { onDelete: 'restrict' })
    .notNull(),
  hodName: text('hod_name'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const programmes = pgTable('programmes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  level: text('level').notNull().default('DIPLOMA'), // DIPLOMA | CERTIFICATE | ARTISAN | SHORT_COURSE
  examBody: text('exam_body').notNull().default('CDACC'), // TVETA | CDACC | KNEC | KASNEB | NITA
  departmentId: text('department_id')
    .references(() => departments.id, { onDelete: 'restrict' })
    .notNull(),
  durationSemesters: integer('duration_semesters').notNull().default(6),
  tuitionPerSemesterKes: integer('tuition_per_semester_kes').notNull().default(28500),
  tvetaApproved: boolean('tveta_approved').notNull().default(true),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const academicPeriods = pgTable('academic_periods', {
  id: text('id').primaryKey(),
  academicYear: text('academic_year').notNull(), // e.g. 2026
  semesterName: text('semester_name').notNull(), // Trimester 1 | Trimester 2 | Trimester 3
  intakeCode: text('intake_code').notNull().unique(), // e.g. 2026-MAY
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  registrationOpen: boolean('registration_open').notNull().default(true),
  isCurrent: boolean('is_current').notNull().default(false),
  status: text('status').notNull().default('ACTIVE'), // UPCOMING | ACTIVE | CLOSED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const academicRegistrations = pgTable('academic_registrations', {
  id: text('id').primaryKey(),
  studentProfileId: text('student_profile_id')
    .references(() => studentProfiles.id, { onDelete: 'restrict' })
    .notNull(),
  academicPeriodId: text('academic_period_id')
    .references(() => academicPeriods.id, { onDelete: 'restrict' })
    .notNull(),
  unitsJson: jsonb('units_json').$type<Array<{ code: string; title: string; credits: number }>>().notNull().default([]),
  totalCredits: integer('total_credits').notNull().default(0),
  feeThresholdCleared: boolean('fee_threshold_cleared').notNull().default(true),
  approvalStatus: text('approval_status').notNull().default('APPROVED'), // PENDING | APPROVED | REJECTED
  approvedByName: text('approved_by_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// 6. CENTRAL FEATURE REGISTER & SPRINT BASELINE TRACKER
// ============================================================================

export const platformFeatures = pgTable('platform_features', {
  featureId: text('feature_id').primaryKey(), // e.g. FEAT-001..FEAT-084
  moduleNumber: integer('module_number').notNull().unique(),
  systemCode: text('system_code').notNull(), // A..L
  systemName: text('system_name').notNull(),
  moduleName: text('module_name').notNull(),
  description: text('description').notNull(),
  priority: integer('priority').notNull().default(1), // 1..4
  status: text('status').notNull().default('Prototype'), // Planned | Existing | Prototype | In progress | Blocked | Testing | Verified | Released
  backendStatus: text('backend_status').notNull().default('Not started'),
  databaseStatus: text('database_status').notNull().default('Planned'),
  frontendStatus: text('frontend_status').notNull().default('Prototype'),
  testStatus: text('test_status').notNull().default('Pending'),
  dependencies: jsonb('dependencies').$type<string[]>().notNull().default([]),
  assignedOwner: text('assigned_owner').notNull().default('Platform Team'),
  acceptanceCriteria: text('acceptance_criteria').notNull(),
  releaseVersion: text('release_version').notNull().default('v1.0-baseline'),
  portalPath: text('portal_path'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sprintBaselineTasks = pgTable('sprint_baseline_tasks', {
  id: text('id').primaryKey(),
  sprintCode: text('sprint_code').notNull().default('SPRINT-1'),
  orderIndex: integer('order_index').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  completed: boolean('completed').notNull().default(false),
  evidenceSummary: text('evidence_summary').notNull().default(''),
  verifiedBy: text('verified_by'),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(userSessions),
  notifications: many(notifications),
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  mfaSettings: one(mfaSettings, {
    fields: [users.id],
    references: [mfaSettings.userId],
  }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
  guardians: many(studentGuardians),
  emergencyContacts: many(studentEmergencyContacts),
  statusHistory: many(studentStatusHistory),
  changeRequests: many(studentChangeRequests),
  academicRegistrations: many(academicRegistrations),
}));

export const signatureRequestsRelations = relations(signatureRequests, ({ many }) => ({
  signers: many(documentSigners),
  records: many(signatureRecords),
  auditEvents: many(signatureAuditEvents),
}));

export const campusesRelations = relations(campuses, ({ many }) => ({
  departments: many(departments),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  campus: one(campuses, {
    fields: [departments.campusId],
    references: [campuses.id],
  }),
  programmes: many(programmes),
}));

export const programmesRelations = relations(programmes, ({ one }) => ({
  department: one(departments, {
    fields: [programmes.departmentId],
    references: [departments.id],
  }),
}));

export const academicPeriodsRelations = relations(academicPeriods, ({ many }) => ({
  registrations: many(academicRegistrations),
}));

export const academicRegistrationsRelations = relations(academicRegistrations, ({ one }) => ({
  studentProfile: one(studentProfiles, {
    fields: [academicRegistrations.studentProfileId],
    references: [studentProfiles.id],
  }),
  academicPeriod: one(academicPeriods, {
    fields: [academicRegistrations.academicPeriodId],
    references: [academicPeriods.id],
  }),
}));

// ============================================================================
// 7. TEACHING, LESSON DELIVERY & STUDENT ATTENDANCE MANAGEMENT MODULE
// ============================================================================

export const teachingDocuments = pgTable('teaching_documents', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull(),
  departmentId: text('department_id').notNull(),
  departmentName: text('department_name').notNull(),
  courseName: text('course_name').notNull(),
  classGroupId: text('class_group_id').notNull(),
  unitCode: text('unit_code').notNull(),
  unitTitle: text('unit_title').notNull(),
  academicYear: text('academic_year').notNull(),
  term: text('term').notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('DRAFT'), // DRAFT | SUBMITTED | APPROVED | RETURNED | ARCHIVED
  currentVersion: integer('current_version').notNull().default(1),
  uploadedById: text('uploaded_by_id').notNull(),
  uploadedByName: text('uploaded_by_name').notNull(),
  approvedById: text('approved_by_id'),
  approvedByName: text('approved_by_name'),
  approvalComments: text('approval_comments'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teachingDocumentVersions = pgTable('teaching_document_versions', {
  id: text('id').primaryKey(),
  documentId: text('document_id')
    .references(() => teachingDocuments.id, { onDelete: 'cascade' })
    .notNull(),
  versionNumber: integer('version_number').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  fileContentBase64: text('file_content_base64').notNull().default(''),
  changeSummary: text('change_summary').notNull().default('Initial upload'),
  uploadedById: text('uploaded_by_id').notNull(),
  uploadedByName: text('uploaded_by_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teachingDocumentApprovals = pgTable('teaching_document_approvals', {
  id: text('id').primaryKey(),
  documentId: text('document_id')
    .references(() => teachingDocuments.id, { onDelete: 'cascade' })
    .notNull(),
  reviewerId: text('reviewer_id').notNull(),
  reviewerName: text('reviewer_name').notNull(),
  reviewerRole: text('reviewer_role').notNull(),
  decision: text('decision').notNull(), // APPROVED | RETURNED | SUBMITTED | ARCHIVED
  comment: text('comment'),
  decidedAt: timestamp('decided_at').defaultNow().notNull(),
});

export const schemesOfWork = pgTable('schemes_of_work', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull(),
  departmentId: text('department_id').notNull(),
  unitCode: text('unit_code').notNull(),
  unitTitle: text('unit_title').notNull(),
  classGroupId: text('class_group_id').notNull(),
  academicYear: text('academic_year').notNull(),
  term: text('term').notNull(),
  title: text('title').notNull(),
  lecturerId: text('lecturer_id').notNull(),
  lecturerName: text('lecturer_name').notNull(),
  status: text('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const schemeOfWorkTopics = pgTable('scheme_of_work_topics', {
  id: text('id').primaryKey(),
  schemeId: text('scheme_id')
    .references(() => schemesOfWork.id, { onDelete: 'cascade' })
    .notNull(),
  weekNumber: integer('week_number').notNull(),
  plannedDate: text('planned_date').notNull(),
  topicTitle: text('topic_title').notNull(),
  subtopics: text('subtopics').notNull().default(''),
  learningOutcomes: text('learning_outcomes').notNull().default(''),
  activities: text('activities').notNull().default(''),
  resources: text('resources').notNull().default(''),
  covered: boolean('covered').notNull().default(false),
  actualCoveredDate: text('actual_covered_date'),
  lessonDeliveryId: text('lesson_delivery_id'),
  remarks: text('remarks'),
});

export const attendanceSessions = pgTable('attendance_sessions', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull(),
  departmentId: text('department_id').notNull(),
  unitCode: text('unit_code').notNull(),
  unitTitle: text('unit_title').notNull(),
  classGroupId: text('class_group_id').notNull(),
  timetableEntryId: text('timetable_entry_id'),
  lecturerId: text('lecturer_id').notNull(),
  lecturerName: text('lecturer_name').notNull(),
  substituteLecturerId: text('substitute_lecturer_id'),
  substituteLecturerName: text('substitute_lecturer_name'),
  sessionDate: text('session_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  roomName: text('room_name').notNull(),
  qrToken: text('qr_token'),
  qrExpiresAt: timestamp('qr_expires_at'),
  locked: boolean('locked').notNull().default(false),
  submittedAt: timestamp('submitted_at'),
  totalStudents: integer('total_students').notNull().default(0),
  presentCount: integer('present_count').notNull().default(0),
  lateCount: integer('late_count').notNull().default(0),
  absentCount: integer('absent_count').notNull().default(0),
  excusedCount: integer('excused_count').notNull().default(0),
  attendanceRate: integer('attendance_rate').notNull().default(100),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendanceRecords = pgTable('attendance_records', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .references(() => attendanceSessions.id, { onDelete: 'cascade' })
    .notNull(),
  studentProfileId: text('student_profile_id'),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  status: text('status').notNull().default('PRESENT'), // PRESENT | LATE | ABSENT | EXCUSED
  method: text('method').notNull().default('ROLL_CALL'), // ROLL_CALL | QR_CHECKIN
  arrivalTime: text('arrival_time'),
  departureTime: text('departure_time'),
  remarks: text('remarks'),
  markedById: text('marked_by_id').notNull(),
  markedByName: text('marked_by_name').notNull(),
  markedAt: timestamp('marked_at').defaultNow().notNull(),
});

export const attendanceCorrections = pgTable('attendance_corrections', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .references(() => attendanceSessions.id, { onDelete: 'cascade' })
    .notNull(),
  recordId: text('record_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  previousStatus: text('previous_status').notNull(),
  requestedStatus: text('requested_status').notNull(),
  reason: text('reason').notNull(),
  requestedById: text('requested_by_id').notNull(),
  requestedByName: text('requested_by_name').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | APPROVED | REJECTED
  reviewedById: text('reviewed_by_id'),
  reviewedByName: text('reviewed_by_name'),
  reviewNote: text('review_note'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const lessonDeliveryRecords = pgTable('lesson_delivery_records', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull(),
  attendanceSessionId: text('attendance_session_id')
    .references(() => attendanceSessions.id, { onDelete: 'restrict' })
    .notNull(),
  timetableEntryId: text('timetable_entry_id'),
  schemeTopicId: text('scheme_topic_id'),
  academicYear: text('academic_year').notNull(),
  term: text('term').notNull(),
  departmentId: text('department_id').notNull(),
  departmentName: text('department_name').notNull(),
  courseName: text('course_name').notNull(),
  classGroupId: text('class_group_id').notNull(),
  unitCode: text('unit_code').notNull(),
  unitTitle: text('unit_title').notNull(),
  lecturerId: text('lecturer_id').notNull(),
  lecturerName: text('lecturer_name').notNull(),
  actualTrainerId: text('actual_trainer_id').notNull(),
  actualTrainerName: text('actual_trainer_name').notNull(),
  isSubstitute: boolean('is_substitute').notNull().default(false),
  lessonDate: text('lesson_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(120),
  roomName: text('room_name').notNull(),
  plannedTopic: text('planned_topic').notNull(),
  actualTopicTaught: text('actual_topic_taught').notNull().default(''),
  subtopicsCovered: text('subtopics_covered').notNull().default(''),
  learningObjectivesAchieved: text('learning_objectives_achieved').notNull().default(''),
  teachingMethods: text('teaching_methods').notNull().default(''),
  practicalsDone: text('practicals_done').notNull().default(''),
  pagesOrSectionsCovered: text('pages_or_sections_covered').notNull().default(''),
  challengesFaced: text('challenges_faced').notNull().default(''),
  homeworkAssigned: text('homework_assigned').notNull().default(''),
  nextLessonPlan: text('next_lesson_plan').notNull().default(''),
  supportingDocumentIdsJson: jsonb('supporting_document_ids_json').$type<string[]>().notNull().default([]),
  trainerRemarks: text('trainer_remarks').notNull().default(''),
  status: text('status').notNull().default('SCHEDULED'), // SCHEDULED | CONDUCTED | PARTIALLY_CONDUCTED | NOT_CONDUCTED | RESCHEDULED
  hodReviewStatus: text('hod_review_status').notNull().default('PENDING'), // PENDING | VERIFIED | FLAGGED
  hodReviewerName: text('hod_reviewer_name'),
  hodReviewComments: text('hod_review_comments'),
  hodReviewedAt: timestamp('hod_reviewed_at'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const lessonObservations = pgTable('lesson_observations', {
  id: text('id').primaryKey(),
  lessonDeliveryId: text('lesson_delivery_id')
    .references(() => lessonDeliveryRecords.id, { onDelete: 'cascade' })
    .notNull(),
  unitCode: text('unit_code').notNull(),
  lecturerId: text('lecturer_id').notNull(),
  lecturerName: text('lecturer_name').notNull(),
  observerId: text('observer_id').notNull(),
  observerName: text('observer_name').notNull(),
  observerRole: text('observer_role').notNull(),
  observationDate: text('observation_date').notNull(),
  pedagogyScore: integer('pedagogy_score').notNull().default(4),
  preparationScore: integer('preparation_score').notNull().default(4),
  engagementScore: integer('engagement_score').notNull().default(4),
  strengths: text('strengths').notNull(),
  recommendations: text('recommendations').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentAbsenceCases = pgTable('student_absence_cases', {
  id: text('id').primaryKey(),
  attendanceSessionId: text('attendance_session_id')
    .references(() => attendanceSessions.id, { onDelete: 'cascade' })
    .notNull(),
  attendanceRecordId: text('attendance_record_id').notNull(),
  lessonDeliveryId: text('lesson_delivery_id'),
  studentProfileId: text('student_profile_id'),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  departmentId: text('department_id').notNull(),
  departmentName: text('department_name').notNull(),
  courseName: text('course_name').notNull(),
  unitCode: text('unit_code').notNull(),
  unitTitle: text('unit_title').notNull(),
  classGroupId: text('class_group_id').notNull(),
  lecturerId: text('lecturer_id').notNull(),
  lecturerName: text('lecturer_name').notNull(),
  absenceDate: text('absence_date').notNull(),
  consecutiveAbsenceCount: integer('consecutive_absence_count').notNull().default(1),
  unitAbsenceCount: integer('unit_absence_count').notNull().default(1),
  termAbsenceCount: integer('term_absence_count').notNull().default(1),
  status: text('status').notNull().default('AWAITING_EXPLANATION'),
  escalationLevel: text('escalation_level').notNull().default('NONE'), // NONE | LECTURER | HOD | PRINCIPAL
  assignedReviewerRole: text('assigned_reviewer_role').notNull().default('LECTURER'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const absenceExplanations = pgTable('absence_explanations', {
  id: text('id').primaryKey(),
  absenceCaseId: text('absence_case_id')
    .references(() => studentAbsenceCases.id, { onDelete: 'cascade' })
    .notNull(),
  source: text('source').notNull(), // STUDENT_PORTAL | TRAINER_VERBAL_ENTRY
  category: text('category').notNull(), // MEDICAL | FAMILY_EMERGENCY | OFFICIAL_DUTY | TRANSPORT | FINANCIAL | OTHER
  reasonText: text('reason_text').notNull(),
  trainerRecordedNote: text('trainer_recorded_note'),
  studentConfirmedAccuracy: boolean('student_confirmed_accuracy').notNull().default(false),
  studentConfirmedAt: timestamp('student_confirmed_at'),
  submittedById: text('submitted_by_id').notNull(),
  submittedByName: text('submitted_by_name').notNull(),
  submittedByRole: text('submitted_by_role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const absenceEvidence = pgTable('absence_evidence', {
  id: text('id').primaryKey(),
  absenceCaseId: text('absence_case_id')
    .references(() => studentAbsenceCases.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  fileContentBase64: text('file_content_base64').notNull().default(''),
  description: text('description').notNull(),
  isConfidentialMedical: boolean('is_confidential_medical').notNull().default(true),
  uploadedById: text('uploaded_by_id').notNull(),
  uploadedByName: text('uploaded_by_name').notNull(),
  uploadedByRole: text('uploaded_by_role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const absenceReviews = pgTable('absence_reviews', {
  id: text('id').primaryKey(),
  absenceCaseId: text('absence_case_id')
    .references(() => studentAbsenceCases.id, { onDelete: 'cascade' })
    .notNull(),
  reviewerId: text('reviewer_id').notNull(),
  reviewerName: text('reviewer_name').notNull(),
  reviewerRole: text('reviewer_role').notNull(),
  decision: text('decision').notNull(), // UNDER_REVIEW | RECOMMENDED | APPROVED | REJECTED | ESCALATED | CLOSED
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const absenceEscalations = pgTable('absence_escalations', {
  id: text('id').primaryKey(),
  absenceCaseId: text('absence_case_id')
    .references(() => studentAbsenceCases.id, { onDelete: 'cascade' })
    .notNull(),
  fromRole: text('from_role').notNull(),
  toRole: text('to_role').notNull(),
  triggerRule: text('trigger_rule').notNull(),
  reason: text('reason').notNull(),
  escalatedById: text('escalated_by_id').notNull(),
  escalatedByName: text('escalated_by_name').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  resolvedByName: text('resolved_by_name'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const catchUpLessons = pgTable('catch_up_lessons', {
  id: text('id').primaryKey(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  absenceCaseId: text('absence_case_id'),
  unitCode: text('unit_code').notNull(),
  unitTitle: text('unit_title').notNull(),
  missedLessonDate: text('missed_lesson_date').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  scheduledTime: text('scheduled_time').notNull(),
  trainerId: text('trainer_id').notNull(),
  trainerName: text('trainer_name').notNull(),
  roomOrLink: text('room_or_link').notNull(),
  materialsAttached: text('materials_attached').notNull().default(''),
  status: text('status').notNull().default('SCHEDULED'), // SCHEDULED | COMPLETED | MISSED
  completionNotes: text('completion_notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const academicInterventions = pgTable('academic_interventions', {
  id: text('id').primaryKey(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  unitCode: text('unit_code').notNull(),
  departmentId: text('department_id').notNull(),
  triggerReason: text('trigger_reason').notNull(),
  interventionPlan: text('intervention_plan').notNull(),
  ownerId: text('owner_id').notNull(),
  ownerName: text('owner_name').notNull(),
  status: text('status').notNull().default('OPEN'), // OPEN | IN_PROGRESS | COMPLETED
  followUpDate: text('follow_up_date').notNull(),
  outcomeNotes: text('outcome_notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendancePolicies = pgTable('attendance_policies', {
  id: text('id').primaryKey(),
  policyName: text('policy_name').notNull().default('HI-TECH College Official Attendance & Teaching Governance Policy'),
  minimumExamAttendancePct: integer('minimum_exam_attendance_pct').notNull().default(75),
  lateThresholdMinutes: integer('late_threshold_minutes').notNull().default(15),
  consecutiveAbsenceTrainerAlert: integer('consecutive_absence_trainer_alert').notNull().default(2),
  unitAbsenceHodAlert: integer('unit_absence_hod_alert').notNull().default(3),
  termAbsenceHodEscalation: integer('term_absence_hod_escalation').notNull().default(5),
  unresolvedPrincipalEscalation: integer('unresolved_principal_escalation').notNull().default(6),
  lessonRecordOverdueHours: integer('lesson_record_overdue_hours').notNull().default(24),
  allowQrCheckIn: boolean('allow_qr_check_in').notNull().default(true),
  qrValidityMinutes: integer('qr_validity_minutes').notNull().default(15),
  updatedByName: text('updated_by_name').notNull().default('Dr. Samuel Karanja'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendanceAlerts = pgTable('attendance_alerts', {
  id: text('id').primaryKey(),
  targetRole: text('target_role').notNull(), // STUDENT | LECTURER | HOD | REGISTRAR | PRINCIPAL | STUDENT_AFFAIRS
  targetUserId: text('target_user_id'),
  targetStudentRegNo: text('target_student_reg_no'),
  departmentId: text('department_id'),
  severity: text('severity').notNull().default('WARNING'), // INFO | WARNING | CRITICAL
  category: text('category').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedEntityId: text('related_entity_id'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teachingAuditLogs = pgTable('teaching_audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  detail: text('detail').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// PUBLIC & STAFF EVENTS MANAGEMENT + REGISTRATION SYSTEM
// ============================================================

export const collegeEvents = pgTable('college_events', {
  id: text('id').primaryKey(),
  eventCode: text('event_code').notNull().unique(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  shortDescription: text('short_description').notNull(),
  fullDescription: text('full_description').notNull(),
  eventDate: text('event_date').notNull(),
  endDate: text('end_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  timezone: text('timezone').notNull().default('Africa/Nairobi'),
  isMultiDay: boolean('is_multi_day').notNull().default(false),
  recurrencePattern: text('recurrence_pattern').notNull().default('NONE'),
  campus: text('campus').notNull().default('Nairobi Main Campus'),
  venueId: text('venue_id'),
  venue: text('venue').notNull(),
  building: text('building').notNull().default(''),
  room: text('room').notNull().default(''),
  mapsLink: text('maps_link').notNull().default(''),
  onlinePlatform: text('online_platform').notNull().default(''),
  accessibilityInfo: text('accessibility_info').notNull().default(''),
  parkingInfo: text('parking_info').notNull().default(''),
  mode: text('mode').notNull().default('PHYSICAL'),
  meetingUrl: text('meeting_url').notNull().default(''),
  organisingDepartmentId: text('organising_department_id'),
  organisingDepartmentName: text('organising_department_name').notNull(),
  organizerName: text('organizer_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  showContactPhonePublicly: boolean('show_contact_phone_publicly').notNull().default(true),
  targetAudience: text('target_audience').notNull(),
  requirements: text('requirements').notNull().default(''),
  language: text('language').notNull().default('English'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  visibility: text('visibility').notNull().default('PUBLIC'),
  audienceRestriction: text('audience_restriction').notNull().default('PUBLIC'),
  capacity: integer('capacity').notNull().default(100),
  waitlistCapacity: integer('waitlist_capacity').notNull().default(25),
  registeredCount: integer('registered_count').notNull().default(0),
  waitlistCount: integer('waitlist_count').notNull().default(0),
  checkedInCount: integer('checked_in_count').notNull().default(0),
  checkedOutCount: integer('checked_out_count').notNull().default(0),
  registrationOpenDate: text('registration_open_date').notNull().default(''),
  registrationDeadline: text('registration_deadline').notNull(),
  isPaid: boolean('is_paid').notNull().default(false),
  feeAmount: integer('fee_amount').notNull().default(0),
  studentFeeAmount: integer('student_fee_amount').notNull().default(0),
  feeCurrency: text('fee_currency').notNull().default('KES'),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  allowWaitlist: boolean('allow_waitlist').notNull().default(true),
  allowSelfCancel: boolean('allow_self_cancel').notNull().default(true),
  reminderHours: jsonb('reminder_hours').$type<number[]>().notNull().default([24, 2]),
  confirmationMessage: text('confirmation_message').notNull().default(''),
  certificateEnabled: boolean('certificate_enabled').notNull().default(false),
  certificateType: text('certificate_type').notNull().default('Certificate of Participation'),
  certificateMinAttendance: boolean('certificate_min_attendance').notNull().default(true),
  feedbackEnabled: boolean('feedback_enabled').notNull().default(true),
  bannerImageUrl: text('banner_image_url').notNull().default(''),
  featured: boolean('featured').notNull().default(false),
  status: text('status').notNull().default('DRAFT'),
  isPublished: boolean('is_published').notNull().default(false),
  createdById: text('created_by_id').notNull(),
  createdByName: text('created_by_name').notNull(),
  approvedById: text('approved_by_id'),
  approvedByName: text('approved_by_name'),
  approvedAt: timestamp('approved_at'),
  publishedById: text('published_by_id'),
  publishedByName: text('published_by_name'),
  publishedAt: timestamp('published_at'),
  cancelledReason: text('cancelled_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collegeEventSchedules = pgTable('college_event_schedules', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  dayNumber: integer('day_number').notNull().default(1),
  timeRange: text('time_range').notNull(),
  title: text('title').notNull(),
  speakerName: text('speaker_name').notNull().default(''),
  location: text('location').notNull().default(''),
  description: text('description').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const collegeEventSpeakers = pgTable('college_event_speakers', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  roleTitle: text('role_title').notNull(),
  speakerRole: text('speaker_role').notNull().default('Guest Speaker'),
  organization: text('organization').notNull().default('HI-TECH College'),
  bio: text('bio').notNull().default(''),
  photoUrl: text('photo_url').notNull().default(''),
  confirmationStatus: text('confirmation_status').notNull().default('CONFIRMED'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const collegeEventRegistrations = pgTable('college_event_registrations', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  registrationNumber: text('registration_number').notNull().unique(),
  lookupTokenHash: text('lookup_token_hash').notNull(),
  qrToken: text('qr_token').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  participantCategory: text('participant_category').notNull(),
  organizationOrInstitution: text('organization_or_institution').notNull().default(''),
  studentOrStaffNumber: text('student_or_staff_number').notNull().default(''),
  attendanceMode: text('attendance_mode').notNull().default('PHYSICAL'),
  ticketType: text('ticket_type').notNull().default('General Admission'),
  paymentStatus: text('payment_status').notNull().default('PAID'),
  amountDue: integer('amount_due').notNull().default(0),
  amountPaid: integer('amount_paid').notNull().default(0),
  specialRequirements: text('special_requirements').notNull().default(''),
  consentAccepted: boolean('consent_accepted').notNull().default(true),
  status: text('status').notNull().default('CONFIRMED'),
  checkedIn: boolean('checked_in').notNull().default(false),
  checkedInAt: timestamp('checked_in_at'),
  checkedInById: text('checked_in_by_id'),
  checkedInByName: text('checked_in_by_name'),
  checkedOut: boolean('checked_out').notNull().default(false),
  checkedOutAt: timestamp('checked_out_at'),
  reviewedByName: text('reviewed_by_name'),
  reviewNote: text('review_note'),
  organiserNotes: text('organiser_notes').notNull().default(''),
  certificateCode: text('certificate_code'),
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collegeEventVenues = pgTable('college_event_venues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  campus: text('campus').notNull(),
  building: text('building').notNull(),
  venueType: text('venue_type').notNull(),
  capacity: integer('capacity').notNull().default(100),
  seatingLayout: text('seating_layout').notNull().default(''),
  resources: jsonb('resources').$type<string[]>().notNull().default([]),
  accessibilityFeatures: text('accessibility_features').notNull().default(''),
  maintenanceStatus: text('maintenance_status').notNull().default('AVAILABLE'),
});

export const collegeEventPayments = pgTable('college_event_payments', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  registrationId: text('registration_id')
    .references(() => collegeEventRegistrations.id, { onDelete: 'cascade' })
    .notNull(),
  registrationNumber: text('registration_number').notNull(),
  participantName: text('participant_name').notNull(),
  participantEmail: text('participant_email').notNull(),
  ticketType: text('ticket_type').notNull(),
  amount: integer('amount').notNull().default(0),
  currency: text('currency').notNull().default('KES'),
  method: text('method').notNull().default('MPESA'),
  transactionRef: text('transaction_ref').notNull(),
  status: text('status').notNull().default('PENDING'),
  verifiedById: text('verified_by_id'),
  verifiedByName: text('verified_by_name'),
  verifiedAt: timestamp('verified_at'),
  refundReason: text('refund_reason'),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collegeEventInvitations = pgTable('college_event_invitations', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  invitationCode: text('invitation_code').notNull().unique(),
  inviteeName: text('invitee_name').notNull(),
  inviteeEmail: text('invitee_email').notNull(),
  inviteePhone: text('invitee_phone').notNull().default(''),
  groupName: text('group_name').notNull().default(''),
  status: text('status').notNull().default('SENT'),
  expiresAt: text('expires_at').notNull(),
  convertedRegistrationId: text('converted_registration_id'),
  invitedByName: text('invited_by_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collegeEventFeedbacks = pgTable('college_event_feedbacks', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  registrationId: text('registration_id'),
  respondentName: text('respondent_name').notNull(),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  overallRating: integer('overall_rating').notNull(),
  speakerRating: integer('speaker_rating').notNull(),
  organisationRating: integer('organisation_rating').notNull(),
  venueRating: integer('venue_rating').notNull(),
  recommendNps: integer('recommend_nps').notNull(),
  comments: text('comments').notNull().default(''),
  futureTopicInterest: text('future_topic_interest').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collegeEventCertificates = pgTable('college_event_certificates', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  registrationId: text('registration_id')
    .references(() => collegeEventRegistrations.id, { onDelete: 'cascade' })
    .notNull(),
  certificateNumber: text('certificate_number').notNull().unique(),
  verificationCode: text('verification_code').notNull().unique(),
  participantName: text('participant_name').notNull(),
  participantEmail: text('participant_email').notNull(),
  certificateType: text('certificate_type').notNull(),
  status: text('status').notNull().default('ISSUED'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  issuedByName: text('issued_by_name').notNull(),
  revokedReason: text('revoked_reason'),
});

export const collegeEventMedia = pgTable('college_event_media', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  mediaType: text('media_type').notNull(),
  url: text('url').notNull(),
  caption: text('caption').notNull().default(''),
  altText: text('alt_text').notNull().default(''),
  visibility: text('visibility').notNull().default('PUBLIC'),
  consentVerified: boolean('consent_verified').notNull().default(true),
  uploadedByName: text('uploaded_by_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collegeEventSettings = pgTable('college_event_settings', {
  id: text('id').primaryKey(),
  defaultCurrency: text('default_currency').notNull().default('KES'),
  defaultTimezone: text('default_timezone').notNull().default('Africa/Nairobi'),
  autoGenerateTickets: boolean('auto_generate_tickets').notNull().default(true),
  allowGuestRegistration: boolean('allow_guest_registration').notNull().default(true),
  requireFeedbackConsent: boolean('require_feedback_consent').notNull().default(true),
  defaultReminderHours: jsonb('default_reminder_hours').$type<number[]>().notNull().default([48, 24, 2]),
  dataRetentionDays: integer('data_retention_days').notNull().default(365),
  updatedByName: text('updated_by_name').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collegeEventNotifications = pgTable('college_event_notifications', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => collegeEvents.id, { onDelete: 'cascade' })
    .notNull(),
  registrationId: text('registration_id'),
  channel: text('channel').notNull().default('EMAIL'),
  recipientName: text('recipient_name').notNull(),
  recipientTarget: text('recipient_target').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('DISPATCHED'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collegeEventAuditLogs = pgTable('college_event_audit_logs', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  detail: text('detail').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// 9. SECURE ONLINE EXAMINATION & PROCTORING MODULE
// ============================================================================

export const secureExamDefinitions = pgTable('secure_exam_definitions', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  unitCode: text('unit_code').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  totalMarks: integer('total_marks').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  maxAttempts: integer('max_attempts').notNull().default(1),
  instructions: jsonb('instructions').$type<string[]>().notNull().default([]),
  securityPolicy: jsonb('security_policy').$type<Record<string, unknown>>().notNull(),
  questions: jsonb('questions').$type<Record<string, unknown>[]>().notNull().default([]),
  updatedAt: text('updated_at').notNull(),
});

export const secureExamSessions = pgTable('secure_exam_sessions', {
  id: text('id').primaryKey(),
  examId: text('exam_id')
    .references(() => secureExamDefinitions.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  attemptNumber: integer('attempt_number').notNull().default(1),
  status: text('status').notNull().default('ACTIVE'),
  startedAt: text('started_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  submittedAt: text('submitted_at'),
  lastSavedAt: text('last_saved_at'),
  lastHeartbeatAt: text('last_heartbeat_at'),
  connectionLost: boolean('connection_lost').notNull().default(false),
  terminationReason: text('termination_reason'),
  terminatedBy: text('terminated_by'),
  totalMarksAwarded: integer('total_marks_awarded'),
  timeAdjustments: jsonb('time_adjustments').$type<Record<string, unknown>[]>().default([]),
  answers: jsonb('answers').$type<Record<string, unknown>[]>().notNull().default([]),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const secureExamSecurityEvents = pgTable('secure_exam_security_events', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .references(() => secureExamSessions.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: text('event_type').notNull(),
  occurredAt: text('occurred_at').notNull(),
  receivedAt: text('received_at').notNull(),
  details: text('details'),
  responseTriggered: text('response_triggered').notNull(),
});

export const secureExamIncidents = pgTable('secure_exam_incidents', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .references(() => secureExamSessions.id, { onDelete: 'cascade' })
    .notNull(),
  examId: text('exam_id').notNull(),
  examTitle: text('exam_title').notNull(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  status: text('status').notNull().default('OPEN'),
  severity: text('severity').notNull().default('MEDIUM'),
  summary: text('summary').notNull(),
  eventCount: integer('event_count').notNull().default(1),
  reviewedById: text('reviewed_by_id'),
  reviewedByName: text('reviewed_by_name'),
  reviewerNotes: text('reviewer_notes'),
  reviewedAt: text('reviewed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const secureExamMessages = pgTable('secure_exam_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .references(() => secureExamSessions.id, { onDelete: 'cascade' })
    .notNull(),
  examId: text('exam_id').notNull(),
  examTitle: text('exam_title').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  senderRole: text('sender_role').notNull(),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  kind: text('kind').notNull(),
  priority: text('priority').notNull().default('NORMAL'),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
  readByStudent: boolean('read_by_student').notNull().default(false),
  readBySupervisor: boolean('read_by_supervisor').notNull().default(false),
});

export const secureExamAuditLogs = pgTable('secure_exam_audit_logs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id'),
  examId: text('exam_id'),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  action: text('action').notNull(),
  detail: text('detail').notNull(),
  timestampIso: text('timestamp_iso').notNull(),
});

// ============================================================================
// 10. STUDENT FEES, LEDGER & M-PESA FINANCE MODULE
// ============================================================================

export const financeStudentAccounts = pgTable('finance_student_accounts', {
  studentId: text('student_id').primaryKey(),
  studentRegNo: text('student_reg_no').notNull().unique(),
  studentName: text('student_name').notNull(),
  programme: text('programme').notNull(),
  academicYear: text('academic_year').notNull(),
  termLabel: text('term_label').notNull(),
  totalFees: integer('total_fees').notNull().default(0),
  nextInstalmentAmount: integer('next_instalment_amount').notNull().default(0),
  nextInstalmentDueDate: text('next_instalment_due_date').notNull(),
  sponsorshipStatus: text('sponsorship_status').notNull().default('Self-Sponsored'),
  updatedAt: text('updated_at').notNull(),
});

export const financeLedgerCharges = pgTable('finance_ledger_charges', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  termLabel: text('term_label').notNull(),
  academicYear: text('academic_year').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  postedAt: text('posted_at').notNull(),
});

export const financePayments = pgTable('finance_payments', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  method: text('method').notNull(),
  channelLabel: text('channel_label').notNull(),
  referenceNumber: text('reference_number').notNull(),
  idempotencyKey: text('idempotency_key'),
  phoneNumber: text('phone_number'),
  bankName: text('bank_name'),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('PENDING'),
  description: text('description').notNull(),
  receiptId: text('receipt_id'),
  receiptNumber: text('receipt_number'),
  failureReason: text('failure_reason'),
  verifiedById: text('verified_by_id'),
  verifiedByName: text('verified_by_name'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  paidAt: text('paid_at'),
});

export const mpesaTransactions = pgTable('mpesa_transactions', {
  id: text('id').primaryKey(),
  paymentId: text('payment_id').notNull(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  phoneNumber: text('phone_number').notNull(),
  amount: integer('amount').notNull(),
  accountReference: text('account_reference').notNull(),
  transactionDesc: text('transaction_desc').notNull(),
  merchantRequestId: text('merchant_request_id').notNull(),
  checkoutRequestId: text('checkout_request_id').notNull().unique(),
  mpesaReceiptNumber: text('mpesa_receipt_number'),
  transactionDate: text('transaction_date'),
  resultCode: integer('result_code'),
  resultDesc: text('result_desc'),
  status: text('status').notNull().default('PENDING'),
  mode: text('mode').notNull().default('SANDBOX_SIMULATOR'),
  callbackReceivedAt: text('callback_received_at'),
  rawCallback: jsonb('raw_callback').$type<unknown>(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const financeReceipts = pgTable('finance_receipts', {
  id: text('id').primaryKey(),
  receiptNumber: text('receipt_number').notNull().unique(),
  paymentId: text('payment_id').notNull(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  programme: text('programme').notNull(),
  academicYear: text('academic_year').notNull(),
  termLabel: text('term_label').notNull(),
  method: text('method').notNull(),
  referenceNumber: text('reference_number').notNull(),
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  verificationCode: text('verification_code').notNull().unique(),
  issuedAt: text('issued_at').notNull(),
});

export const financeFeeStructures = pgTable('finance_fee_structures', {
  id: text('id').primaryKey(),
  programmeCode: text('programme_code').notNull(),
  programmeName: text('programme_name').notNull(),
  academicYear: text('academic_year').notNull(),
  termLabel: text('term_label').notNull(),
  items: jsonb('items').$type<{ code: string; label: string; amount: number }[]>().notNull().default([]),
  totalAmount: integer('total_amount').notNull(),
  active: boolean('active').notNull().default(true),
});

export const financePaymentPlans = pgTable('finance_payment_plans', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  termLabel: text('term_label').notNull(),
  totalCoveredAmount: integer('total_covered_amount').notNull(),
  instalments: jsonb('instalments').$type<Record<string, unknown>[]>().notNull().default([]),
  status: text('status').notNull().default('PENDING_APPROVAL'),
  requestedNotes: text('requested_notes'),
  reviewerNotes: text('reviewer_notes'),
  reviewedByName: text('reviewed_by_name'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const financeClearances = pgTable('finance_clearances', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  category: text('category').notNull(),
  label: text('label').notNull(),
  thresholdPercent: integer('threshold_percent').notNull(),
  status: text('status').notNull(),
  requirementNote: text('requirement_note').notNull(),
  checkedAt: text('checked_at').notNull(),
  checkedBy: text('checked_by').notNull(),
});

export const financeRefundRequests = pgTable('finance_refund_requests', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentRegNo: text('student_reg_no').notNull(),
  studentName: text('student_name').notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  payoutChannel: text('payout_channel').notNull(),
  payoutAccount: text('payout_account').notNull(),
  supportingReference: text('supporting_reference'),
  status: text('status').notNull().default('PENDING'),
  reviewerNotes: text('reviewer_notes'),
  reviewedByName: text('reviewed_by_name'),
  reviewedAt: text('reviewed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const financeAuditLogs = pgTable('finance_audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  studentRegNo: text('student_reg_no'),
  action: text('action').notNull(),
  detail: text('detail').notNull(),
  createdAt: text('created_at').notNull(),
});

// ============================================================================
// 11. UNIFIED PORTAL STATE SNAPSHOTS (DURABLE CLOUD SQL BACKUP FOR STORE)
// ============================================================================

export const portalStateSnapshots = pgTable('portal_state_snapshots', {
  snapshotKey: text('snapshot_key').primaryKey(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});




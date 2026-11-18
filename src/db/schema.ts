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

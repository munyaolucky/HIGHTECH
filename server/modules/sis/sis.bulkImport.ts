import crypto from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import {
  campuses,
  departments,
  registrationNumberSequences,
  studentProfiles,
  studentStatusHistory,
  users,
} from '../../../src/db/schema.ts';
import { programmes as pgProgrammes } from '../../../src/db/schema.ts';
import { getDb } from '../../data/store.ts';
import { hashPasswordScrypt } from '../../lib/crypto.ts';

export interface BulkStudentRowPreview {
  rowNumber: number;
  valid: boolean;
  status: 'VALID' | 'WARNING' | 'ERROR';
  errors: string[];
  warnings: string[];
  previewRegistrationNumber: string | null;
  data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    nationalId: string;
    gender: string;
    campusId: string;
    campusName: string;
    departmentId: string;
    departmentName: string;
    programmeId: string;
    programmeName: string;
    intakeName: string;
    studyMode: string;
  };
}

export interface BulkValidationResult {
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
    year: number;
  };
  rows: BulkStudentRowPreview[];
  allowedCampuses: Array<{ id: string; code: string; name: string }>;
  allowedProgrammes: Array<{ id: string; code: string; title: string }>;
}

export interface BulkImportCommitResult {
  importedCount: number;
  skippedCount: number;
  year: number;
  createdStudents: Array<{
    id: string;
    registrationNumber: string;
    fullName: string;
    email: string;
    programmeName: string;
    campusName: string;
    intakeName: string;
    status: string;
    issuedAt: string;
  }>;
  errors: Array<{ rowNumber: number; fullName: string; email: string; errors: string[] }>;
}

const VALID_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED']);
const VALID_STUDY_MODES = new Set(['FULL_TIME', 'PART_TIME', 'EVENING', 'ONLINE']);

function normalizeHeaderKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCsvMatrix(csvText: string): string[][] {
  const cleaned = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);

  return rows;
}

function hashNationalId(nationalId: string): string {
  return crypto.createHash('sha256').update(nationalId.trim().toUpperCase()).digest('hex');
}

function extractMaxSeqForYear(regNumbers: Array<string | null>, year: number): number {
  const prefix = `HCA/STU/${year}/`;
  let maxSeq = 0;
  for (const reg of regNumbers) {
    if (!reg) continue;
    const upper = reg.toUpperCase();
    if (!upper.startsWith(prefix)) continue;
    const tail = upper.slice(prefix.length);
    const num = Number.parseInt(tail, 10);
    if (Number.isFinite(num) && num > maxSeq) {
      maxSeq = num;
    }
  }
  return maxSeq;
}

export async function validateBulkStudentsForPostgres(
  csvText: string,
  academicYear: number = 2026
): Promise<BulkValidationResult> {
  const safeYear =
    Number.isInteger(academicYear) && academicYear >= 2020 && academicYear <= 2035
      ? academicYear
      : 2026;

  if (!csvText || !csvText.trim()) {
    throw new Error('Please upload a CSV file or paste CSV student records before validating.');
  }

  const matrix = parseCsvMatrix(csvText);
  if (matrix.length < 2) {
    throw new Error('CSV must contain a header row and at least one student data row.');
  }
  if (matrix.length - 1 > 500) {
    throw new Error('Maximum 500 student rows allowed per bulk import batch.');
  }

  const headers = matrix[0].map(normalizeHeaderKey);
  const findCol = (aliases: string[]) => headers.findIndex((h) => aliases.includes(h));

  const idxName = findCol(['fullname', 'name', 'studentname', 'recipientname']);
  const idxEmail = findCol(['email', 'emailaddress', 'studentemail']);
  const idxPhone = findCol(['phonenumber', 'phone', 'mobile', 'tel']);
  const idxNationalId = findCol([
    'nationalid',
    'idnumber',
    'identifierref',
    'identifierreference',
    'kcseindex',
    'passport',
  ]);
  const idxProgramme = findCol(['programme', 'programmename', 'programmecode', 'programmeid', 'course']);
  const idxCampus = findCol(['campus', 'campusname', 'campuscode', 'campusid']);
  const idxIntake = findCol(['intake', 'intakename']);
  const idxGender = findCol(['gender', 'sex']);
  const idxMode = findCol(['studymode', 'mode']);

  if (idxName === -1 || idxEmail === -1) {
    throw new Error(
      'CSV header must include at least "fullName" and "email" columns (e.g. fullName,email,phoneNumber,nationalId,programme,campus,intake,gender,studyMode).'
    );
  }

  // Load live Cloud SQL reference tables + fallback store
  const [pgCampusRows, pgDeptRows, pgProgRows, existingUsers, existingStudents, seqRows] =
    await Promise.all([
      db.select().from(campuses),
      db.select().from(departments),
      db.select().from(pgProgrammes),
      db.select({ email: users.email, regNo: users.registrationNumber }).from(users),
      db
        .select({
          email: studentProfiles.email,
          regNo: studentProfiles.registrationNumber,
          nationalIdHash: studentProfiles.nationalIdHash,
        })
        .from(studentProfiles),
      db
        .select()
        .from(registrationNumberSequences)
        .where(
          and(
            eq(registrationNumberSequences.category, 'STU'),
            eq(registrationNumberSequences.academicYear, safeYear)
          )
        )
        .limit(1),
    ]);

  const store = getDb();

  const campusList =
    pgCampusRows.length > 0
      ? pgCampusRows.map((c) => ({ id: c.id, code: c.code, name: c.name }))
      : store.campuses.map((c) => ({ id: c.id, code: c.id.toUpperCase(), name: c.name }));

  const deptList =
    pgDeptRows.length > 0
      ? pgDeptRows.map((d) => ({ id: d.id, code: d.code, name: d.name }))
      : store.departments.map((d) => ({ id: d.id, code: d.id.toUpperCase(), name: d.name }));

  const programmeList =
    pgProgRows.length > 0
      ? pgProgRows.map((p) => ({
          id: p.id,
          code: p.code,
          title: p.title,
          departmentId: p.departmentId,
        }))
      : store.programmes.map((p) => ({
          id: p.id,
          code: p.id.toUpperCase(),
          title: p.name,
          departmentId: p.departmentId,
        }));

  const defaultCampus = campusList[0] ?? {
    id: 'cmp-nairobi',
    code: 'NBI',
    name: 'Nairobi Main Campus',
  };
  const defaultProgramme = programmeList[0] ?? {
    id: 'prog-dict-l6',
    code: 'DICT-L6',
    title: 'Diploma in Information Communication Technology (Level 6)',
    departmentId: deptList[0]?.id ?? 'dept-computing',
  };

  const existingEmails = new Set<string>();
  const existingRegNos = new Set<string>();
  const existingIdHashes = new Set<string>();

  for (const u of existingUsers) {
    existingEmails.add(u.email.toLowerCase());
    if (u.regNo) existingRegNos.add(u.regNo.toUpperCase());
  }
  for (const s of existingStudents) {
    existingEmails.add(s.email.toLowerCase());
    existingRegNos.add(s.regNo.toUpperCase());
    if (s.nationalIdHash) existingIdHashes.add(s.nationalIdHash);
  }

  const maxExistingSeq = extractMaxSeqForYear(Array.from(existingRegNos), safeYear);
  let seqCursor = Math.max(seqRows[0]?.lastSequence ?? 0, maxExistingSeq, 10);

  const seenEmailsInBatch = new Map<string, number>();
  const seenIdsInBatch = new Map<string, number>();
  const rows: BulkStudentRowPreview[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i];
    const rowNumber = i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    const fullName = (cells[idxName] ?? '').trim();
    const emailRaw = (cells[idxEmail] ?? '').trim();
    const email = emailRaw.toLowerCase();
    const phoneNumber = idxPhone >= 0 ? (cells[idxPhone] ?? '').trim() : '';
    const nationalId = idxNationalId >= 0 ? (cells[idxNationalId] ?? '').trim() : '';
    const programmeRaw = idxProgramme >= 0 ? (cells[idxProgramme] ?? '').trim() : '';
    const campusRaw = idxCampus >= 0 ? (cells[idxCampus] ?? '').trim() : '';
    const intakeRaw = idxIntake >= 0 ? (cells[idxIntake] ?? '').trim() : '';
    const genderRaw = idxGender >= 0 ? (cells[idxGender] ?? '').trim().toUpperCase() : '';
    const modeRaw = idxMode >= 0 ? (cells[idxMode] ?? '').trim().toUpperCase() : '';

    if (fullName.length < 2) {
      errors.push('Full name is required (minimum 2 characters).');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email address is required.');
    } else {
      const batchFirstRow = seenEmailsInBatch.get(email);
      if (batchFirstRow !== undefined) {
        errors.push(`Duplicate email within CSV (matches row #${batchFirstRow}).`);
      } else {
        seenEmailsInBatch.set(email, rowNumber);
      }
      if (existingEmails.has(email)) {
        errors.push('Account with this email already exists in Cloud SQL database.');
      }
    }

    if (phoneNumber && phoneNumber.replace(/[^0-9]/g, '').length < 7) {
      errors.push('Phone number must contain at least 7 digits when provided.');
    }

    if (nationalId) {
      const normId = nationalId.toUpperCase();
      const firstIdRow = seenIdsInBatch.get(normId);
      if (firstIdRow !== undefined) {
        errors.push(`Duplicate National ID / Ref within CSV (matches row #${firstIdRow}).`);
      } else {
        seenIdsInBatch.set(normId, rowNumber);
      }
      const idHash = hashNationalId(nationalId);
      if (existingIdHashes.has(idHash)) {
        errors.push('National ID / Ref already belongs to an existing student in database.');
      }
    }

    // Campus matching
    let matchedCampus = defaultCampus;
    if (campusRaw) {
      const cLower = campusRaw.toLowerCase();
      const foundCampus = campusList.find(
        (c) =>
          c.id.toLowerCase() === cLower ||
          c.code.toLowerCase() === cLower ||
          c.name.toLowerCase() === cLower ||
          c.name.toLowerCase().includes(cLower)
      );
      if (foundCampus) {
        matchedCampus = foundCampus;
      } else {
        errors.push(
          `Unknown campus "${campusRaw}". Allowed: ${campusList.map((c) => c.name).join(', ')}.`
        );
      }
    } else {
      warnings.push(`Campus blank — defaulted to ${defaultCampus.name}.`);
    }

    // Programme matching
    let matchedProgramme = defaultProgramme;
    if (programmeRaw) {
      const pLower = programmeRaw.toLowerCase();
      const foundProg = programmeList.find(
        (p) =>
          p.id.toLowerCase() === pLower ||
          p.code.toLowerCase() === pLower ||
          p.title.toLowerCase() === pLower ||
          p.title.toLowerCase().includes(pLower)
      );
      if (foundProg) {
        matchedProgramme = foundProg;
      } else {
        errors.push(
          `Unknown programme "${programmeRaw}". Use code/title e.g. ${programmeList
            .slice(0, 4)
            .map((p) => p.code)
            .join(', ')}.`
        );
      }
    } else {
      warnings.push(`Programme blank — defaulted to ${defaultProgramme.title}.`);
    }

    const matchedDept =
      deptList.find((d) => d.id === matchedProgramme.departmentId) ??
      deptList[0] ?? {
        id: 'dept-computing',
        name: 'School of Computing & Informatics',
      };

    let gender = 'NOT_SPECIFIED';
    if (genderRaw) {
      const normalizedGender =
        genderRaw === 'M' ? 'MALE' : genderRaw === 'F' ? 'FEMALE' : genderRaw;
      if (VALID_GENDERS.has(normalizedGender)) {
        gender = normalizedGender;
      } else {
        warnings.push(`Unrecognized gender "${genderRaw}" — normalized to NOT_SPECIFIED.`);
      }
    }

    let studyMode = 'FULL_TIME';
    if (modeRaw) {
      const normalizedMode = modeRaw.replace(/[\s-]+/g, '_');
      if (VALID_STUDY_MODES.has(normalizedMode)) {
        studyMode = normalizedMode;
      } else {
        warnings.push(`Unrecognized studyMode "${modeRaw}" — defaulted to FULL_TIME.`);
      }
    }

    const intakeName = intakeRaw || `September ${safeYear} Intake`;
    const isValid = errors.length === 0;

    let previewRegNo: string | null = null;
    if (isValid) {
      let candidate = '';
      do {
        seqCursor += 1;
        candidate = `HCA/STU/${safeYear}/${String(seqCursor).padStart(4, '0')}`;
      } while (existingRegNos.has(candidate));
      existingRegNos.add(candidate);
      previewRegNo = candidate;
    }

    rows.push({
      rowNumber,
      valid: isValid,
      status: !isValid ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'VALID',
      errors,
      warnings,
      previewRegistrationNumber: previewRegNo,
      data: {
        fullName,
        email,
        phoneNumber,
        nationalId,
        gender,
        campusId: matchedCampus.id,
        campusName: matchedCampus.name,
        departmentId: matchedDept.id,
        departmentName: matchedDept.name,
        programmeId: matchedProgramme.id,
        programmeName: matchedProgramme.title,
        intakeName,
        studyMode,
      },
    });
  }

  return {
    summary: {
      totalRows: rows.length,
      validCount: rows.filter((r) => r.valid).length,
      errorCount: rows.filter((r) => !r.valid).length,
      warningCount: rows.filter((r) => r.valid && r.warnings.length > 0).length,
      year: safeYear,
    },
    rows,
    allowedCampuses: campusList,
    allowedProgrammes: programmeList.map((p) => ({ id: p.id, code: p.code, title: p.title })),
  };
}

export async function commitBulkStudentsToPostgres(
  actor: { id: string; fullName: string },
  csvText: string,
  academicYear: number = 2026,
  commitValidOnly: boolean = false
): Promise<BulkImportCommitResult> {
  const validation = await validateBulkStudentsForPostgres(csvText, academicYear);

  if (validation.summary.totalRows === 0 || validation.summary.validCount === 0) {
    throw new Error('No valid student rows available to commit.');
  }

  if (validation.summary.errorCount > 0 && !commitValidOnly) {
    throw new Error(
      `Validation found ${validation.summary.errorCount} error row(s). Fix them or enable "Commit valid rows only".`
    );
  }

  const validRows = validation.rows.filter((r) => r.valid);
  const errorRows = validation.rows
    .filter((r) => !r.valid)
    .map((r) => ({
      rowNumber: r.rowNumber,
      fullName: r.data.fullName,
      email: r.data.email,
      errors: r.errors,
    }));

  const defaultPass = hashPasswordScrypt(process.env.SEED_DEFAULT_PASSWORD || 'Hitech@2026!');
  const year = validation.summary.year;
  const now = new Date();

  const createdStudents = await db.transaction(async (tx) => {
    const [existingSeqRows, existingUsers, existingProfiles] = await Promise.all([
      tx
        .select()
        .from(registrationNumberSequences)
        .where(
          and(
            eq(registrationNumberSequences.category, 'STU'),
            eq(registrationNumberSequences.academicYear, year)
          )
        )
        .limit(1),
      tx.select({ regNo: users.registrationNumber }).from(users),
      tx.select({ regNo: studentProfiles.registrationNumber }).from(studentProfiles),
    ]);

    const takenRegs = new Set<string>();
    for (const u of existingUsers) {
      if (u.regNo) takenRegs.add(u.regNo.toUpperCase());
    }
    for (const s of existingProfiles) {
      takenRegs.add(s.regNo.toUpperCase());
    }

    let currentSeq = Math.max(
      existingSeqRows[0]?.lastSequence ?? 0,
      extractMaxSeqForYear(Array.from(takenRegs), year),
      10
    );

    const insertedList: BulkImportCommitResult['createdStudents'] = [];

    for (const row of validRows) {
      let regNo = '';
      do {
        currentSeq += 1;
        regNo = `HCA/STU/${year}/${String(currentSeq).padStart(4, '0')}`;
      } while (takenRegs.has(regNo));
      takenRegs.add(regNo);

      const uid = `acc-stu-bulk-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const [createdUser] = await tx
        .insert(users)
        .values({
          uid,
          email: row.data.email,
          registrationNumber: regNo,
          fullName: row.data.fullName,
          primaryRole: 'STUDENT',
          accountStatus: 'ACTIVE',
          passwordHash: defaultPass,
          mustChangePassword: true,
          emailVerifiedAt: null,
          emailVerificationRequired: true,
          requiresProfileCompletion: true,
          campusId: row.data.campusId,
          departmentId: row.data.departmentId,
        })
        .returning();

      const profileId = `sis-bulk-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const [profile] = await tx
        .insert(studentProfiles)
        .values({
          id: profileId,
          userId: createdUser.id,
          registrationNumber: regNo,
          fullName: row.data.fullName,
          email: row.data.email,
          gender: row.data.gender,
          nationalIdHash: row.data.nationalId ? hashNationalId(row.data.nationalId) : null,
          phoneNumber: row.data.phoneNumber || null,
          campusId: row.data.campusId,
          campusName: row.data.campusName,
          departmentId: row.data.departmentId,
          departmentName: row.data.departmentName,
          programmeId: row.data.programmeId,
          programmeName: row.data.programmeName,
          intakeName: row.data.intakeName,
          studyMode: row.data.studyMode,
          admissionDate: now,
          status: 'ADMITTED',
          profileCompleted: false,
        })
        .returning();

      await tx.insert(studentStatusHistory).values({
        id: `sth-bulk-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        studentId: profileId,
        previousStatus: null,
        newStatus: 'ADMITTED',
        reason: `Created via Registrar Bulk CSV Import (row #${row.rowNumber}).`,
        changedById: actor.id,
        changedByName: actor.fullName,
        effectiveAt: now,
      });

      insertedList.push({
        id: profile.id,
        registrationNumber: profile.registrationNumber,
        fullName: profile.fullName,
        email: profile.email,
        programmeName: profile.programmeName ?? row.data.programmeName,
        campusName: profile.campusName ?? row.data.campusName,
        intakeName: profile.intakeName ?? row.data.intakeName,
        status: profile.status,
        issuedAt: now.toISOString(),
      });
    }

    if (existingSeqRows[0]) {
      await tx
        .update(registrationNumberSequences)
        .set({
          lastSequence: sql`GREATEST(${registrationNumberSequences.lastSequence}, ${currentSeq})`,
          updatedAt: now,
        })
        .where(eq(registrationNumberSequences.id, existingSeqRows[0].id));
    } else {
      await tx.insert(registrationNumberSequences).values({
        category: 'STU',
        academicYear: year,
        lastSequence: currentSeq,
        updatedAt: now,
      });
    }

    return insertedList;
  });

  return {
    importedCount: createdStudents.length,
    skippedCount: errorRows.length,
    year,
    createdStudents,
    errors: errorRows,
  };
}

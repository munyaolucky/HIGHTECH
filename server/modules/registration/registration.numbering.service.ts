import type { PortalDatabase } from '../../data/store.ts';
import type { RegistrationCategory } from './registration.permissions.ts';

export const REGISTRATION_PREFIX: Record<RegistrationCategory, string> = {
  STUDENT: 'STU',
  STAFF: 'STAFF',
  PARENT: 'PAR',
  ALUMNI: 'ALU',
  CONTRACTOR: 'CTR',
  PARTNER: 'PRT',
  GUEST: 'GST',
};

export function formatRegistrationNumber(
  category: RegistrationCategory,
  year: number,
  sequence: number
): string {
  const prefix = REGISTRATION_PREFIX[category];
  if (!prefix || sequence < 1) {
    throw new Error('Invalid registration number parameters.');
  }
  return ['HCA', prefix, year, String(sequence).padStart(4, '0')].join('/');
}

/**
 * Atomically allocates a unique institutional number inside the DB write transaction,
 * verifying no collision exists across registrations, studentAccounts, or staffAccounts.
 */
export function allocateUniqueInstitutionalNumber(
  db: PortalDatabase,
  category: RegistrationCategory
): string {
  const year = new Date().getFullYear();
  let nextSeq = db.sequences.registrationSeq[category] ?? 0;

  // Guard against any pre-existing number collisions
  for (let guard = 0; guard < 10000; guard++) {
    nextSeq += 1;
    const candidate = formatRegistrationNumber(category, year, nextSeq);
    const existsInRegistrations = db.registrations.some(
      (r) => r.registrationNumber === candidate
    );
    const existsInStudents = db.studentAccounts.some(
      (s) => s.admissionNumber === candidate
    );
    const existsInStaff = db.staffAccounts.some(
      (s) => s.employeeNumber === candidate
    );
    if (!existsInRegistrations && !existsInStudents && !existsInStaff) {
      db.sequences.registrationSeq[category] = nextSeq;
      return candidate;
    }
  }

  throw new Error(`Unable to allocate unique institutional number for ${category}.`);
}

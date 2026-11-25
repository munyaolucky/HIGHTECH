import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  defaults?: {
    fullName?: string;
    primaryRole?: string;
    registrationNumber?: string | null;
    accountStatus?: string;
    passwordHash?: string | null;
    mustChangePassword?: boolean;
    emailVerifiedAt?: Date | null;
    emailVerificationRequired?: boolean;
    requiresProfileCompletion?: boolean;
    campusId?: string | null;
    departmentId?: string | null;
  }
) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingByEmail[0]) {
      const updated = await db
        .update(users)
        .set({
          uid: existingByEmail[0].uid || uid,
          fullName: defaults?.fullName ?? existingByEmail[0].fullName,
          primaryRole: defaults?.primaryRole ?? existingByEmail[0].primaryRole,
          registrationNumber:
            defaults?.registrationNumber ?? existingByEmail[0].registrationNumber,
          emailVerifiedAt:
            defaults?.emailVerifiedAt !== undefined
              ? existingByEmail[0].emailVerifiedAt ?? defaults.emailVerifiedAt
              : existingByEmail[0].emailVerifiedAt,
          emailVerificationRequired:
            defaults?.emailVerifiedAt
              ? false
              : existingByEmail[0].emailVerificationRequired,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingByEmail[0].id))
        .returning();
      return updated[0];
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        fullName: defaults?.fullName ?? normalizedEmail.split('@')[0],
        primaryRole: defaults?.primaryRole ?? 'STUDENT',
        registrationNumber: defaults?.registrationNumber ?? null,
        accountStatus: defaults?.accountStatus ?? 'ACTIVE',
        passwordHash: defaults?.passwordHash ?? null,
        mustChangePassword: defaults?.mustChangePassword ?? false,
        emailVerifiedAt: defaults?.emailVerifiedAt ?? null,
        emailVerificationRequired: defaults?.emailVerificationRequired ?? true,
        requiresProfileCompletion: defaults?.requiresProfileCompletion ?? false,
        campusId: defaults?.campusId ?? null,
        departmentId: defaults?.departmentId ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database user synchronization failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed in getAllUsers:', error);
    throw new Error('Failed to retrieve user records.', { cause: error });
  }
}

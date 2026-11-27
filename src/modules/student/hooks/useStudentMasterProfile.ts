import { useEffect, useState } from 'react';

import type { PortalUser } from '../../../auth/auth-types';
import type { StudentProfile } from '../../../types';

import {
  mapStudentMasterRecord,
  type StudentMasterRecord,
} from '../studentProfileAdapter';

interface StudentListResponse {
  success: boolean;
  data?: {
    items?: StudentMasterRecord[];
  };
  error?: string;
}

interface StudentMasterProfileState {
  profile: StudentProfile | null;
  loading: boolean;
  error: string | null;
}

export function useStudentMasterProfile(
  user: PortalUser | null,
  isAuthenticated: boolean,
  authLoading: boolean
): StudentMasterProfileState {
  const [state, setState] = useState<StudentMasterProfileState>({
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      if (authLoading) {
        setState({
          profile: null,
          loading: true,
          error: null,
        });
        return;
      }

      if (!isAuthenticated || !user) {
        setState({
          profile: null,
          loading: false,
          error: 'Please sign in to access your student portal.',
        });
        return;
      }

      if (user.primaryRole !== 'STUDENT') {
        setState({
          profile: null,
          loading: false,
          error: 'This account is not assigned to the student portal.',
        });
        return;
      }

      try {
        setState({
          profile: null,
          loading: true,
          error: null,
        });

        const response = await fetch('/api/sis/students', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error('Your session has expired. Sign in again.');
        }

        if (response.status === 403) {
          throw new Error('You are not authorized to access this student record.');
        }

        const result = (await response.json()) as StudentListResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || 'Unable to retrieve your student record.'
          );
        }

        const records = result.data?.items ?? [];

        const email = user.email.trim().toLowerCase();
        const regNo = user.registrationNumber?.trim();

        const ownRecords = records.filter((record) => {
          const matchesEmail = record.email.trim().toLowerCase() === email;

          const matchesRegistration =
            Boolean(regNo) && record.registrationNumber === regNo;

          return matchesEmail || matchesRegistration;
        });

        if (ownRecords.length !== 1) {
          throw new Error(
            ownRecords.length === 0
              ? 'No student record is linked to this account. Contact the Registrar.'
              : 'Multiple student records match this account. Contact the Registrar.'
          );
        }

        const profile = mapStudentMasterRecord(ownRecords[0]);

        if (controller.signal.aborted) return;

        setState({
          profile,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setState({
          profile: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load your student profile.',
        });
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [
    user?.uid,
    user?.email,
    user?.registrationNumber,
    user?.primaryRole,
    isAuthenticated,
    authLoading,
  ]);

  return state;
}

import { useCallback, useEffect, useState } from 'react';
import type { StaffRole } from '../../../config/staff-navigation';

export interface DashboardData {
  staff: {
    id: string;
    employeeNumber: string;
    fullName: string;
    role: string;
    department?: string;
    campus?: string;
  };

  statistics: {
    key: string;
    label: string;
    value: number | string;
    description?: string;
  }[];

  tasks: {
    id: string;
    title: string;
    description: string;
    dueAt?: string;
    status:
      | 'PENDING'
      | 'IN_PROGRESS'
      | 'COMPLETED'
      | 'URGENT';
  }[];

  activities: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }[];
}

interface ApiResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}

export function useStaffDashboard(
  role: StaffRole | 'UNCONFIGURED'
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const refetch = useCallback(() => {
    setReloadNonce((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      if (role === 'UNCONFIGURED') {
        setData(null);
        setError('Your staff account has not been configured.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          '/api/staff/dashboard/summary',
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );

        const result =
          (await response.json()) as ApiResponse;

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.error ??
              `Unable to load dashboard (${response.status}).`
          );
        }

        // The authenticated server response is authoritative.
        setData(result.data);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setData(null);
        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load staff dashboard.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => controller.abort();
  }, [role, reloadNonce]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

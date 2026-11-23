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
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'URGENT';
  }[];
  activities: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }[];
}

export async function syncStaffServerSession(
  role: StaffRole | 'UNCONFIGURED',
  explicitSwitch = false
): Promise<void> {
  const res = await fetch('/api/staff/session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, explicitSwitch }),
  });
  if (!res.ok) {
    throw new Error(`Session sync failed (${res.status})`);
  }
}

export function useStaffDashboard(role: StaffRole | 'UNCONFIGURED') {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const refetch = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      if (role === 'UNCONFIGURED') {
        setData(null);
        setError(null);
        setLoading(false);
        await syncStaffServerSession('UNCONFIGURED').catch(() => {});
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Synchronize authenticated HttpOnly session cookie with selected staff perspective
        await syncStaffServerSession(role);

        const response = await fetch('/api/staff/dashboard/summary', {
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(
            payload?.error || `Failed to load dashboard (${response.status})`
          );
        }

        setData(payload.data as DashboardData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(
            err instanceof Error ? err.message : 'Unable to load dashboard data.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [role, reloadNonce]);

  return { data, loading, error, refetch };
}

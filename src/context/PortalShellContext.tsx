import React, { createContext, useContext, useState } from 'react';
import { PortalRole } from '../types';

interface PortalShellContextValue {
  tabsByRole: Partial<Record<PortalRole, string>>;
  overviewOpenByRole: Partial<Record<PortalRole, boolean>>;
  setPortalTab: (role: PortalRole, tab: string) => void;
  setOverviewOpen: (role: PortalRole, isOpen: boolean) => void;
}

const PortalShellContext = createContext<PortalShellContextValue | null>(null);

export function PortalShellProvider({ children }: { children: React.ReactNode }) {
  const [tabsByRole, setTabsByRole] = useState<Partial<Record<PortalRole, string>>>({});
  const [overviewOpenByRole, setOverviewOpenByRole] = useState<Partial<Record<PortalRole, boolean>>>({});

  const setPortalTab = (role: PortalRole, tab: string) => {
    setTabsByRole((prev) => ({ ...prev, [role]: tab }));
    setOverviewOpenByRole((prev) => ({ ...prev, [role]: false }));
  };

  const setOverviewOpen = (role: PortalRole, isOpen: boolean) => {
    setOverviewOpenByRole((prev) => ({ ...prev, [role]: isOpen }));
  };

  return (
    <PortalShellContext.Provider
      value={{
        tabsByRole,
        overviewOpenByRole,
        setPortalTab,
        setOverviewOpen,
      }}
    >
      {children}
    </PortalShellContext.Provider>
  );
}

export function usePortalShellContext() {
  return useContext(PortalShellContext);
}

export function useSyncedPortalTab<T extends string>(
  role: PortalRole,
  defaultTab: T
): [T, (tab: T) => void] {
  const ctx = useContext(PortalShellContext);
  const [localTab, setLocalTab] = useState<T>(defaultTab);

  if (!ctx) {
    return [localTab, setLocalTab];
  }

  const active = (ctx.tabsByRole[role] as T | undefined) ?? localTab;
  const setTab = (next: T) => {
    setLocalTab(next);
    ctx.setPortalTab(role, next);
  };

  return [active, setTab];
}

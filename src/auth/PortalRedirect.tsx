import { useEffect } from 'react';
import SessionLoading from '../components/portal/SessionLoading';
import { getUserDashboardPath } from './auth-utils';
import { useAuth } from './useAuth';

export function PortalRedirect({
  onRedirect,
}: {
  onRedirect: (path: string) => void;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      onRedirect('/portal/login');
      return;
    }
    onRedirect(getUserDashboardPath(user));
  }, [isLoading, isAuthenticated, user, onRedirect]);

  return <SessionLoading message="Opening your assigned HI-TECH College workspace..." />;
}

export default PortalRedirect;

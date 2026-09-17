import { useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { PermissionChecker } from '@/lib/permissions';

export const usePermissionChecker = (): PermissionChecker => {
  const { permissions, profile } = useSession();
  const roleName = (profile as any)?.role?.name || '';

  return useMemo(
    () => new PermissionChecker(permissions as any, roleName),
    [permissions, roleName]
  );
};

export default usePermissionChecker;

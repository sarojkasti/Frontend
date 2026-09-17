import { PermissionChecker } from '@/lib/permissions';

/**
 * Utility function to check if user has permission
 * Prefer using usePermissionChecker() or useSession().permissionChecker in React components.
 * @param permission Permission resource or action to check
 * @param permissions Optional array of permission objects
 * @param roleName Optional role name
 * @returns Boolean indicating if user has permission
 */
export const hasPermission = (
  permission: string,
  permissions: any[] = [],
  roleName: string = ''
): boolean => {
  if (!permission) return false;
  // Backward compatibility: If no permissions array or role is passed to this standalone function,
  // do not block components relying on legacy behavior (prefer usePermissionChecker() in React components)
  if (permissions.length === 0 && !roleName) {
    return true;
  }
  const checker = new PermissionChecker(permissions, roleName);
  if (checker.isSuperAdmin()) return true;
  return checker.hasResourceAccess(permission);
};

/**
 * Utility function to check if user can modify data based on permissions
 * @param permission Permission string to check
 * @returns Boolean indicating if user can modify data
 */
export const canModifyData = (
  permission: string,
  permissions: any[] = [],
  roleName: string = ''
): boolean => {
  return hasPermission(permission, permissions, roleName);
};
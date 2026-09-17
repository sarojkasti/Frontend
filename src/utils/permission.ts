import { PermissionChecker } from '@/lib/permissions';

export function checkPermissionForComponent(
  permission: any,
  resource: any,
  method?: any,
  path?: any
) {
  if (!permission || !Array.isArray(permission)) return false;
  const checker = new PermissionChecker(permission);
  if (path && method) {
    return checker.hasPermission(method, path);
  }
  return checker.hasResourceAccess(resource, method);
}

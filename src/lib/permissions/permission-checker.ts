import { PermissionObject, ApproverLevel } from './types';
import { PERMISSIONS } from './constants';

export class PermissionChecker {
  private permissions: PermissionObject[];
  private roleName: string;

  constructor(permissions: any[] = [], roleName: string = '') {
    this.permissions = Array.isArray(permissions)
      ? permissions.filter((p) => p && typeof p === 'object')
      : [];
    this.roleName = (roleName || '').toLowerCase().trim();
  }

  /**
   * Check if the current user has superuser or administrator privileges
   */
  isSuperAdmin(): boolean {
    return (
      this.roleName === 'superuser' ||
      this.roleName === 'super_user' ||
      this.roleName === 'administrator' ||
      this.roleName === 'admin' ||
      this.permissions.some((p) => p.resource === 'admin')
    );
  }

  /**
   * Check if the user has a specific role
   */
  hasRole(...roleNames: string[]): boolean {
    const current = this.roleName;
    return roleNames.some((r) => r.toLowerCase().trim() === current);
  }

  /**
   * Core permission check by HTTP method and route path
   */
  hasPermission(method: string, path: string): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }

    const m = method.toLowerCase();
    return this.permissions.some(
      (p) =>
        p.method?.toLowerCase() === m &&
        (p.path === path || this.matchPath(p.path, path))
    );
  }

  /**
   * Check if user has access to any endpoint in a resource (and optionally with a specific method)
   */
  hasResourceAccess(resource: string, method?: string): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }

    const res = resource.toLowerCase();
    const m = method ? method.toLowerCase() : null;

    return this.permissions.some((p) => {
      const matchRes = p.resource?.toLowerCase() === res;
      if (!matchRes) return false;
      return m ? p.method?.toLowerCase() === m : true;
    });
  }

  /**
   * Path pattern matching (e.g. /leave/:id matches /leave/123)
   */
  private matchPath(pattern?: string, path?: string): boolean {
    if (!pattern || !path) return false;
    if (pattern === path) return true;

    // Convert pattern with params like /users/:id to regex
    const regexPattern = pattern
      .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  // ==========================================
  // LEAVE MODULE HELPERS
  // ==========================================

  canViewAllLeaves(): boolean {
    return this.hasPermission(PERMISSIONS.LEAVE.VIEW_ALL.method, PERMISSIONS.LEAVE.VIEW_ALL.path);
  }

  canViewMyLeaves(): boolean {
    return (
      this.hasPermission(PERMISSIONS.LEAVE.VIEW_MY.method, PERMISSIONS.LEAVE.VIEW_MY.path) ||
      this.hasResourceAccess('leave')
    );
  }

  canApplyForLeave(): boolean {
    return this.hasPermission(PERMISSIONS.LEAVE.APPLY.method, PERMISSIONS.LEAVE.APPLY.path);
  }

  canUpdateLeave(): boolean {
    return this.hasPermission(PERMISSIONS.LEAVE.UPDATE.method, PERMISSIONS.LEAVE.UPDATE.path);
  }

  canDeleteLeave(): boolean {
    return this.hasPermission(PERMISSIONS.LEAVE.DELETE.method, PERMISSIONS.LEAVE.DELETE.path);
  }

  canApproveLeave(): boolean {
    return (
      this.canApproveLeaveAsAdmin() ||
      this.canApproveLeaveAsManager() ||
      this.hasPermission(PERMISSIONS.LEAVE.APPROVE.method, PERMISSIONS.LEAVE.APPROVE.path)
    );
  }

  canApproveLeaveAsManager(): boolean {
    if (this.isSuperAdmin()) return true;
    return (
      this.hasPermission(PERMISSIONS.LEAVE.APPROVE_MANAGER.method, PERMISSIONS.LEAVE.APPROVE_MANAGER.path) ||
      this.hasPermission(PERMISSIONS.LEAVE.APPROVE_PM.method, PERMISSIONS.LEAVE.APPROVE_PM.path) ||
      this.hasPermission(PERMISSIONS.LEAVE.APPROVE_LEAD.method, PERMISSIONS.LEAVE.APPROVE_LEAD.path)
    );
  }

  canApproveLeaveAsAdmin(): boolean {
    if (this.isSuperAdmin()) return true;
    return this.hasPermission(PERMISSIONS.LEAVE.APPROVE_ADMIN.method, PERMISSIONS.LEAVE.APPROVE_ADMIN.path);
  }

  canRejectLeave(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.LEAVE.REJECT.method, PERMISSIONS.LEAVE.REJECT.path)
    );
  }

  canViewLeaveCalendar(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.LEAVE.VIEW_CALENDAR.method, PERMISSIONS.LEAVE.VIEW_CALENDAR.path) ||
      this.hasResourceAccess('calendar')
    );
  }

  canAllocateLeave(): boolean {
    return (
      this.hasPermission(PERMISSIONS.LEAVE.ALLOCATE.method, PERMISSIONS.LEAVE.ALLOCATE.path) ||
      this.hasPermission(PERMISSIONS.LEAVE.ALLOCATE_ALL.method, PERMISSIONS.LEAVE.ALLOCATE_ALL.path)
    );
  }

  getApproverLevel(): ApproverLevel {
    if (this.roleName === 'superuser' || this.roleName === 'super_user') return 'superuser';
    if (this.canApproveLeaveAsAdmin()) return 'admin';
    if (this.canApproveLeaveAsManager()) return 'manager';
    return null;
  }

  // ==========================================
  // DASHBOARD MODULE HELPERS
  // ==========================================

  canViewDashboardAttendance(): boolean {
    return this.hasPermission(
      PERMISSIONS.DASHBOARD.ATTENDANCE.method,
      PERMISSIONS.DASHBOARD.ATTENDANCE.path
    );
  }

  canViewDashboardWorkingTime(): boolean {
    return this.hasPermission(
      PERMISSIONS.DASHBOARD.WORKING_TIME.method,
      PERMISSIONS.DASHBOARD.WORKING_TIME.path
    );
  }

  canViewUserAvailability(): boolean {
    return this.hasPermission(
      PERMISSIONS.PROJECT.AVAILABILITY.method,
      PERMISSIONS.PROJECT.AVAILABILITY.path
    );
  }

  // ==========================================
  // WORKLOG MODULE HELPERS
  // ==========================================

  canViewAllWorklogs(): boolean {
    return this.hasPermission(PERMISSIONS.WORKLOG.VIEW_ALL.method, PERMISSIONS.WORKLOG.VIEW_ALL.path);
  }

  canAccessWorklogAdmin(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.WORKLOG.ADMIN_VIEW.method, PERMISSIONS.WORKLOG.ADMIN_VIEW.path)
    );
  }

  canEditWorklogDate(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.WORKLOG.UPDATE_DATE.method, PERMISSIONS.WORKLOG.UPDATE_DATE.path)
    );
  }

  canBulkApproveWorklogs(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.WORKLOG.BULK_APPROVE.method, PERMISSIONS.WORKLOG.BULK_APPROVE.path)
    );
  }

  canBulkRejectWorklogs(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.WORKLOG.BULK_REJECT.method, PERMISSIONS.WORKLOG.BULK_REJECT.path)
    );
  }

  // ==========================================
  // TASK MODULE HELPERS
  // ==========================================

  canCreateTask(): boolean {
    return this.hasPermission(PERMISSIONS.TASK.CREATE.method, PERMISSIONS.TASK.CREATE.path);
  }

  canEditTask(): boolean {
    return this.hasPermission(PERMISSIONS.TASK.UPDATE.method, PERMISSIONS.TASK.UPDATE.path);
  }

  canDeleteTask(): boolean {
    return this.hasPermission(PERMISSIONS.TASK.DELETE.method, PERMISSIONS.TASK.DELETE.path);
  }

  canFirstVerifyTask(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.TASK.FIRST_VERIFY.method, PERMISSIONS.TASK.FIRST_VERIFY.path)
    );
  }

  canSecondVerifyTask(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.TASK.SECOND_VERIFY.method, PERMISSIONS.TASK.SECOND_VERIFY.path)
    );
  }

  canManageTaskRanking(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.TASK.RANKING_MANAGE.method, PERMISSIONS.TASK.RANKING_MANAGE.path)
    );
  }

  // ==========================================
  // PROJECT MODULE HELPERS
  // ==========================================

  canCreateProject(): boolean {
    return this.hasPermission(PERMISSIONS.PROJECT.CREATE.method, PERMISSIONS.PROJECT.CREATE.path);
  }

  canEditProject(): boolean {
    return this.hasPermission(PERMISSIONS.PROJECT.UPDATE.method, PERMISSIONS.PROJECT.UPDATE.path);
  }

  canDeleteProject(): boolean {
    return this.hasPermission(PERMISSIONS.PROJECT.DELETE.method, PERMISSIONS.PROJECT.DELETE.path);
  }

  // ==========================================
  // ADMIN MODULE HELPERS
  // ==========================================

  canManageRoles(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.ADMIN.MANAGE_ROLES.method, PERMISSIONS.ADMIN.MANAGE_ROLES.path)
    );
  }

  canManagePermissions(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.ADMIN.MANAGE_PERMISSIONS.method, PERMISSIONS.ADMIN.MANAGE_PERMISSIONS.path)
    );
  }

  // ==========================================
  // NOTICE BOARD MODULE HELPERS
  // ==========================================

  canCreateNotice(): boolean {
    return (
      this.isSuperAdmin() ||
      this.hasPermission(PERMISSIONS.NOTICE_BOARD.CREATE.method, PERMISSIONS.NOTICE_BOARD.CREATE.path)
    );
  }
}

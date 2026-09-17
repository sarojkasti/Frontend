export interface PermissionObject {
  id: string;
  name?: string;
  method: string;
  path: string;
  resource: string;
  description?: string;
  isActive?: boolean;
}

export interface UserRole {
  id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  permission?: PermissionObject[];
}

export type ApproverLevel = 'manager' | 'admin' | 'superuser' | null;

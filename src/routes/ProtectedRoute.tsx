import { useSession } from "@/context/SessionContext";
import { Spin } from "antd";
import React from "react";

interface ProtectedRouteProps {
  component: React.ReactNode;
  method?: string;
  resource?: string;
  path?: string;
}

const BASELINE_GET_RESOURCES = new Set([
  "default",
  "attendance",
  "calendar",
  "holiday",
  "notice-board",
  "todo-task",
  "leave",
  "projects",
  "tasks",
  "worklogs"
]);

const ProtectedRoute = ({ component, method = "get", resource, path }: ProtectedRouteProps) => {
  const { isProfilePending, permissionChecker } = useSession();

  if (isProfilePending) {
    return (
      <div className="flex justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  // 1. Superuser / administrator bypass
  if (permissionChecker.isSuperAdmin()) {
    return <>{component}</>;
  }

  // 2. Specific route path permission check
  if (path) {
    const hasAccess = permissionChecker.hasPermission(method, path);
    return <>{hasAccess ? component : <div>You don't have access to this resource</div>}</>;
  }

  // 3. Baseline self-service resources accessible to all authenticated users
  if (resource === "default" || (method.toLowerCase() === "get" && resource && BASELINE_GET_RESOURCES.has(resource.toLowerCase()))) {
    return <>{component}</>;
  }

  // 4. Resource-level check for privileged / management modules
  if (resource) {
    const hasAccess = permissionChecker.hasResourceAccess(resource, method);
    return <>{hasAccess ? component : <div>You don't have access to this resource</div>}</>;
  }

  return <>{component}</>;
};

export default ProtectedRoute;

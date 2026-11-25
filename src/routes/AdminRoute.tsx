import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";

const ADMIN_ROLES = new Set([
  "superuser",
  "super_user",
  "superadmin",
  "super admin",
  "administrator",
  "admin",
]);

export const isAdminOrSuperRole = (
  profile: any,
  permissionChecker?: { isSuperAdmin: () => boolean }
): boolean => {
  if (permissionChecker?.isSuperAdmin()) return true;
  const roleName = ((profile?.role as any)?.name || "").toLowerCase().trim();
  return ADMIN_ROLES.has(roleName);
};

interface AdminRouteProps {
  component: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ component }) => {
  const { profile, permissionChecker } = useSession();
  const navigate = useNavigate();

  if (!isAdminOrSuperRole(profile, permissionChecker)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access system settings."
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            Back Home
          </Button>
        }
      />
    );
  }

  return <>{component}</>;
};

export default AdminRoute;

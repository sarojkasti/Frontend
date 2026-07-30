import { useSession } from "@/context/SessionContext";
import { Spin } from "antd";

const ProtectedRoute = ({ component, method, resource, path }: any) => {
    const { permissions, isProfilePending, profile } = useSession();

    const isSuperOrAdmin =
        profile?.role?.name === "superuser" ||
        profile?.role?.name === "administrator" ||
        (permissions || []).some((p: any) => typeof p === 'object' && p?.resource === 'admin');

    // Check if the user has the required permission
    const hasRequiredPermission = (permissions || []).some((permission: any) => {
        if (typeof permission === 'object' && permission.method && permission.resource) {
            // If path is provided, match against it
            if (path && permission.path) {
                return permission.method === method && permission.path === path;
            }
            // Otherwise match against resource
            return permission.method === method && permission.resource === resource;
        } else if (typeof permission === 'string') {
            // For string-based permissions (format: "resource:method")
            return permission === `${resource}:${method}` || 
                   permission === `${resource}_${method}` ||
                   // For backward compatibility with older permission formats
                   (permission.includes(resource) && permission.includes(method));
        }
        return false;
    });
    
    if (isProfilePending) {
        return <div className="flex justify-center py-24"><Spin size="large" /></div> 
    }

    const hasAccess = isSuperOrAdmin || hasRequiredPermission;

    return <>{hasAccess ? component : <>You don't have access to this resource</>}</>
};

export default ProtectedRoute;

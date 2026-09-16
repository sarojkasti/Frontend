import AllWorklogTable from "@/components/Worklog/AllWorklogTable";
import IncomingWorklogTable from "@/components/Worklog/IncomingWorklogTable";
import { Tabs, Button } from "antd";
import { useSession } from "@/context/SessionContext";
import { useNavigate } from "react-router-dom";

const AllWorklogs = () => {
  const { profile } = useSession();
  const navigate = useNavigate();
  const profilePermissions = (profile as any)?.role?.permission;

  // Defensive: support both {name, permission} and {permission} role objects
  const userRole =
    profile?.role && (profile.role as any).name
      ? (profile.role as any).name.toLowerCase?.() || ""
      : "";

  // Permission checks for worklog pages (case-insensitive method matching)
  const hasMyWorklogPermission =
    Array.isArray(profilePermissions) &&
    profilePermissions.some(
      (perm: any) =>
        perm.path === "/worklogs/user" && perm.method?.toLowerCase() === "get",
    );

  const hasAllWorklogPermission =
    Array.isArray(profilePermissions) &&
    profilePermissions.some(
      (perm: any) =>
        perm.path === "/worklogs/allworklog" &&
        perm.method?.toLowerCase() === "get",
    );

  if (!hasMyWorklogPermission) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Permission Denied</h2>
        <p className="mb-4">You don't have permission to access this page.</p>
      </div>
    );
  }

  const tabItems = [
    {
      label: `Requested`,
      key: "1",
      children: <AllWorklogTable status="requested" />,
    },
    {
      label: `Approved`,
      key: "2",
      children: <AllWorklogTable status="approved" />,
    },
    {
      label: `Rejected`,
      key: "3",
      children: <AllWorklogTable status="rejected" />,
    },
  ];

  if (userRole !== "auditjunior") {
    tabItems.push(
      {
        label: `Incoming Requests`,
        key: "4",
        children: <IncomingWorklogTable status="requested" />,
      },
      {
        label: `Incoming Approved`,
        key: "5",
        children: <IncomingWorklogTable status="approved" />,
      },
      {
        label: `Incoming Rejected`,
        key: "6",
        children: <IncomingWorklogTable status="rejected" />,
      },
    );
  }

  return (
    <>
      <Tabs
        defaultActiveKey="1"
        items={tabItems}
        tabBarExtraContent={
          <div className="flex flex-wrap gap-2">
            {hasAllWorklogPermission && (
              <Button
                type="primary"
                onClick={() => navigate("/worklog/allworklog")}
              >
                View All Worklogs
              </Button>
            )}
            <Button type="primary" onClick={() => navigate("/worklogs/new")}>
              Create
            </Button>
          </div>
        }
      />
    </>
  );
};

export default AllWorklogs;

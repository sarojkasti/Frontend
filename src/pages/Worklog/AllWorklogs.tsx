import AllWorklogTable from "@/components/Worklog/AllWorklogTable";
import IncomingWorklogTable from "@/components/Worklog/IncomingWorklogTable";
import { Tabs, Button, Input } from "antd";
import { useSession } from "@/context/SessionContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PlusOutlined, SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/hooks/useIsMobile";

const AllWorklogs = () => {
  const { profile } = useSession();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      children: <AllWorklogTable status="requested" searchQuery={searchQuery} />,
    },
    {
      label: `Approved`,
      key: "2",
      children: <AllWorklogTable status="approved" searchQuery={searchQuery} />,
    },
    {
      label: `Rejected`,
      key: "3",
      children: <AllWorklogTable status="rejected" searchQuery={searchQuery} />,
    },
  ];

  if (userRole !== "auditjunior") {
    tabItems.push(
      {
        label: `Incoming Requests`,
        key: "4",
        children: <IncomingWorklogTable status="requested" searchQuery={searchQuery} />,
      },
      {
        label: `Incoming Approved`,
        key: "5",
        children: <IncomingWorklogTable status="approved" searchQuery={searchQuery} />,
      },
      {
        label: `Incoming Rejected`,
        key: "6",
        children: <IncomingWorklogTable status="rejected" searchQuery={searchQuery} />,
      },
    );
  }

  return (
    <div className="relative min-h-[400px] pb-16 sm:pb-0 px-2 sm:px-0">
      {/* Mobile search bar toggle */}
      {isMobile && showMobileSearch && (
        <div className="mb-3 px-4 sm:px-1">
          <Input.Search
            placeholder="Search worklogs by project, task, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            autoFocus
            className="w-full shadow-sm"
          />
        </div>
      )}

      <Tabs
        defaultActiveKey="1"
        items={tabItems}
        renderTabBar={
          isMobile
            ? (props, DefaultTabBar) => (
                <div className="overflow-x-auto whitespace-nowrap px-4 sm:px-0">
                  <DefaultTabBar {...props} style={{ marginBottom: 0 }} />
                </div>
              )
            : undefined
        }
        tabBarStyle={
          isMobile
            ? {
                overflowX: "auto",
                whiteSpace: "nowrap",
                marginBottom: 12,
                paddingLeft: "16px",
                paddingRight: "16px",
              }
            : undefined
        }
        tabBarExtraContent={
          !isMobile ? (
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
          ) : undefined
        }
      />

      {/* Floating Action Buttons for Mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-lg active:scale-95 transition-all"
            aria-label="Search worklogs"
          >
            {showMobileSearch ? <CloseOutlined /> : <SearchOutlined />}
          </button>
          <button
            onClick={() => navigate("/worklogs/new")}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all hover:bg-blue-700"
            aria-label="Create Worklog"
          >
            <PlusOutlined />
          </button>
        </div>
      )}
    </div>
  );
};

export default AllWorklogs;

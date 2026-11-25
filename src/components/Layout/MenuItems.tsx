import { useSession } from "@/context/SessionContext";
import {
  DashboardOutlined,
  ProjectOutlined,
  CalendarOutlined,
  SettingOutlined,
  SafetyOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  NotificationOutlined,
  CopyOutlined,
  ProfileOutlined,
  BankOutlined,
  AccountBookOutlined,
  FieldTimeOutlined,
  CoffeeOutlined,
  BarChartOutlined,
  UserSwitchOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import _ from "lodash";
import React from "react";
import { useSidebarSummary } from "@/hooks/dashboard/useSidebarSummary";
import NavQuickPeekPopover from "./NavQuickPeekPopover";

export interface MenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  [key: string]: any;
}

export const MenuItems = (collapsed = false): MenuItem[] => {
  const { permissionChecker } = useSession();
  const { data: sidebarSummary } = useSidebarSummary();

  const isSuperOrAdmin = permissionChecker.isSuperAdmin();

  const hasReportsPermission =
    isSuperOrAdmin || permissionChecker.hasResourceAccess("reports");

  const hasWorklogPagePermission =
    isSuperOrAdmin ||
    permissionChecker.hasPermission("get", "/worklogs/user") ||
    permissionChecker.hasPermission("get", "/worklogs/allworklog");

  const renderNavLabel = (
    title: string,
    options?: {
      recentCount?: number;
      totalCount?: number;
      popoverType?: "project" | "client" | "users" | "client_report" | "client_user";
      recentItems?: Array<{
        id: string;
        name: string;
        status?: string;
        createdAt: string;
        clientName?: string;
        creator?: { id: string; name: string; avatar?: string } | null;
      }>;
    }
  ) => {
    if (collapsed) {
      return title;
    }

    const count = options?.recentCount;
    const total = options?.totalCount;
    const hasRecent = typeof count === "number" && count > 0;

    const labelNode = (
      <div className="flex items-center justify-between w-full overflow-hidden select-none pr-1">
        <span className="truncate text-[13.5px] font-medium">{title}</span>
        {typeof count === "number" && (
          <span
            className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full min-w-[20px] h-[18px] ml-1.5 shrink-0 transition-colors ${
              hasRecent
                ? "bg-blue-100 text-blue-700 font-bold border border-blue-200"
                : "bg-slate-100 text-slate-400 font-normal"
            }`}
            title={
              total !== undefined
                ? `${count} added in the last month (${total} total)`
                : `${count} added in the last month`
            }
          >
            {count}
          </span>
        )}
      </div>
    );

    if (options?.popoverType) {
      return (
        <NavQuickPeekPopover
          type={options.popoverType}
          totalCount={total || 0}
          recentCount={count || 0}
          recentItems={options.recentItems || []}
        >
          {labelNode}
        </NavQuickPeekPopover>
      );
    }

    return labelNode;
  };

  const items = [
    {
      key: "/",
      label: renderNavLabel("Home"),
      resource: "default",
      icon: React.createElement(DashboardOutlined),
    },
    {
      key: "/users",
      label: renderNavLabel("Users", {
        recentCount: isSuperOrAdmin ? sidebarSummary?.counts?.users : 0,
        totalCount: isSuperOrAdmin ? sidebarSummary?.counts?.totalUsers : 0,
        popoverType: isSuperOrAdmin ? "users" : undefined,
        recentItems: isSuperOrAdmin ? sidebarSummary?.recentUsers : [],
      }),
      resource: "user",
      visible:
        isSuperOrAdmin ||
        permissionChecker.hasPermission("post", "/users") ||
        permissionChecker.hasPermission("patch", "/users/:id"),
      icon: React.createElement(TeamOutlined),
    },
    {
      key: "/projects",
      label: renderNavLabel("Project", {
        recentCount: sidebarSummary?.counts?.projects,
        totalCount: sidebarSummary?.counts?.totalProjects,
        popoverType: "project",
        recentItems: sidebarSummary?.recentProjects,
      }),
      resource: "default",
      icon: React.createElement(ProjectOutlined),
    },
    {
      key: "/calendar",
      label: renderNavLabel("Calendar"),
      resource: "default",
      icon: React.createElement(CalendarOutlined),
    },
    {
      key: "/task-template",
      label: renderNavLabel("Task Template"),
      resource: "task-template",
      icon: React.createElement(CopyOutlined),
    },
    {
      key: "/tasks",
      label: renderNavLabel("Tasks", {
        recentCount: sidebarSummary?.counts?.tasks,
        totalCount: sidebarSummary?.counts?.totalTasks,
      }),
      resource: "default",
      icon: React.createElement(ProfileOutlined),
    },
    {
      key: "/client",
      label: renderNavLabel("Client", {
        recentCount: sidebarSummary?.counts?.clients,
        totalCount: sidebarSummary?.counts?.totalClients,
        popoverType: "client",
        recentItems: sidebarSummary?.recentClients,
      }),
      resource: "client",
      icon: React.createElement(BankOutlined),
    },
    {
      key: "/billing",
      label: renderNavLabel("Billing"),
      resource: "billing",
      icon: React.createElement(AccountBookOutlined),
    },
    {
      key: "/worklogs-all",
      label: renderNavLabel("Worklogs"),
      resource: "default",
      icon: React.createElement(FieldTimeOutlined),
    },
    {
      key: "/attendance",
      label: renderNavLabel("Attendance"),
      resource: "default",
      icon: React.createElement(ClockCircleOutlined),
    },
    {
      key: "/leave-management",
      label: renderNavLabel("Leave"),
      resource: "default",
      icon: React.createElement(CoffeeOutlined),
    },
    {
      key: "/notice-board",
      label: renderNavLabel("Notice Board", {
        recentCount: sidebarSummary?.counts?.notices,
        totalCount: sidebarSummary?.counts?.totalNotices,
      }),
      resource: "default",
      icon: React.createElement(NotificationOutlined),
    },
    {
      key: "/todotask",
      label: renderNavLabel("Todo Tasks"),
      resource: "default",
      icon: React.createElement(CheckSquareOutlined),
    },
    {
      key: "/client-reports",
      label: renderNavLabel("Client Reports", {
        recentCount: sidebarSummary?.counts?.clientReports,
        totalCount: sidebarSummary?.counts?.totalClientReports,
        popoverType: "client_report",
        recentItems: sidebarSummary?.recentClientReports,
      }),
      resource: "client-reports",
      icon: React.createElement(FileTextOutlined),
    },
    {
      key: "/client-users",
      label: renderNavLabel("Client Users", {
        recentCount: sidebarSummary?.counts?.clientUsers,
        totalCount: sidebarSummary?.counts?.totalClientUsers,
        popoverType: "client_user",
        recentItems: sidebarSummary?.recentClientUsers,
      }),
      resource: "client-users",
      icon: React.createElement(UserSwitchOutlined),
    },
    {
      key: "/reports",
      label: renderNavLabel("Reports"),
      resource: "reports",
      visible: hasReportsPermission,
      icon: React.createElement(BarChartOutlined),
    },
    {
      key: "/phonebook",
      label: renderNavLabel("Phonebook"),
      resource: "default",
      icon: React.createElement(PhoneOutlined),
    },
  ];

  const filteredItems = items
    .filter((item: any) => {
      if (item.visible !== undefined) {
        return item.visible;
      }

      // Always show attendance & notice board for authenticated users
      if (item.resource === "default") {
        return true;
      }
      return permissionChecker.hasResourceAccess(item.resource);
    })
    .map((item) => {
      // Strip custom properties that shouldn't go to DOM
      const { visible, resource, ...rest } = item;
      return rest;
    });

  return filteredItems;
};

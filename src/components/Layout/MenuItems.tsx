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
      weeklyCount?: number;
      monthlyCount?: number;
      totalCount?: number;
      popoverType?: "project" | "client" | "users" | "client_report" | "client_user" | "tasks" | "notices" | "phonebook";
      recentItems?: Array<{
        id: string;
        name: string;
        status?: string;
        createdAt: string;
        clientName?: string;
        creator?: { id: string; name: string; avatar?: string } | null;
      }>;
      recentUpdatedItems?: Array<{
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

    const weekly = options?.weeklyCount;
    const monthly = options?.monthlyCount;
    const total = options?.totalCount;
    const hasWeeklyChanges = typeof weekly === "number" && weekly > 0;

    const labelNode = (
      <div className="flex items-center justify-between w-full overflow-hidden select-none pr-1">
        <span className="truncate text-[13.5px] font-medium">{title}</span>
        {hasWeeklyChanges && (
          <span
            className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[20px] h-[18px] ml-1.5 shrink-0 transition-colors bg-blue-100 text-blue-700 border border-blue-200"
            title={
              total !== undefined
                ? `${weekly} changes this week (${monthly || 0} this month, ${total} total)`
                : `${weekly} changes this week`
            }
          >
            {weekly}
          </span>
        )}
      </div>
    );

    if (options?.popoverType) {
      return (
        <NavQuickPeekPopover
          type={options.popoverType}
          totalCount={total || 0}
          weeklyCount={weekly || 0}
          recentCount={monthly || 0}
          recentItems={options.recentItems || []}
          recentUpdatedItems={options.recentUpdatedItems || []}
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
        weeklyCount: isSuperOrAdmin ? sidebarSummary?.counts?.weeklyUsers : 0,
        monthlyCount: isSuperOrAdmin ? sidebarSummary?.counts?.users : 0,
        totalCount: isSuperOrAdmin ? sidebarSummary?.counts?.totalUsers : 0,
        popoverType: isSuperOrAdmin ? "users" : undefined,
        recentItems: isSuperOrAdmin ? sidebarSummary?.recentUsers : [],
        recentUpdatedItems: isSuperOrAdmin ? sidebarSummary?.recentUpdatedUsers : [],
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
        weeklyCount: sidebarSummary?.counts?.weeklyProjects,
        monthlyCount: sidebarSummary?.counts?.projects,
        totalCount: sidebarSummary?.counts?.totalProjects,
        popoverType: "project",
        recentItems: sidebarSummary?.recentProjects,
        recentUpdatedItems: sidebarSummary?.recentUpdatedProjects,
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
        weeklyCount: sidebarSummary?.counts?.weeklyTasks,
        monthlyCount: sidebarSummary?.counts?.tasks,
        totalCount: sidebarSummary?.counts?.totalTasks,
        popoverType: "tasks",
        recentItems: sidebarSummary?.recentTasks,
        recentUpdatedItems: sidebarSummary?.recentUpdatedTasks,
      }),
      resource: "default",
      icon: React.createElement(ProfileOutlined),
    },
    {
      key: "/client",
      label: renderNavLabel("Client", {
        weeklyCount: sidebarSummary?.counts?.weeklyClients,
        monthlyCount: sidebarSummary?.counts?.clients,
        totalCount: sidebarSummary?.counts?.totalClients,
        popoverType: "client",
        recentItems: sidebarSummary?.recentClients,
        recentUpdatedItems: sidebarSummary?.recentUpdatedClients,
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
        weeklyCount: sidebarSummary?.counts?.weeklyNotices,
        monthlyCount: sidebarSummary?.counts?.notices,
        totalCount: sidebarSummary?.counts?.totalNotices,
        popoverType: "notices",
        recentItems: sidebarSummary?.recentNotices,
        recentUpdatedItems: sidebarSummary?.recentUpdatedNotices,
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
        weeklyCount: sidebarSummary?.counts?.weeklyClientReports,
        monthlyCount: sidebarSummary?.counts?.clientReports,
        totalCount: sidebarSummary?.counts?.totalClientReports,
        popoverType: "client_report",
        recentItems: sidebarSummary?.recentClientReports,
        recentUpdatedItems: sidebarSummary?.recentUpdatedClientReports,
      }),
      resource: "client-reports",
      icon: React.createElement(FileTextOutlined),
    },
    {
      key: "/client-users",
      label: renderNavLabel("Client Users", {
        weeklyCount: sidebarSummary?.counts?.weeklyClientUsers,
        monthlyCount: sidebarSummary?.counts?.clientUsers,
        totalCount: sidebarSummary?.counts?.totalClientUsers,
        popoverType: "client_user",
        recentItems: sidebarSummary?.recentClientUsers,
        recentUpdatedItems: sidebarSummary?.recentUpdatedClientUsers,
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
      label: renderNavLabel("Phonebook", {
        weeklyCount: sidebarSummary?.counts?.weeklyPhonebook,
        monthlyCount: sidebarSummary?.counts?.phonebook,
        totalCount: sidebarSummary?.counts?.totalPhonebook,
        popoverType: "phonebook",
        recentItems: sidebarSummary?.recentPhonebook,
        recentUpdatedItems: sidebarSummary?.recentUpdatedPhonebook,
      }),
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

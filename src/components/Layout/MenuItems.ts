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
  UserSwitchOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import _ from "lodash";
import React from "react";

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export const MenuItems = (): MenuProps[] => {
  const { permissions, profile } = useSession();

  const isSuperOrAdmin =
    profile?.role?.name === "superuser" ||
    profile?.role?.name === "administrator" ||
    _.some(permissions, { resource: "admin" });

  const hasReportsPermission =
    isSuperOrAdmin || _.some(permissions, { resource: "reports" });

  const hasWorklogPagePermission = (permissions || []).some((perm: any) => {
    if (typeof perm !== "object") return false;
    const method = perm?.method?.toLowerCase?.();
    const path = perm?.path;
    return method === "get" && (path === "/worklogs/user" || path === "/worklogs/allworklog");
  });

  const items = [
    {
      key: "/",
      label: "Home",
      resource: "user",
      icon: React.createElement(DashboardOutlined),
    },
    {
      key: "/users",
      label: "Users",
      resource: "user",
      icon: React.createElement(TeamOutlined),
    },
    {
      key: "/projects",
      label: "Project",
      resource: "projects",
      icon: React.createElement(ProjectOutlined),
    },
    {
      key: "/calendar",
      label: "Calendar",
      resource: "calendar",
      icon: React.createElement(CalendarOutlined),
    },
    {
      key: "/task-template",
      label: "Task Template",
      resource: "task-template",
      icon: React.createElement(CopyOutlined),
    },
    {
      key: "/tasks",
      label: "Tasks",
      resource: "tasks",
      icon: React.createElement(ProfileOutlined),
    },
    {
      key: "/client",
      label: "Client",
      resource: "client",
      icon: React.createElement(BankOutlined),
    },
    {
      key: "/billing",
      label: "Billing",
      resource: "billing",
      icon: React.createElement(AccountBookOutlined),
    },
    {
      key: "/worklogs-all",
      label: "Worklogs",
      resource: "worklogs",
      icon: React.createElement(FieldTimeOutlined),
      visible: hasWorklogPagePermission,
    },
    {
      key: "/attendance",
      label: "Attendance",
      resource: "default", // Make attendance available to all authenticated users
      icon: React.createElement(ClockCircleOutlined),
    },
    {
      key: "/leave-management",
      label: "Leave",
      resource: "leave",
      icon: React.createElement(CoffeeOutlined),
    },
    {
      key: "/notice-board",
      label: "Notice Board",
      resource: "default", // Make notice board available to all authenticated users
      icon: React.createElement(NotificationOutlined),
    },
    {
      key: "/todotask",
      label: "Todo Tasks",
      resource: "todo-task",
      icon: React.createElement(CheckSquareOutlined),
    },
    {
      key: "/role",
      label: "Roles",
      resource: "admin",
      icon: React.createElement(TeamOutlined),
    },
    {
      key: "/permission",
      label: "Permissions",
      resource: "admin",
      icon: React.createElement(SafetyOutlined),
    },
    {
      key: "/permission/assign",
      label: "Assign Permissions",
      resource: "admin",
      icon: React.createElement(SettingOutlined),
    },
    {
      key: "/client-reports",
      label: "Client Reports",
      resource: "client-reports",
      icon: React.createElement(BarChartOutlined),
    },
    {
      key: "/client-users",
      label: "Client Users",
      resource: "client-users",
      icon: React.createElement(UserSwitchOutlined),
    },
    {
      key: "/reports",
      label: "Reports",
      resource: "reports",
      visible: hasReportsPermission,
      icon: React.createElement(BarChartOutlined),
    },
  ];

  const filteredItems = _.filter(items, (item) => {
    if ((item as any).visible !== undefined) {
      return (item as any).visible;
    }

    // Always show attendance & notice board for authenticated users
    if (item.resource === "default") {
      return true;
    }
    // For other items, use original logic
    return _.some(permissions, { resource: item.resource });
  }).map((item) => {
    // Strip custom properties that shouldn't go to DOM
    const { visible, resource, ...rest } = item;
    return rest;
  });

  return filteredItems;
};

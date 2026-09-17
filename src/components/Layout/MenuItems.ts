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
  const { permissionChecker } = useSession();

  const isSuperOrAdmin = permissionChecker.isSuperAdmin();

  const hasReportsPermission =
    isSuperOrAdmin || permissionChecker.hasResourceAccess("reports");

  const hasWorklogPagePermission =
    isSuperOrAdmin ||
    permissionChecker.hasPermission("get", "/worklogs/user") ||
    permissionChecker.hasPermission("get", "/worklogs/allworklog");

  const items = [
    {
      key: "/",
      label: "Home",
      resource: "default",
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
      resource: "default",
      icon: React.createElement(ProjectOutlined),
    },
    {
      key: "/calendar",
      label: "Calendar",
      resource: "default",
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
      resource: "default",
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
      resource: "default",
      icon: React.createElement(FieldTimeOutlined),
    },
    {
      key: "/attendance",
      label: "Attendance",
      resource: "default",
      icon: React.createElement(ClockCircleOutlined),
    },
    {
      key: "/leave-management",
      label: "Leave",
      resource: "default",
      icon: React.createElement(CoffeeOutlined),
    },
    {
      key: "/notice-board",
      label: "Notice Board",
      resource: "default",
      icon: React.createElement(NotificationOutlined),
    },
    {
      key: "/todotask",
      label: "Todo Tasks",
      resource: "default",
      icon: React.createElement(CheckSquareOutlined),
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

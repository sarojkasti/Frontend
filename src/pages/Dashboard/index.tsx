import Notification from "@/components/Notification/Notification";
import { BackgroundAlertsStatus } from "@/components/Notification/BackgroundAlertsStatus";
import { AttendanceDashboard, WorkingTimeDashboard, UserAvailabilityDashboard } from "@/components/Dashboard";
import { canViewDashboardAttendance, canViewDashboardWorkingTime, canViewUserAvailability } from "@/utils/permissionHelpers";
import { useSession } from "@/context/SessionContext";
import { Card, Col, Row, Spin, Segmented, Typography } from "antd";
import { UserOutlined, ApartmentOutlined } from "@ant-design/icons";
import React, { Suspense, useState } from "react";
import Analytic from "./Analytic";
import UserDashboard from "./UserDashboard";

const Dashboard: React.FC = () => {
  const { permissions, permissionChecker, profile } = useSession();
  const canViewAttendance = canViewDashboardAttendance(permissions || []);
  const canViewWorkingTime = canViewDashboardWorkingTime(permissions || []);
  const canViewAvailability = canViewUserAvailability(permissions || []);

  // Strictly only admin and super user need/have access to organization overview
  const roleName = (profile?.role as any)?.name?.toLowerCase()?.trim() || "";
  const isSuperAdminOrAdmin =
    Boolean(permissionChecker?.isSuperAdmin && permissionChecker.isSuperAdmin()) ||
    roleName === "admin" ||
    roleName === "superuser" ||
    roleName === "super_user" ||
    roleName === "administrator";

  const canAccessOrgOverview = isSuperAdminOrAdmin;

  // View state: only admins/superusers can access organization overview
  const [activeView, setActiveView] = useState<"workspace" | "organization">(() => {
    if (!canAccessOrgOverview) return "workspace";
    const saved = localStorage.getItem("artha_dashboard_view");
    return saved === "organization" ? "organization" : "workspace";
  });

  const handleViewChange = (val: string | number) => {
    const view = String(val) as "workspace" | "organization";
    setActiveView(view);
    localStorage.setItem("artha_dashboard_view", view);
  };

  // If not admin or superuser, directly render the personal workspace dashboard
  if (!canAccessOrgOverview) {
    return <UserDashboard />;
  }

  return (
    <div className="flex flex-col gap-4 pb-16" style={{ minHeight: 0 }}>
      {/* View Switcher strictly for Admin and Super User */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-sm font-semibold text-slate-800">
            {activeView === "workspace" ? "Personal Workspace" : "Organization Analytics"}
          </span>
          <span className="text-xs text-slate-500 block">
            {activeView === "workspace"
              ? "Your daily tasks, logged workhours, leave status & attendance"
              : "Company-wide project stats, role distribution & team attendance"}
          </span>
        </div>

        <Segmented
          value={activeView}
          onChange={handleViewChange}
          options={[
            {
              label: "My Workspace",
              value: "workspace",
              icon: <UserOutlined />,
            },
            {
              label: "Organization Overview",
              value: "organization",
              icon: <ApartmentOutlined />,
            },
          ]}
          className="bg-slate-100 font-medium"
        />
      </div>

      {/* 1. Personal User Dashboard View */}
      {activeView === "workspace" ? (
        <UserDashboard />
      ) : (
        /* 2. Organization Analytics / Management Dashboard View */
        <div className="flex flex-col gap-4">
          <Row gutter={[8, 8]} style={{ flex: "0 0 auto" }}>
            <Col xs={24} lg={17}>
              <Suspense fallback={<Spin size="large" />}>
                <Analytic />
              </Suspense>
            </Col>
            {/* Hidden on mobile view, shown on desktop */}
            <Col xs={0} lg={7} className="hidden lg:block">
              <Suspense fallback={<Spin size="large" />}>
                <Card 
                  title="Notifications"
                  extra={<BackgroundAlertsStatus />}
                  style={{ 
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
                  }}
                  styles={{
                    body: {
                      flex: 1,
                      overflow: "auto",
                      maxHeight: "calc(100vh - 200px)"
                    }
                  }}
                >
                  <Notification />
                </Card>
              </Suspense>
            </Col>
          </Row>

          {/* Attendance Dashboard - Only visible to users with permission */}
          {canViewAttendance && (
            <Row gutter={8}>
              <Col span={24}>
                <Suspense fallback={<Spin size="large" />}>
                  <AttendanceDashboard />
                </Suspense>
              </Col>
            </Row>
          )}

          {/* Working Time Dashboard - Only visible to users with permission */}
          {canViewWorkingTime && (
            <Row gutter={8}>
              <Col span={24}>
                <Suspense fallback={<Spin size="large" />}>
                  <WorkingTimeDashboard />
                </Suspense>
              </Col>
            </Row>
          )}

          {/* User Availability Dashboard - Only visible to users with permission */}
          {canViewAvailability && (
            <Row gutter={8}>
              <Col span={24}>
                <Suspense fallback={<Spin size="large" />}>
                  <UserAvailabilityDashboard />
                </Suspense>
              </Col>
            </Row>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

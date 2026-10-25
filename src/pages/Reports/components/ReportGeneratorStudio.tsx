import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Avatar, Space, message, Badge, Button } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import {
  ReportType,
  ReportFilterState,
  ReportColumnConfig,
  ReportSummaryKpi,
} from "../types/reportTypes";
import { ReportFilterControls } from "./ReportFilterControls";
import { ReportTableView } from "./ReportTableView";
import { ReportPrintView } from "./ReportPrintView";
import { FormattedWorklogDescription } from "./FormattedWorklogDescription";
import { fetchAllWorklogs } from "@/service/worklog.service";
import { fetchExportAttendance } from "@/service/attendence.service";
import { fetchProjects } from "@/service/project.service";
import { listActiveUsers } from "@/service/user.service";
import { fetchDepartments } from "@/service/department.service";
import { fetchLeaves } from "@/service/leave.service";
import { fetchManagerReportData } from "@/service/report.service";
import { formatTime12Hour } from "@/utils/formatUtils";
import { useSession } from "@/context/SessionContext";

const DEFAULT_FILTER_STATE: ReportFilterState = {
  reportType: "worklog",
  datePreset: "this_month",
  startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
  endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
  departmentId: "all",
  userIds: [],
  projectId: "all",
  status: "all",
  detailMode: "detailed",
  selectedColumns: [],
  searchKeyword: "",
};

const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  worklog: "Timesheets, tasks, logged hours & work descriptions",
  attendance: "Office register, clock in/out, duration & remarks",
  reconciliation: "Side-by-side attendance vs worklog hours comparison",
  project: "Budget variance, estimated vs actual hours & progress",
  leave: "Leaves taken, leave types, approvals & absence log",
};

interface ReportGeneratorStudioProps {
  initialReportType?: ReportType;
  onBack?: () => void;
  hideReportTypePicker?: boolean;
}

export const ReportGeneratorStudio: React.FC<ReportGeneratorStudioProps> = ({
  initialReportType,
  onBack,
  hideReportTypePicker = false,
}) => {
  const { profile } = useSession();
  const [filters, setFilters] = useState<ReportFilterState>(() => ({
    ...DEFAULT_FILTER_STATE,
    reportType: initialReportType || DEFAULT_FILTER_STATE.reportType,
  }));
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [generationTrigger, setGenerationTrigger] = useState(0);

  useEffect(() => {
    if (initialReportType && initialReportType !== filters.reportType) {
      setFilters((prev) => ({
        ...prev,
        reportType: initialReportType,
      }));
    }
  }, [initialReportType]);

  // 1. Master Data Queries (Active Users, Departments, Projects)
  const { data: usersData } = useQuery({
    queryKey: ["report-active-users"],
    queryFn: () => listActiveUsers().catch(() => []),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["report-departments"],
    queryFn: () => fetchDepartments().catch(() => []),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["report-projects"],
    queryFn: () => fetchProjects({ status: "all" }).catch(() => []),
  });

  // Normalize Users List
  const allActiveUsers = useMemo(() => {
    const raw = Array.isArray(usersData) ? usersData : (usersData as any)?.results || [];
    return raw
      .filter((u: any) => !u.status || u.status.toLowerCase() === "active")
      .map((u: any) => ({
        id: String(u.id),
        name: u.name || u.username || "Employee",
        email: u.email || "",
        departmentId: u.profile?.departmentId || u.profile?.department?.id || "",
        departmentName: u.profile?.department?.name || "General",
        roleName: u.role?.displayName || u.role?.name || "Member",
      }));
  }, [usersData]);

  const activeUsersMap = useMemo(() => {
    const map = new Map<string, (typeof allActiveUsers)[0]>();
    allActiveUsers.forEach((u) => map.set(u.id, u));
    return map;
  }, [allActiveUsers]);

  // Normalize Departments List
  const departmentsList = useMemo(() => {
    return Array.isArray(departmentsData) ? departmentsData : [];
  }, [departmentsData]);

  // Normalize Projects List
  const projectsList = useMemo(() => {
    const raw = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.results || [];
    return raw.map((p: any) => ({
      id: String(p.id),
      name: p.name || "Project",
      code: p.code || "",
    }));
  }, [projectsData]);

  // 2. Data Queries for Specific Report Types
  // A. Worklogs Query
  const { data: rawWorklogsData, isLoading: isLoadingWorklogs, refetch: refetchWorklogs } = useQuery({
    queryKey: [
      "report-generator-worklogs",
      filters.startDate,
      filters.endDate,
      filters.projectId,
      filters.status,
      filters.userIds,
      generationTrigger,
    ],
    queryFn: () =>
      fetchAllWorklogs({
        startDate: filters.startDate,
        endDate: filters.endDate,
        projectId: filters.projectId !== "all" ? filters.projectId : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        userId: filters.userIds.length === 1 ? filters.userIds[0] : undefined,
      }),
    enabled: filters.reportType === "worklog" || filters.reportType === "reconciliation",
  });

  // B. Attendance Query
  const { data: rawAttendanceData, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: [
      "report-generator-attendance",
      filters.startDate,
      filters.endDate,
      filters.departmentId,
      filters.userIds,
      generationTrigger,
    ],
    queryFn: () =>
      fetchExportAttendance({
        startDate: filters.startDate,
        endDate: filters.endDate,
        departmentId: filters.departmentId !== "all" ? filters.departmentId : undefined,
        userId: filters.userIds.length === 1 ? filters.userIds[0] : undefined,
      }),
    enabled: filters.reportType === "attendance" || filters.reportType === "reconciliation",
  });

  // C. Project / Manager Query
  const { data: rawManagerData, isLoading: isLoadingManager, refetch: refetchManager } = useQuery({
    queryKey: ["report-generator-manager", generationTrigger],
    queryFn: () => fetchManagerReportData(),
    enabled: filters.reportType === "project",
  });

  // D. Leaves Query
  const { data: rawLeavesData, isLoading: isLoadingLeaves, refetch: refetchLeaves } = useQuery({
    queryKey: ["report-generator-leaves", filters.status, generationTrigger],
    queryFn: () => fetchLeaves(filters.status !== "all" ? filters.status : undefined),
    enabled: filters.reportType === "leave",
  });

  // 3. Define Column Configurations for Each Report Type
  const worklogDetailedColumns: ReportColumnConfig[] = useMemo(
    () => [
      { key: "sn", title: "S.N.", width: 60, align: "center", defaultVisible: true, category: "Basic" },
      { key: "date", title: "Work Date", dataIndex: "date", width: 110, defaultVisible: true, category: "Timing" },
      {
        key: "employeeName",
        title: "Employee",
        dataIndex: "employeeName",
        width: 170,
        defaultVisible: true,
        category: "Employee",
        render: (name: string, record: any) => (
          <Space orientation="horizontal" size="small">
            <Avatar size="small" style={{ backgroundColor: "#1677ff" }}>
              {(name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <span>{name}</span>
          </Space>
        ),
      },
      { key: "department", title: "Department", dataIndex: "department", width: 130, defaultVisible: true, category: "Employee" },
      { key: "projectName", title: "Project Name", dataIndex: "projectName", width: 180, defaultVisible: true, category: "Project" },
      { key: "projectCode", title: "Project Code", dataIndex: "projectCode", width: 110, defaultVisible: false, category: "Project" },
      { key: "taskName", title: "Task / Story", dataIndex: "taskName", width: 180, defaultVisible: true, category: "Task" },
      { key: "taskCode", title: "Task Code", dataIndex: "taskCode", width: 110, defaultVisible: false, category: "Task" },
      {
        key: "taskStatus",
        title: "Task Status",
        dataIndex: "taskStatus",
        width: 120,
        defaultVisible: false,
        category: "Task",
        render: (st: string) => (st ? <Tag>{st.toUpperCase()}</Tag> : "-"),
      },
      {
        key: "description",
        title: "Work Description",
        dataIndex: "description",
        width: 250,
        defaultVisible: true,
        category: "Details",
        render: (desc: string) => <FormattedWorklogDescription content={desc} />,
      },
      { key: "startTime", title: "Start Time", dataIndex: "startTime", width: 100, defaultVisible: true, category: "Timing" },
      { key: "endTime", title: "End Time", dataIndex: "endTime", width: 100, defaultVisible: true, category: "Timing" },
      {
        key: "loggedHours",
        title: "Logged (hrs)",
        dataIndex: "loggedHours",
        width: 110,
        align: "right",
        defaultVisible: true,
        category: "Timing",
        render: (hrs: number) => <strong>{hrs} hrs</strong>,
      },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        width: 120,
        align: "center",
        defaultVisible: true,
        category: "Status",
        render: (status: string) => {
          const s = (status || "").toLowerCase();
          if (s === "approved") return <Tag color="success">APPROVED</Tag>;
          if (s === "rejected") return <Tag color="error">REJECTED</Tag>;
          return <Tag color="processing">REQUESTED</Tag>;
        },
      },
      { key: "approvedBy", title: "Approved By", dataIndex: "approvedBy", width: 140, defaultVisible: true, category: "Status" },
      { key: "remarks", title: "Remarks", dataIndex: "remarks", width: 160, defaultVisible: false, category: "Details" },
    ],
    []
  );

  const worklogEmployeeSummaryColumns: ReportColumnConfig[] = useMemo(
    () => [
      { key: "sn", title: "S.N.", width: 60, align: "center", defaultVisible: true, category: "Basic" },
      {
        key: "name",
        title: "Employee Name",
        dataIndex: "name",
        width: 200,
        defaultVisible: true,
        category: "Employee",
        render: (name: string) => (
          <Space size="small">
            <Avatar size="small" style={{ backgroundColor: "#1677ff" }}>
              {(name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <span>{name}</span>
          </Space>
        ),
      },
      { key: "email", title: "Email", dataIndex: "email", width: 200, defaultVisible: true, category: "Employee" },
      { key: "department", title: "Department", dataIndex: "department", width: 140, defaultVisible: true, category: "Employee" },
      { key: "totalWorks", title: "Entries Count", dataIndex: "totalWorks", width: 120, align: "right", defaultVisible: true, category: "Totals" },
      {
        key: "totalHours",
        title: "Total Hours (hrs)",
        dataIndex: "totalHours",
        width: 140,
        align: "right",
        defaultVisible: true,
        category: "Totals",
        render: (h: number) => <strong>{h} hrs</strong>,
      },
      {
        key: "approvedHours",
        title: "Approved Hours (hrs)",
        dataIndex: "approvedHours",
        width: 150,
        align: "right",
        defaultVisible: true,
        category: "Totals",
        render: (h: number) => <Tag color="green">{h} hrs</Tag>,
      },
      {
        key: "pendingHours",
        title: "Pending Hours (hrs)",
        dataIndex: "pendingHours",
        width: 140,
        align: "right",
        defaultVisible: true,
        category: "Totals",
        render: (h: number) => (h > 0 ? <Tag color="orange">{h} hrs</Tag> : "0 hrs"),
      },
      { key: "projectsCount", title: "Projects Count", dataIndex: "projectsCount", width: 130, align: "center", defaultVisible: true, category: "Totals" },
    ],
    []
  );

  const attendanceDetailedColumns: ReportColumnConfig[] = useMemo(
    () => [
      { key: "sn", title: "S.N.", width: 60, align: "center", defaultVisible: true, category: "Basic" },
      { key: "date", title: "Attendance Date", dataIndex: "date", width: 120, defaultVisible: true, category: "Timing" },
      { key: "dayOfWeek", title: "Day", dataIndex: "dayOfWeek", width: 100, defaultVisible: true, category: "Timing" },
      {
        key: "employeeName",
        title: "Employee Name",
        dataIndex: "employeeName",
        width: 180,
        defaultVisible: true,
        category: "Employee",
        render: (name: string) => (
          <Space size="small">
            <Avatar size="small" style={{ backgroundColor: "#52c41a" }}>
              {(name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <span>{name}</span>
          </Space>
        ),
      },
      { key: "department", title: "Department", dataIndex: "department", width: 130, defaultVisible: true, category: "Employee" },
      { key: "role", title: "Role", dataIndex: "role", width: 130, defaultVisible: false, category: "Employee" },
      { key: "clockIn", title: "Clock In", dataIndex: "clockIn", width: 105, defaultVisible: true, category: "Attendance" },
      { key: "clockInRemark", title: "Clock In Remark", dataIndex: "clockInRemark", width: 160, defaultVisible: false, category: "Attendance" },
      { key: "clockOut", title: "Clock Out", dataIndex: "clockOut", width: 105, defaultVisible: true, category: "Attendance" },
      { key: "clockOutRemark", title: "Clock Out Remark", dataIndex: "clockOutRemark", width: 160, defaultVisible: false, category: "Attendance" },
      {
        key: "duration",
        title: "Duration (H:M)",
        dataIndex: "duration",
        width: 120,
        defaultVisible: true,
        category: "Attendance",
        render: (d: string) => <strong>{d}</strong>,
      },
      {
        key: "durationHoursDecimal",
        title: "Duration (hrs)",
        dataIndex: "durationHoursDecimal",
        width: 120,
        align: "right",
        defaultVisible: true,
        category: "Attendance",
      },
      {
        key: "attendanceStatus",
        title: "Status",
        dataIndex: "attendanceStatus",
        width: 130,
        align: "center",
        defaultVisible: true,
        category: "Status",
        render: (st: string) => {
          if (st === "Completed") return <Tag color="success">COMPLETED</Tag>;
          if (st === "In Progress") return <Tag color="processing">IN PROGRESS</Tag>;
          return <Tag color="default">NO RECORD</Tag>;
        },
      },
      {
        key: "isOvertime",
        title: "Overtime (>8h)",
        dataIndex: "isOvertime",
        width: 120,
        align: "center",
        defaultVisible: true,
        category: "Status",
        render: (ot: boolean) => (ot ? <Tag color="warning">OVERTIME</Tag> : "-"),
      },
      {
        key: "approvedWorklogHours",
        title: "Worklog (hrs)",
        dataIndex: "approvedWorklogHours",
        width: 120,
        align: "right",
        defaultVisible: true,
        category: "Reconciliation",
      },
    ],
    []
  );

  const attendanceEmployeeSummaryColumns: ReportColumnConfig[] = useMemo(
    () => [
      { key: "sn", title: "S.N.", width: 60, align: "center", defaultVisible: true, category: "Basic" },
      {
        key: "employeeName",
        title: "Employee Name",
        dataIndex: "employeeName",
        width: 200,
        defaultVisible: true,
        category: "Employee",
      },
      { key: "department", title: "Department", dataIndex: "department", width: 140, defaultVisible: true, category: "Employee" },
      { key: "presentDays", title: "Days Present", dataIndex: "presentDays", width: 120, align: "center", defaultVisible: true, category: "Summary" },
      {
        key: "totalClockedHours",
        title: "Total Clocked (hrs)",
        dataIndex: "totalClockedHours",
        width: 150,
        align: "right",
        defaultVisible: true,
        category: "Summary",
        render: (h: number) => <strong>{h} hrs</strong>,
      },
      {
        key: "avgDailyHours",
        title: "Avg Daily (hrs)",
        dataIndex: "avgDailyHours",
        width: 130,
        align: "right",
        defaultVisible: true,
        category: "Summary",
      },
      {
        key: "overtimeDays",
        title: "Overtime Days",
        dataIndex: "overtimeDays",
        width: 130,
        align: "center",
        defaultVisible: true,
        category: "Summary",
        render: (d: number) => (d > 0 ? <Tag color="orange">{d} days</Tag> : "0"),
      },
      {
        key: "totalWorklogHours",
        title: "Total Worklog (hrs)",
        dataIndex: "totalWorklogHours",
        width: 150,
        align: "right",
        defaultVisible: true,
        category: "Summary",
      },
    ],
    []
  );

  const reconciliationColumns: ReportColumnConfig[] = useMemo(
    () => [
      { key: "sn", title: "S.N.", width: 60, align: "center", defaultVisible: true, category: "Basic" },
      { key: "date", title: "Date", dataIndex: "date", width: 110, defaultVisible: true, category: "Timing" },
      { key: "employeeName", title: "Employee Name", dataIndex: "employeeName", width: 180, defaultVisible: true, category: "Employee" },
      { key: "department", title: "Department", dataIndex: "department", width: 130, defaultVisible: true, category: "Employee" },
      { key: "clockIn", title: "Clock In", dataIndex: "clockIn", width: 100, defaultVisible: true, category: "Attendance" },
      { key: "clockOut", title: "Clock Out", dataIndex: "clockOut", width: 100, defaultVisible: true, category: "Attendance" },
      {
        key: "attendanceHours",
        title: "Attendance (hrs)",
        dataIndex: "attendanceHours",
        width: 130,
        align: "right",
        defaultVisible: true,
        category: "Hours",
        render: (h: number) => <strong>{h} hrs</strong>,
      },
      {
        key: "worklogHours",
        title: "Worklog (hrs)",
        dataIndex: "worklogHours",
        width: 130,
        align: "right",
        defaultVisible: true,
        category: "Hours",
        render: (h: number) => <strong>{h} hrs</strong>,
      },
      {
        key: "variance",
        title: "Variance (Clock - Worklog)",
        dataIndex: "variance",
        width: 170,
        align: "right",
        defaultVisible: true,
        category: "Audit",
        render: (v: number) => {
          if (v > 0) return <span style={{ color: "#fa8c16", fontWeight: 600 }}>+{v} hrs (Underlogged)</span>;
          if (v < 0) return <span style={{ color: "#ff4d4f", fontWeight: 600 }}>{v} hrs (Overlogged)</span>;
          return <span style={{ color: "#52c41a", fontWeight: 600 }}>Balanced (0h)</span>;
        },
      },
      {
        key: "auditFlag",
        title: "Audit Finding",
        dataIndex: "auditFlag",
        width: 160,
        align: "center",
        defaultVisible: true,
        category: "Audit",
        render: (flag: string) => {
          if (flag === "Matched") return <Tag color="success">BALANCED</Tag>;
          if (flag === "Worklog Missing") return <Tag color="error">NO WORKLOG</Tag>;
          if (flag === "Underlogged") return <Tag color="warning">UNDERLOGGED</Tag>;
          if (flag === "Overlogged") return <Tag color="purple">EXCESS WORKLOG</Tag>;
          return <Tag>{flag}</Tag>;
        },
      },
      { key: "projects", title: "Projects Worked", dataIndex: "projects", width: 180, defaultVisible: true, category: "Audit" },
    ],
    []
  );

  const projectColumns: ReportColumnConfig[] = useMemo(
    () => [
      { key: "sn", title: "S.N.", width: 60, align: "center", defaultVisible: true, category: "Basic" },
      { key: "code", title: "Project Code", dataIndex: "code", width: 110, defaultVisible: true, category: "Project" },
      { key: "name", title: "Project Name", dataIndex: "name", width: 220, defaultVisible: true, category: "Project" },
      { key: "manager", title: "Manager", dataIndex: "manager", width: 160, defaultVisible: true, category: "Project" },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        width: 120,
        align: "center",
        defaultVisible: true,
        category: "Project",
        render: (st: string) => <Tag color="blue">{(st || "ACTIVE").toUpperCase()}</Tag>,
      },
      {
        key: "completionPercent",
        title: "Progress (%)",
        dataIndex: "completionPercent",
        width: 120,
        align: "right",
        defaultVisible: true,
        category: "Metrics",
        render: (p: number) => <strong>{p}%</strong>,
      },
      {
        key: "budget",
        title: "Budget (NPR)",
        dataIndex: "budget",
        width: 150,
        align: "right",
        defaultVisible: true,
        category: "Financial",
        render: (b: number) => `NPR ${(b || 0).toLocaleString("en-IN")}`,
      },
      {
        key: "completionCost",
        title: "Actual Cost (NPR)",
        dataIndex: "completionCost",
        width: 150,
        align: "right",
        defaultVisible: true,
        category: "Financial",
        render: (c: number) => `NPR ${(c || 0).toLocaleString("en-IN")}`,
      },
      {
        key: "costVariance",
        title: "Cost Variance (NPR)",
        dataIndex: "costVariance",
        width: 160,
        align: "right",
        defaultVisible: true,
        category: "Financial",
        render: (v: number) => (
          <span style={{ color: v > 0 ? "#ff4d4f" : "#52c41a", fontWeight: 600 }}>
            {v > 0 ? `+NPR ${v.toLocaleString("en-IN")} (Over)` : `-NPR ${Math.abs(v).toLocaleString("en-IN")} (Saved)`}
          </span>
        ),
      },
      { key: "estimatedHours", title: "Estimated (hrs)", dataIndex: "estimatedHours", width: 130, align: "right", defaultVisible: true, category: "Hours" },
      { key: "actualLoggedHours", title: "Logged (hrs)", dataIndex: "actualLoggedHours", width: 130, align: "right", defaultVisible: true, category: "Hours" },
    ],
    []
  );

  const leaveColumns: ReportColumnConfig[] = useMemo(
    () => [
      { key: "sn", title: "S.N.", width: 60, align: "center", defaultVisible: true, category: "Basic" },
      { key: "employeeName", title: "Employee Name", dataIndex: "employeeName", width: 180, defaultVisible: true, category: "Employee" },
      { key: "department", title: "Department", dataIndex: "department", width: 140, defaultVisible: true, category: "Employee" },
      {
        key: "leaveType",
        title: "Leave Type",
        dataIndex: "leaveType",
        width: 140,
        defaultVisible: true,
        category: "Details",
        render: (lt: string) => <Tag color="blue">{lt}</Tag>,
      },
      { key: "startDate", title: "Start Date", dataIndex: "startDate", width: 120, defaultVisible: true, category: "Timing" },
      { key: "endDate", title: "End Date", dataIndex: "endDate", width: 120, defaultVisible: true, category: "Timing" },
      {
        key: "days",
        title: "Days",
        dataIndex: "days",
        width: 100,
        align: "right",
        defaultVisible: true,
        category: "Details",
        render: (d: number) => <strong>{d} days</strong>,
      },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        width: 120,
        align: "center",
        defaultVisible: true,
        category: "Status",
        render: (st: string) => {
          const s = (st || "").toLowerCase();
          if (s === "approved") return <Tag color="success">APPROVED</Tag>;
          if (s === "rejected") return <Tag color="error">REJECTED</Tag>;
          return <Tag color="warning">PENDING</Tag>;
        },
      },
      { key: "approver", title: "Approver", dataIndex: "approver", width: 150, defaultVisible: true, category: "Status" },
      { key: "reason", title: "Reason / Notes", dataIndex: "reason", width: 220, defaultVisible: true, category: "Details" },
    ],
    []
  );

  // Active columns set based on report type and detail mode
  const currentAvailableColumns = useMemo(() => {
    switch (filters.reportType) {
      case "worklog":
        return filters.detailMode === "summary_employee" ? worklogEmployeeSummaryColumns : worklogDetailedColumns;
      case "attendance":
        return filters.detailMode === "summary_employee" ? attendanceEmployeeSummaryColumns : attendanceDetailedColumns;
      case "reconciliation":
        return reconciliationColumns;
      case "project":
        return projectColumns;
      case "leave":
        return leaveColumns;
      default:
        return worklogDetailedColumns;
    }
  }, [
    filters.reportType,
    filters.detailMode,
    worklogDetailedColumns,
    worklogEmployeeSummaryColumns,
    attendanceDetailedColumns,
    attendanceEmployeeSummaryColumns,
    reconciliationColumns,
    projectColumns,
    leaveColumns,
  ]);

  // Sync selected columns when report type or detail mode changes
  useEffect(() => {
    const defaultVisibleKeys = currentAvailableColumns.filter((c) => c.defaultVisible).map((c) => c.key);
    setFilters((prev) => ({ ...prev, selectedColumns: defaultVisibleKeys }));
  }, [currentAvailableColumns]);

  // 4. Transform Raw Datasets into Formatted Report Rows & KPIs
  // Helper to parse time
  const parseTime = (timeStr: string | null | undefined, dateStr: string) => {
    if (!timeStr) return null;
    const formatted = formatTime12Hour(timeStr);
    if (formatted === "-") return null;
    const m = moment(`${dateStr} ${formatted}`, "YYYY-MM-DD hh:mm:ss a");
    if (m.isValid()) return m;
    let fallback = moment(timeStr, ["HH:mm:ss a", "hh:mm:ss a", "HH:mm:ss", "HH:mm"]);
    return fallback.isValid() ? fallback : null;
  };

  const { reportRows, reportKpis, reportTitle } = useMemo(() => {
    let rows: any[] = [];
    let kpis: ReportSummaryKpi[] = [];
    let title = "Generated Report Sheet";

    // ----------------------------------------------------
    // WORKLOG SHEET
    // ----------------------------------------------------
    if (filters.reportType === "worklog") {
      title = filters.detailMode === "summary_employee" ? "Employee Worklog Summary Sheet" : "Detailed Worklog & Timesheet Register";

      const rawLogs = Array.isArray(rawWorklogsData) ? rawWorklogsData : rawWorklogsData?.results || [];

      // Filter in memory for users/departments/dates
      const filtered = rawLogs.filter((wl: any) => {
        const uId = String(wl.userId || wl.user?.id || "");
        if (!uId || !activeUsersMap.has(uId)) return false;

        const userInfo = activeUsersMap.get(uId);
        if (filters.departmentId !== "all" && userInfo?.departmentId !== filters.departmentId) return false;
        if (filters.userIds.length > 0 && !filters.userIds.includes(uId)) return false;

        if (filters.projectId !== "all") {
          const pId = String(wl.projectId || wl.project?.id || wl.task?.project?.id || "");
          if (pId !== filters.projectId) return false;
        }

        if (filters.status !== "all" && wl.status !== filters.status) return false;

        if (filters.startDate && filters.endDate) {
          const wlDate = dayjs(wl.startTime || wl.createdAt).format("YYYY-MM-DD");
          if (wlDate < filters.startDate || wlDate > filters.endDate) return false;
        }

        return true;
      });

      if (filters.detailMode === "summary_employee") {
        // Group by user
        const map: Record<string, any> = {};
        allActiveUsers.forEach((u) => {
          if (filters.departmentId !== "all" && u.departmentId !== filters.departmentId) return;
          if (filters.userIds.length > 0 && !filters.userIds.includes(u.id)) return;
          map[u.id] = {
            id: u.id,
            name: u.name,
            email: u.email,
            department: u.departmentName,
            totalWorks: 0,
            totalHours: 0,
            approvedHours: 0,
            pendingHours: 0,
            projects: new Set<string>(),
          };
        });

        filtered.forEach((wl: any) => {
          const uId = String(wl.userId || wl.user?.id || "");
          if (!map[uId]) return;

          let minutes = 0;
          if (wl.startTime && wl.endTime) {
            minutes = Math.max(0, dayjs(wl.endTime).diff(dayjs(wl.startTime), "minutes"));
          } else if (wl.duration) {
            minutes = Number(wl.duration) * 60;
          }
          const hrs = Number((minutes / 60).toFixed(2));

          map[uId].totalWorks += 1;
          map[uId].totalHours += hrs;
          if (wl.status === "approved") map[uId].approvedHours += hrs;
          else map[uId].pendingHours += hrs;

          const pName = wl.project?.name || wl.task?.project?.name;
          if (pName) map[uId].projects.add(pName);
        });

        rows = Object.values(map).map((item) => ({
          ...item,
          totalHours: Number(item.totalHours.toFixed(2)),
          approvedHours: Number(item.approvedHours.toFixed(2)),
          pendingHours: Number(item.pendingHours.toFixed(2)),
          projectsCount: item.projects.size,
        }));

        const totalHrs = rows.reduce((acc, r) => acc + r.totalHours, 0);
        const totalApp = rows.reduce((acc, r) => acc + r.approvedHours, 0);
        const totalSub = rows.reduce((acc, r) => acc + r.totalWorks, 0);

        kpis = [
          { label: "Active Employees", value: rows.length, prefix: <UserOutlined /> },
          { label: "Total Logged Time", value: totalHrs.toFixed(1), suffix: "hrs", color: "#1677ff" },
          { label: "Approved Time", value: totalApp.toFixed(1), suffix: "hrs", color: "#52c41a" },
          { label: "Total Submissions", value: totalSub, prefix: <ClockCircleOutlined /> },
        ];
      } else {
        // Detailed row-by-row
        let totalHrs = 0;
        let approvedHrs = 0;

        rows = filtered.map((wl: any, idx: number) => {
          const uId = String(wl.userId || wl.user?.id || "");
          const userInfo = activeUsersMap.get(uId);

          let minutes = 0;
          if (wl.startTime && wl.endTime) {
            minutes = Math.max(0, dayjs(wl.endTime).diff(dayjs(wl.startTime), "minutes"));
          } else if (wl.duration) {
            minutes = Number(wl.duration) * 60;
          }
          const loggedHours = Number((minutes / 60).toFixed(2));
          totalHrs += loggedHours;
          if (wl.status === "approved") approvedHrs += loggedHours;

          return {
            id: wl.id || `wl-${idx}`,
            date: wl.startTime ? dayjs(wl.startTime).format("YYYY-MM-DD") : "-",
            employeeName: wl.user?.name || userInfo?.name || "Employee",
            department: userInfo?.departmentName || "General",
            projectName: wl.project?.name || wl.task?.project?.name || "-",
            projectCode: wl.project?.code || wl.task?.project?.code || "-",
            taskName: wl.task?.name || wl.task?.title || "-",
            taskCode: wl.task?.code || "-",
            taskStatus: wl.task?.status || "-",
            description: wl.description || "-",
            startTime: wl.startTime ? dayjs(wl.startTime).format("hh:mm A") : "-",
            endTime: wl.endTime ? dayjs(wl.endTime).format("hh:mm A") : "-",
            loggedHours,
            status: wl.status || "requested",
            approvedBy: wl.approvedByUser?.name || "-",
            remarks: wl.remark || wl.rejectedRemark || "-",
          };
        });

        kpis = [
          { label: "Total Entries", value: rows.length, prefix: <ClockCircleOutlined /> },
          { label: "Total Hours Logged", value: totalHrs.toFixed(1), suffix: "hrs", color: "#1677ff" },
          { label: "Approved Hours", value: approvedHrs.toFixed(1), suffix: "hrs", color: "#52c41a" },
          {
            label: "Pending Verification",
            value: (totalHrs - approvedHrs).toFixed(1),
            suffix: "hrs",
            color: "#fa8c16",
          },
        ];
      }
    }

    // ----------------------------------------------------
    // ATTENDANCE SHEET
    // ----------------------------------------------------
    else if (filters.reportType === "attendance") {
      title =
        filters.detailMode === "summary_employee"
          ? "Employee Monthly Attendance Register"
          : "Daily Attendance Sheet & Time Card";

      const rawList = Array.isArray(rawAttendanceData) ? rawAttendanceData : [];

      const filtered = rawList.filter((att: any) => {
        const uId = String(att.userId || att.user?.id || "");
        if (filters.userIds.length > 0 && !filters.userIds.includes(uId)) return false;
        if (filters.departmentId !== "all") {
          const dept = att.user?.departmentName || activeUsersMap.get(uId)?.departmentName;
          const uDeptId = activeUsersMap.get(uId)?.departmentId;
          if (uDeptId !== filters.departmentId && dept !== filters.departmentId) return false;
        }
        return true;
      });

      if (filters.detailMode === "summary_employee") {
        const map: Record<string, any> = {};

        filtered.forEach((att: any) => {
          const uId = String(att.userId || att.user?.id || "");
          const uName = att.user?.name || activeUsersMap.get(uId)?.name || "Employee";
          const dept = att.user?.departmentName || activeUsersMap.get(uId)?.departmentName || "General";

          if (!map[uId]) {
            map[uId] = {
              id: uId,
              employeeName: uName,
              department: dept,
              presentDays: 0,
              totalMinutes: 0,
              overtimeDays: 0,
              totalWorklogMinutes: 0,
            };
          }

          if (att.clockIn) {
            map[uId].presentDays += 1;
            const inM = parseTime(att.clockIn, att.date);
            const outM = parseTime(att.clockOut, att.date);
            if (inM && outM && outM.isAfter(inM)) {
              const diffMin = outM.diff(inM, "minutes");
              map[uId].totalMinutes += diffMin;
              if (diffMin > 480) map[uId].overtimeDays += 1;
            }
          }

          const wlMin = (att.worklogs?.approved?.total || 0) + (att.worklogs?.requested?.total || 0);
          map[uId].totalWorklogMinutes += wlMin;
        });

        rows = Object.values(map).map((item) => ({
          ...item,
          totalClockedHours: Number((item.totalMinutes / 60).toFixed(1)),
          avgDailyHours: item.presentDays > 0 ? Number((item.totalMinutes / 60 / item.presentDays).toFixed(1)) : 0,
          totalWorklogHours: Number((item.totalWorklogMinutes / 60).toFixed(1)),
        }));

        const totalPres = rows.reduce((acc, r) => acc + r.presentDays, 0);
        const totalClock = rows.reduce((acc, r) => acc + r.totalClockedHours, 0);
        const totalOt = rows.reduce((acc, r) => acc + r.overtimeDays, 0);

        kpis = [
          { label: "Employees Count", value: rows.length, prefix: <UserOutlined /> },
          { label: "Total Attendance Days", value: totalPres, prefix: <CalendarOutlined /> },
          { label: "Total Clocked Hours", value: totalClock.toFixed(1), suffix: "hrs", color: "#52c41a" },
          { label: "Overtime Instances", value: totalOt, prefix: <ClockCircleOutlined />, color: "#fa8c16" },
        ];
      } else {
        let totalClockedMin = 0;
        let totalOtCount = 0;

        rows = filtered.map((att: any, idx: number) => {
          const uId = String(att.userId || att.user?.id || "");
          const userInfo = activeUsersMap.get(uId);

          let durationText = "-";
          let durationHoursDecimal = 0;
          let isOvertime = false;
          let attendanceStatus = "No Record";

          if (att.clockIn && att.clockOut) {
            const inM = parseTime(att.clockIn, att.date);
            const outM = parseTime(att.clockOut, att.date);
            if (inM && outM && outM.isAfter(inM)) {
              const diffMin = outM.diff(inM, "minutes");
              totalClockedMin += diffMin;
              durationHoursDecimal = Number((diffMin / 60).toFixed(2));
              const h = Math.floor(diffMin / 60);
              const m = diffMin % 60;
              durationText = `${h}h ${m}m`;
              if (diffMin > 480) {
                isOvertime = true;
                totalOtCount += 1;
              }
              attendanceStatus = "Completed";
            } else {
              durationText = "In Progress";
              attendanceStatus = "In Progress";
            }
          } else if (att.clockIn) {
            durationText = "In Progress";
            attendanceStatus = "In Progress";
          }

          const approvedWlMin = att.worklogs?.approved?.total || 0;
          const approvedWlHrs = Number((approvedWlMin / 60).toFixed(2));

          return {
            id: att.id || `att-${idx}`,
            date: att.date || "-",
            dayOfWeek: att.date ? dayjs(att.date).format("dddd") : "-",
            employeeName: att.user?.name || userInfo?.name || "Employee",
            department: att.user?.departmentName || userInfo?.departmentName || "General",
            role: att.user?.roleName || userInfo?.roleName || "Member",
            clockIn: att.clockIn ? formatTime12Hour(att.clockIn) : "-",
            clockInRemark: att.clockInRemark || "-",
            clockOut: att.clockOut ? formatTime12Hour(att.clockOut) : "-",
            clockOutRemark: att.clockOutRemark || "-",
            duration: durationText,
            durationHoursDecimal,
            attendanceStatus,
            isOvertime,
            approvedWorklogHours: `${approvedWlHrs} hrs`,
          };
        });

        kpis = [
          { label: "Attendance Records", value: rows.length, prefix: <CalendarOutlined /> },
          {
            label: "Total Clocked Hours",
            value: (totalClockedMin / 60).toFixed(1),
            suffix: "hrs",
            color: "#52c41a",
          },
          { label: "Overtime Instances", value: totalOtCount, color: "#fa8c16" },
          {
            label: "Avg Clocked per Day",
            value: rows.length > 0 ? (totalClockedMin / 60 / rows.length).toFixed(1) : 0,
            suffix: "hrs",
          },
        ];
      }
    }

    // ----------------------------------------------------
    // RECONCILIATION SHEET (DISCREPANCY)
    // ----------------------------------------------------
    else if (filters.reportType === "reconciliation") {
      title = "Attendance vs Worklog Hours Reconciliation Audit";

      const rawAtt = Array.isArray(rawAttendanceData) ? rawAttendanceData : [];
      let totalDiscrepancies = 0;
      let totalClockedHrs = 0;
      let totalLoggedHrs = 0;

      rows = rawAtt.map((att: any, idx: number) => {
        const uId = String(att.userId || att.user?.id || "");
        const userInfo = activeUsersMap.get(uId);

        let attHrs = 0;
        if (att.clockIn && att.clockOut) {
          const inM = parseTime(att.clockIn, att.date);
          const outM = parseTime(att.clockOut, att.date);
          if (inM && outM && outM.isAfter(inM)) {
            attHrs = Number((outM.diff(inM, "minutes") / 60).toFixed(2));
          }
        }

        const wlMin =
          (att.worklogs?.approved?.total || 0) + (att.worklogs?.requested?.total || 0);
        const wlHrs = Number((wlMin / 60).toFixed(2));
        const variance = Number((attHrs - wlHrs).toFixed(2));

        totalClockedHrs += attHrs;
        totalLoggedHrs += wlHrs;

        let auditFlag = "Matched";
        if (attHrs > 0 && wlHrs === 0) {
          auditFlag = "Worklog Missing";
          totalDiscrepancies += 1;
        } else if (variance > 0.5) {
          auditFlag = "Underlogged";
          totalDiscrepancies += 1;
        } else if (variance < -0.5) {
          auditFlag = "Overlogged";
          totalDiscrepancies += 1;
        }

        const projectNames = att.worklogs?.projectNames?.join(", ") || "-";

        return {
          id: `recon-${idx}`,
          date: att.date || "-",
          employeeName: att.user?.name || userInfo?.name || "Employee",
          department: att.user?.departmentName || userInfo?.departmentName || "General",
          clockIn: att.clockIn ? formatTime12Hour(att.clockIn) : "-",
          clockOut: att.clockOut ? formatTime12Hour(att.clockOut) : "-",
          attendanceHours: attHrs,
          worklogHours: wlHrs,
          variance,
          auditFlag,
          projects: projectNames,
        };
      });

      kpis = [
        { label: "Total Audited Records", value: rows.length, prefix: <CalendarOutlined /> },
        { label: "Clocked Attendance", value: totalClockedHrs.toFixed(1), suffix: "hrs", color: "#52c41a" },
        { label: "Logged Worklogs", value: totalLoggedHrs.toFixed(1), suffix: "hrs", color: "#1677ff" },
        {
          label: "Discrepancy Instances",
          value: totalDiscrepancies,
          color: totalDiscrepancies > 0 ? "#ff4d4f" : "#52c41a",
          prefix: <ExclamationCircleOutlined />,
        },
      ];
    }

    // ----------------------------------------------------
    // PROJECT COST & VARIANCE SHEET
    // ----------------------------------------------------
    else if (filters.reportType === "project") {
      title = "Project Progress & Financial Cost Analysis Report";

      const projects = rawManagerData?.projects || projectsList || [];
      const billings = rawManagerData?.billings || [];

      rows = projects.map((p: any, idx: number) => {
        const pBillings = billings.filter((b: any) => String(b.projectId) === String(p.id));
        const totalBilled = pBillings.reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);
        const budget = Number(p.budget || 0);
        const costVariance = totalBilled - budget;

        return {
          id: p.id || `proj-${idx}`,
          code: p.code || "-",
          name: p.name || "Project",
          manager: p.manager?.name || p.projectManager?.name || "Unassigned",
          client: p.client?.name || "-",
          status: p.status || "active",
          completionPercent: p.progress || p.completionPercent || 0,
          budget,
          completionCost: totalBilled,
          costVariance,
          estimatedHours: p.estimatedHours || 0,
          actualLoggedHours: p.actualLoggedHours || 0,
        };
      });

      const totalBudget = rows.reduce((acc, r) => acc + r.budget, 0);
      const totalCost = rows.reduce((acc, r) => acc + r.completionCost, 0);

      kpis = [
        { label: "Total Projects", value: rows.length, prefix: <UserOutlined /> },
        { label: "Allocated Budget", value: `NPR ${(totalBudget / 1000).toFixed(0)}k`, color: "#1677ff" },
        { label: "Incurred Cost", value: `NPR ${(totalCost / 1000).toFixed(0)}k`, color: "#fa8c16" },
        {
          label: "Net Variance",
          value: `NPR ${((totalCost - totalBudget) / 1000).toFixed(0)}k`,
          color: totalCost > totalBudget ? "#ff4d4f" : "#52c41a",
        },
      ];
    }

    // ----------------------------------------------------
    // LEAVE & ABSENCE SHEET
    // ----------------------------------------------------
    else if (filters.reportType === "leave") {
      title = "Employee Leave & Absence Statement Register";

      const leaves = Array.isArray(rawLeavesData) ? rawLeavesData : (rawLeavesData as any)?.results || [];

      rows = leaves.map((lv: any, idx: number) => {
        const uId = String(lv.userId || lv.user?.id || "");
        const userInfo = activeUsersMap.get(uId);

        return {
          id: lv.id || `leave-${idx}`,
          employeeName: lv.user?.name || userInfo?.name || "Employee",
          department: userInfo?.departmentName || "General",
          leaveType: lv.leaveType?.name || lv.type || "Annual Leave",
          startDate: lv.startDate ? dayjs(lv.startDate).format("YYYY-MM-DD") : "-",
          endDate: lv.endDate ? dayjs(lv.endDate).format("YYYY-MM-DD") : "-",
          days: lv.totalDays || lv.days || 1,
          status: lv.status || "pending",
          approver: lv.approvedByUser?.name || lv.approver?.name || "-",
          reason: lv.reason || lv.notes || "-",
        };
      });

      const totalDays = rows.reduce((acc, r) => acc + Number(r.days || 0), 0);
      const approvedCount = rows.filter((r) => r.status.toLowerCase() === "approved").length;
      const pendingCount = rows.filter((r) => r.status.toLowerCase() === "pending").length;

      kpis = [
        { label: "Total Leave Requests", value: rows.length, prefix: <CalendarOutlined /> },
        { label: "Total Leave Days", value: totalDays, suffix: "days", color: "#1677ff" },
        { label: "Approved Requests", value: approvedCount, color: "#52c41a" },
        { label: "Pending Approvals", value: pendingCount, color: "#fa8c16" },
      ];
    }

    return { reportRows: rows, reportKpis: kpis, reportTitle: title };
  }, [
    filters,
    rawWorklogsData,
    rawAttendanceData,
    rawManagerData,
    rawLeavesData,
    activeUsersMap,
    allActiveUsers,
    projectsList,
  ]);

  // Handle Filter Update
  const handleFilterChange = <K extends keyof ReportFilterState>(key: K, value: ReportFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
    message.info("Filters reset to default");
  };

  const handleGenerateReport = () => {
    setGenerationTrigger((prev) => prev + 1);
    if (filters.reportType === "worklog") refetchWorklogs();
    if (filters.reportType === "attendance") refetchAttendance();
    if (filters.reportType === "reconciliation") {
      refetchWorklogs();
      refetchAttendance();
    }
    if (filters.reportType === "project") refetchManager();
    if (filters.reportType === "leave") refetchLeaves();
    message.success(`Generated ${reportTitle}`);
  };

  const isCurrentLoading =
    isLoadingWorklogs || isLoadingAttendance || isLoadingManager || isLoadingLeaves;

  const metadata = useMemo(() => {
    const periodText =
      filters.startDate && filters.endDate
        ? `${filters.startDate} to ${filters.endDate}`
        : "All Available Dates";
    const deptObj = departmentsList.find((d: any) => d.id === filters.departmentId);
    const filterText = [
      deptObj ? `Dept: ${deptObj.name}` : null,
      filters.status !== "all" ? `Status: ${filters.status.toUpperCase()}` : null,
      filters.userIds.length > 0 ? `${filters.userIds.length} Employees Selected` : null,
      filters.projectId !== "all" ? "Filtered Project" : null,
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      reportTitle,
      dateRangeText: periodText,
      filterSummaryText: filterText || undefined,
      generatedBy: profile?.name || profile?.username || "Authorized Administrator",
    };
  }, [reportTitle, filters, departmentsList, profile]);

  return (
    <div>
      {onBack && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              className="flex items-center justify-center font-medium"
            >
              Back to Reports
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">
                {reportTitle}
              </h1>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                {REPORT_DESCRIPTIONS[filters.reportType] || "Detailed itemized report register and data export"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Generation Control Panel */}
      <ReportFilterControls
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onGenerateReport={handleGenerateReport}
        isLoading={isCurrentLoading}
        departments={departmentsList}
        users={allActiveUsers}
        projects={projectsList}
        allColumns={currentAvailableColumns}
        recordCount={reportRows.length}
        hideReportTypePicker={hideReportTypePicker}
      />

      {/* Generated Report Data Table */}
      <ReportTableView
        reportTitle={reportTitle}
        metadata={metadata}
        columns={currentAvailableColumns}
        selectedColumnKeys={filters.selectedColumns}
        data={reportRows}
        kpis={reportKpis}
        isLoading={isCurrentLoading}
        onOpenPrintPreview={() => setIsPrintModalOpen(true)}
      />

      {/* Printable Sheet Modal */}
      <ReportPrintView
        open={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        metadata={metadata}
        columns={currentAvailableColumns}
        selectedColumnKeys={filters.selectedColumns}
        data={reportRows}
      />
    </div>
  );
};

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  DatePicker,
  Button,
  Table,
  Tabs,
  Tag,
  Progress,
  Avatar,
  Space,
  Badge,
  Divider,
  Statistic,
  Alert,
  Input,
} from "antd";
import { ReportGeneratorStudio } from "./components/ReportGeneratorStudio";
import { FormattedWorklogDescription } from "./components/FormattedWorklogDescription";
import { ActiveReportKey } from "./types/reportTypes";
import { stripHtml } from "@/utils/formatUtils";
import {
  BarChartOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ProjectOutlined,
  TeamOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  RiseOutlined,
  PieChartOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  CalendarOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  fetchWorklogReportData,
  fetchManagerReportData,
} from "@/service/report.service";
import { listActiveUsers } from "@/service/user.service";
import { useIsMobile } from "@/hooks/useIsMobile";
import ResponsiveTable from "@/components/ui/MobileCardList";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// System Color Palette
const CHART_COLORS = [
  "#1677ff",
  "#52c41a",
  "#fa8c16",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#faad14",
  "#2f54eb",
];

interface ReportCatalogItem {
  key: ActiveReportKey;
  title: string;
  description: string;
  category: "Timesheet & Worklogs" | "Attendance & Leave" | "Projects & Financials" | "Analytics & Dashboards";
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  tag: string;
  tagColor: string;
  badge?: string;
}

const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    key: "worklog",
    title: "Worklog Sheet",
    description: "Detailed employee timesheets, completed tasks, logged hours, billable time, and work descriptions.",
    category: "Timesheet & Worklogs",
    icon: <ClockCircleOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
    iconBg: "bg-blue-50 border border-blue-100",
    iconColor: "#1677ff",
    tag: "Timesheets",
    tagColor: "blue",
  },
  {
    key: "reconciliation",
    title: "Discrepancy Audit",
    description: "Side-by-side reconciliation audit comparing office attendance hours against logged worklog hours.",
    category: "Timesheet & Worklogs",
    icon: <AuditOutlined style={{ fontSize: 20, color: "#fa8c16" }} />,
    iconBg: "bg-amber-50 border border-amber-100",
    iconColor: "#fa8c16",
    tag: "Audit & Variance",
    tagColor: "warning",
  },
  {
    key: "attendance",
    title: "Attendance Sheet",
    description: "Office entry and exit registers, check-in and check-out timestamps, working durations, and attendance remarks.",
    category: "Attendance & Leave",
    icon: <CalendarOutlined style={{ fontSize: 20, color: "#52c41a" }} />,
    iconBg: "bg-emerald-50 border border-emerald-100",
    iconColor: "#52c41a",
    tag: "Attendance",
    tagColor: "success",
  },
  {
    key: "leave",
    title: "Leave & Absence Sheet",
    description: "Comprehensive employee leave register, leave types (sick, casual, annual), approval states, and absence history.",
    category: "Attendance & Leave",
    icon: <SafetyCertificateOutlined style={{ fontSize: 20, color: "#eb2f96" }} />,
    iconBg: "bg-pink-50 border border-pink-100",
    iconColor: "#eb2f96",
    tag: "Absence Log",
    tagColor: "magenta",
  },
  {
    key: "project",
    title: "Project Progress & Cost",
    description: "Project budget tracking, estimated vs actual hours, team allocation, progress metrics, and cost variance.",
    category: "Projects & Financials",
    icon: <ProjectOutlined style={{ fontSize: 20, color: "#722ed1" }} />,
    iconBg: "bg-purple-50 border border-purple-100",
    iconColor: "#722ed1",
    tag: "Delivery & Budget",
    tagColor: "purple",
  },
  {
    key: "analytics",
    title: "Visual Analytics Dashboard",
    description: "Interactive visual charts, team workload distribution, productivity trends, delivery rates, and high-level KPI metrics.",
    category: "Analytics & Dashboards",
    icon: <BarChartOutlined style={{ fontSize: 20, color: "#13c2c2" }} />,
    iconBg: "bg-cyan-50 border border-cyan-100",
    iconColor: "#13c2c2",
    tag: "Interactive Charts",
    tagColor: "cyan",
    badge: "Live Metrics",
  },
];

const ReportsPage: React.FC = () => {
  const { isMobile } = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportParam = searchParams.get("report") as ActiveReportKey | null;
  const [selectedReport, setSelectedReport] = useState<ActiveReportKey | null>(reportParam);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedReport(reportParam);
  }, [reportParam]);

  const handleSelectReport = (key: ActiveReportKey | null) => {
    setSelectedReport(key);
    if (key) {
      setSearchParams({ report: key });
    } else {
      setSearchParams({});
    }
  };

  const groupedReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = REPORT_CATALOG.filter((item) => {
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query)
      );
    });

    const groups: { category: ReportCatalogItem["category"]; items: ReportCatalogItem[] }[] = [];
    const categoryOrder: ReportCatalogItem["category"][] = [
      "Timesheet & Worklogs",
      "Attendance & Leave",
      "Projects & Financials",
      "Analytics & Dashboards",
    ];

    categoryOrder.forEach((cat) => {
      const items = filtered.filter((i) => i.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    });

    return groups;
  }, [searchQuery]);

  const [activeTab, setActiveTab] = useState("worklog");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  // Fetch full active users list for the filter dropdown
  const { data: activeUsersData } = useQuery({
    queryKey: ["report-filter-active-users"],
    queryFn: () => listActiveUsers().catch(() => []),
  });

  // Fetch Worklog Report Data (Real Backend Worklogs, Projects & Users)
  const { data: worklogData } = useQuery({
    queryKey: ["report-worklogs", selectedProjectId, selectedUserId],
    queryFn: () =>
      fetchWorklogReportData({
        projectId: selectedProjectId !== "all" ? selectedProjectId : undefined,
        userId: selectedUserId !== "all" ? selectedUserId : undefined,
      }),
  });

  // Fetch Manager Report Data (Real Backend Projects, Billings & Working Time Stats)
  const { data: managerData } = useQuery({
    queryKey: ["report-manager"],
    queryFn: () => fetchManagerReportData(),
  });

  // -------------------------------------------------------------
  // Worklog Analytics Calculations (100% Real API Data)
  // -------------------------------------------------------------
  const worklogAnalytics = useMemo(() => {
    const rawWorklogs = worklogData?.worklogs || [];
    const projects = worklogData?.projects || [];
    const users = worklogData?.users || [];

    // Strictly filter for only ACTIVE users
    const activeApiUsers = (
      Array.isArray(activeUsersData) && activeUsersData.length > 0
        ? activeUsersData
        : users
    ).filter((u: any) => !u.status || u.status.toLowerCase() === "active");

    const activeUsersMap = new Map<
      string,
      { id: string; name: string; email?: string }
    >();

    activeApiUsers.forEach((u: any) => {
      if (u?.id) {
        activeUsersMap.set(String(u.id), {
          id: String(u.id),
          name: u.name || u.username || u.email || "Employee",
          email: u.email || "",
        });
      }
    });

    const activeUsersList = Array.from(activeUsersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // Apply date range filter if selected
    let filteredWorklogs = rawWorklogs;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      filteredWorklogs = rawWorklogs.filter((wl: any) => {
        const wlDate = dayjs(wl.startTime || wl.createdAt);
        return (
          (wlDate.isAfter(start) || wlDate.isSame(start)) &&
          (wlDate.isBefore(end) || wlDate.isSame(end))
        );
      });
    }

    let totalMinutes = 0;
    let approvedMinutes = 0;
    let pendingMinutes = 0;

    // Initialize userMap with ALL active users so every active employee is listed in breakdown & summary
    const userMap: Record<
      string,
      {
        name: string;
        email: string;
        totalWorks: number;
        totalMinutes: number;
        approvedMinutes: number;
        projects: Set<string>;
      }
    > = {};

    activeUsersList.forEach((u) => {
      userMap[u.id] = {
        name: u.name,
        email: u.email || "",
        totalWorks: 0,
        totalMinutes: 0,
        approvedMinutes: 0,
        projects: new Set(),
      };
    });

    const projectMap: Record<
      string,
      { name: string; totalWorks: number; totalMinutes: number }
    > = {};
    const detailedWorklogs: any[] = [];

    filteredWorklogs.forEach((wl: any) => {
      const uId = String(wl.userId || wl.user?.id || "");
      // Strictly process only active users
      if (!uId || !activeUsersMap.has(uId)) {
        return;
      }

      const pId = String(
        wl.projectId ||
          wl.project?.id ||
          wl.task?.project?.id ||
          wl.task?.projectId ||
          "unknown",
      );
      if (
        selectedProjectId !== "all" &&
        pId !== selectedProjectId &&
        wl.projectId !== selectedProjectId &&
        wl.project?.id !== selectedProjectId &&
        wl.task?.project?.id !== selectedProjectId
      ) {
        return;
      }

      if (selectedUserId !== "all" && uId !== selectedUserId) {
        return;
      }

      let minutes = 0;
      if (wl.startTime && wl.endTime) {
        const start = dayjs(wl.startTime);
        const end = dayjs(wl.endTime);
        minutes = Math.max(0, end.diff(start, "minutes"));
      } else if (wl.duration) {
        minutes = Number(wl.duration) * 60;
      }

      totalMinutes += minutes;
      if (wl.status === "approved") approvedMinutes += minutes;
      else pendingMinutes += minutes;

      const uName =
        wl.user?.name || activeUsersMap.get(uId)?.name || "Unknown User";
      const uEmail = wl.user?.email || activeUsersMap.get(uId)?.email || "";

      if (!userMap[uId]) {
        userMap[uId] = {
          name: uName,
          email: uEmail,
          totalWorks: 0,
          totalMinutes: 0,
          approvedMinutes: 0,
          projects: new Set(),
        };
      }
      userMap[uId].totalWorks += 1;
      userMap[uId].totalMinutes += minutes;
      if (wl.status === "approved") userMap[uId].approvedMinutes += minutes;
      if (wl.projectId || wl.project?.name || wl.task?.project?.name) {
        userMap[uId].projects.add(
          wl.project?.name || wl.task?.project?.name || wl.projectId,
        );
      }

      const pName =
        wl.project?.name || wl.task?.project?.name || "General Task";
      if (!projectMap[pId]) {
        projectMap[pId] = { name: pName, totalWorks: 0, totalMinutes: 0 };
      }
      projectMap[pId].totalWorks += 1;
      projectMap[pId].totalMinutes += minutes;

      // Map detailed work item with project, task, dates, and descriptions
      const projectName =
        wl.project?.name || wl.task?.project?.name || "General Project";
      const projectCode = wl.project?.code || wl.task?.project?.code || "-";
      const taskName = wl.task?.name || wl.task?.title || "-";
      const taskCode = wl.task?.code || "-";
      const taskStatus = wl.task?.status
        ? String(wl.task.status).toUpperCase()
        : "-";
      const workDate = wl.startTime
        ? dayjs(wl.startTime).format("YYYY-MM-DD")
        : wl.createdAt
          ? dayjs(wl.createdAt).format("YYYY-MM-DD")
          : "-";
      const startTime = wl.startTime
        ? dayjs(wl.startTime).format("hh:mm A")
        : "-";
      const endTime = wl.endTime ? dayjs(wl.endTime).format("hh:mm A") : "-";
      const loggedHours = Number((minutes / 60).toFixed(2));
      const status = wl.status ? String(wl.status).toUpperCase() : "OPEN";
      const description = wl.description || "-";
      const approvedBy = wl.approvedByUser?.name || "-";
      const remarks = wl.remark || wl.rejectedRemark || "-";

      detailedWorklogs.push({
        id: wl.id,
        date: workDate,
        employeeId: uId,
        employeeName: uName,
        employeeEmail: uEmail,
        projectId: pId,
        projectName,
        projectCode,
        taskId: wl.taskId || wl.task?.id || "-",
        taskName,
        taskCode,
        taskStatus,
        description,
        startTime,
        endTime,
        loggedHours,
        status,
        approvedBy,
        remarks,
      });
    });

    const userTableData = Object.entries(userMap)
      .filter(([id]) => {
        if (!activeUsersMap.has(id)) return false;
        if (selectedUserId !== "all" && id !== selectedUserId) return false;
        return true;
      })
      .map(([id, val]) => ({
        id,
        name: val.name,
        email: val.email,
        totalWorks: val.totalWorks,
        totalHours: (val.totalMinutes / 60).toFixed(1),
        approvedHours: (val.approvedMinutes / 60).toFixed(1),
        projectsCount: val.projects.size,
      }))
      .sort(
        (a, b) =>
          Number(b.totalHours) - Number(a.totalHours) ||
          a.name.localeCompare(b.name),
      );

    const projectChartData = Object.values(projectMap).map((val) => ({
      name: val.name.length > 18 ? `${val.name.slice(0, 18)}...` : val.name,
      hours: Number((val.totalMinutes / 60).toFixed(1)),
      works: val.totalWorks,
    }));

    const userPieData = userTableData
      .filter((u) => Number(u.totalHours) > 0)
      .map((u) => ({
        name: u.name,
        value: Number(u.totalHours),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      totalWorklogs: detailedWorklogs.length,
      totalHours: (totalMinutes / 60).toFixed(1),
      approvedHours: (approvedMinutes / 60).toFixed(1),
      pendingHours: (pendingMinutes / 60).toFixed(1),
      userTableData,
      projectChartData,
      userPieData,
      projectsList: projects,
      usersList: activeUsersList,
      detailedWorklogs,
    };
  }, [
    worklogData,
    activeUsersData,
    dateRange,
    selectedProjectId,
    selectedUserId,
  ]);

  // -------------------------------------------------------------
  // Manager Report Calculations (100% Real API Data)
  // -------------------------------------------------------------
  const managerAnalytics = useMemo(() => {
    const rawProjects = managerData?.projects || [];
    const rawBillings = managerData?.billings || [];
    const rawWorklogs = worklogData?.worklogs || [];

    let totalBudget = 0;
    let totalCompletionCost = 0;
    let completedCount = 0;

    const projectReports = rawProjects.map((proj: any) => {
      // 1. REAL Actual Logged Hours from Database Worklogs
      const projWorklogs = rawWorklogs.filter(
        (wl: any) => wl.projectId === proj.id || wl.project?.id === proj.id,
      );
      let realProjectMinutes = 0;
      projWorklogs.forEach((wl: any) => {
        if (wl.startTime && wl.endTime) {
          const start = dayjs(wl.startTime);
          const end = dayjs(wl.endTime);
          realProjectMinutes += Math.max(0, end.diff(start, "minutes"));
        } else if (wl.duration) {
          realProjectMinutes += Number(wl.duration) * 60;
        }
      });
      const actualLoggedHours = Number((realProjectMinutes / 60).toFixed(1));

      // 2. REAL Estimated Hours from project starting and ending dates or fields
      let estimatedHours = proj.estimatedHours || proj.estimatedTime || 0;
      if (!estimatedHours && proj.startingDate && proj.endingDate) {
        const days = Math.max(
          1,
          dayjs(proj.endingDate).diff(dayjs(proj.startingDate), "day"),
        );
        estimatedHours = Math.round(days * 8);
      }
      if (!estimatedHours) estimatedHours = 80;

      // 3. REAL Financials: Budget & Billing / Completion Cost
      const budget =
        proj.budget || proj.estimatedCost || proj.cost || estimatedHours * 500;

      const projBillings = rawBillings.filter(
        (b: any) => b.projectId === proj.id || b.project?.id === proj.id,
      );
      const billingTotal = projBillings.reduce(
        (sum: number, b: any) => sum + Number(b.amount || b.totalAmount || 0),
        0,
      );
      const completionCost =
        billingTotal > 0 ? billingTotal : actualLoggedHours * 500;

      totalBudget += budget;
      totalCompletionCost += completionCost;

      // 4. REAL Progress % calculation from tasks or status
      let completionPercent = proj.progress || 0;
      if (!completionPercent) {
        if (proj.status === "completed" || proj.status === "signed_off")
          completionPercent = 100;
        else if (proj.tasks && proj.tasks.length > 0) {
          const doneTasks = proj.tasks.filter(
            (t: any) => t.status === "completed" || t.status === "done",
          ).length;
          completionPercent = Math.round((doneTasks / proj.tasks.length) * 100);
        } else if (estimatedHours > 0) {
          completionPercent = Math.min(
            100,
            Math.round((actualLoggedHours / estimatedHours) * 100),
          );
        }
      }

      if (
        completionPercent >= 100 ||
        proj.status === "completed" ||
        proj.status === "signed_off"
      ) {
        completedCount++;
      }

      const costVariance = completionCost - budget;
      const timeVariance = actualLoggedHours - estimatedHours;

      return {
        id: proj.id,
        name: proj.name,
        code: proj.code || `PRJ-${String(proj.id).slice(0, 5)}`,
        status: proj.status || "active",
        manager:
          proj.projectManager?.name ||
          proj.projectLead?.name ||
          proj.manager?.name ||
          "N/A",
        completionPercent,
        estimatedHours,
        actualLoggedHours,
        budget,
        completionCost,
        costVariance,
        timeVariance,
      };
    });

    const costChartData = projectReports
      .map((p: any) => ({
        name: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
        Budget: p.budget,
        CompletionCost: p.completionCost,
      }))
      .slice(0, 8);

    const timeChartData = projectReports
      .map((p: any) => ({
        name: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
        Estimated: p.estimatedHours,
        ActualSpent: p.actualLoggedHours,
      }))
      .slice(0, 8);

    return {
      totalProjects: rawProjects.length,
      completedCount,
      totalBudget: totalBudget.toLocaleString("en-IN"),
      totalCompletionCost: totalCompletionCost.toLocaleString("en-IN"),
      projectReports,
      costChartData,
      timeChartData,
    };
  }, [managerData, worklogData]);

  // Helper to create sheet with formatted auto column widths
  const createSheetWithColWidths = (
    data: any[],
    fallbackHeaders?: string[],
  ) => {
    let ws: XLSX.WorkSheet;
    if (!data || data.length === 0) {
      ws = XLSX.utils.json_to_sheet(
        fallbackHeaders
          ? [fallbackHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {})]
          : [],
      );
    } else {
      ws = XLSX.utils.json_to_sheet(data);
      const colWidths = Object.keys(data[0]).map((key) => {
        const maxContentLength = data.reduce(
          (max, row) => Math.max(max, String(row[key] ?? "").length),
          key.length,
        );
        return { wch: Math.min(Math.max(maxContentLength + 4, 12), 60) };
      });
      ws["!cols"] = colWidths;
    }
    return ws;
  };

  // Excel Exporter
  const handleExportExcel = () => {
    if (activeTab === "worklog") {
      const fileName = `Worklog_Report_${dayjs().format("YYYYMMDD")}.xlsx`;

      // 1. Detailed Works Log sheet: every work entry mapped with Project and Task details
      const detailedSheetData = worklogAnalytics.detailedWorklogs.map(
        (item, idx) => ({
          "S.N.": idx + 1,
          "Work Date": item.date,
          "Employee Name": item.employeeName,
          "Email Address": item.employeeEmail,
          "Project Name": item.projectName,
          "Project Code": item.projectCode,
          "Task Name": item.taskName,
          "Task Code": item.taskCode,
          "Task Status": item.taskStatus,
          "Work Description": stripHtml(item.description),
          "Start Time": item.startTime,
          "End Time": item.endTime,
          "Logged Hours (hrs)": item.loggedHours,
          "Worklog Status": item.status,
          "Approved / Verified By": item.approvedBy,
          Remarks: item.remarks,
        }),
      );

      // 2. Employee Summary sheet
      const summarySheetData = worklogAnalytics.userTableData.map((u, idx) => ({
        "S.N.": idx + 1,
        "Employee Name": u.name,
        "Email Address": u.email,
        "Submissions Count": u.totalWorks,
        "Total Logged Hours (hrs)": Number(u.totalHours),
        "Approved Hours (hrs)": Number(u.approvedHours),
        "Assigned Projects Count": u.projectsCount,
      }));

      const workbook = XLSX.utils.book_new();
      const detailedWorksheet = createSheetWithColWidths(detailedSheetData, [
        "S.N.",
        "Work Date",
        "Employee Name",
        "Email Address",
        "Project Name",
        "Project Code",
        "Task Name",
        "Task Code",
        "Task Status",
        "Work Description",
        "Start Time",
        "End Time",
        "Logged Hours (hrs)",
        "Worklog Status",
        "Approved / Verified By",
        "Remarks",
      ]);
      const summaryWorksheet = createSheetWithColWidths(summarySheetData, [
        "S.N.",
        "Employee Name",
        "Email Address",
        "Submissions Count",
        "Total Logged Hours (hrs)",
        "Approved Hours (hrs)",
        "Assigned Projects Count",
      ]);

      XLSX.utils.book_append_sheet(
        workbook,
        detailedWorksheet,
        "Detailed Works Log",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        summaryWorksheet,
        "Employee Summary",
      );
      XLSX.writeFile(workbook, fileName);
      return;
    }

    if (activeTab === "manager") {
      const fileName = `Manager_Project_Cost_Report_${dayjs().format("YYYYMMDD")}.xlsx`;
      const sheetData = managerAnalytics.projectReports.map((p, idx) => ({
        "S.N.": idx + 1,
        "Project Name": p.name,
        "Project Code": p.code,
        "Project Manager": p.manager,
        Status: p.status.toUpperCase(),
        "Completion Progress (%)": `${p.completionPercent}%`,
        "Estimated Budget (NPR)": `NPR ${p.budget.toLocaleString("en-IN")}`,
        "Completion Cost (NPR)": `NPR ${p.completionCost.toLocaleString("en-IN")}`,
        "Cost Variance (NPR)":
          p.costVariance > 0
            ? `+NPR ${p.costVariance.toLocaleString("en-IN")} (Over)`
            : `-NPR ${Math.abs(p.costVariance).toLocaleString("en-IN")} (Saved)`,
        "Estimated Time (hrs)": p.estimatedHours,
        "Actual Time Spent (hrs)": p.actualLoggedHours,
        "Time Variance":
          p.timeVariance > 0
            ? `+${p.timeVariance}h Overtime`
            : `${p.timeVariance}h On Schedule`,
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = createSheetWithColWidths(sheetData);
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Project Cost & Variance",
      );
      XLSX.writeFile(workbook, fileName);
      return;
    }

    // Attendance Discrepancy report
    const fileName = `Attendance_Discrepancy_Report_${dayjs().format("YYYYMMDD")}.xlsx`;
    const sheetData = (managerData?.workingTimeStats?.userStats || []).map(
      (u: any, idx: number) => ({
        "S.N.": idx + 1,
        "Employee Name": u.name,
        Role: u.roleName,
        "Expected Daily Hours": `${u.expectedDailyHours || 8} hrs`,
        "Total Worklog Hours": `${(u.totalWorklogMinutes / 60).toFixed(1)} hrs`,
        "Total Attendance Hours": `${(u.totalAttendanceMinutes / 60).toFixed(1)} hrs`,
        "Overtime Days": u.overtimeDays,
        "Worklog Exceeds Attendance Days": u.worklogExceedsAttendanceDays,
      }),
    );

    const workbook = XLSX.utils.book_new();
    const worksheet = createSheetWithColWidths(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Discrepancy");
    XLSX.writeFile(workbook, fileName);
  };

  const renderUserWorklogCard = (record: any) => (
    <div key={record.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
      <div className="flex items-center gap-3 mb-2 border-b border-gray-50 pb-2">
        <Avatar style={{ backgroundColor: "#1677ff" }}>
          {record.name.charAt(0)}
        </Avatar>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{record.name}</h4>
          <p className="text-xs text-gray-500 truncate">{record.email}</p>
        </div>
        <Tag color="blue">{record.totalWorks} entries</Tag>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div>
          <span className="text-[11px] text-gray-400 block">Total</span>
          <span className="text-sm font-semibold text-blue-600">{record.totalHours} hrs</span>
        </div>
        <div>
          <span className="text-[11px] text-gray-400 block">Approved</span>
          <span className="text-sm font-semibold text-green-600">{record.approvedHours} hrs</span>
        </div>
        <div>
          <span className="text-[11px] text-gray-400 block">Projects</span>
          <span className="text-sm font-semibold text-purple-600">{record.projectsCount}</span>
        </div>
      </div>
    </div>
  );

  const renderDetailedWorklogCard = (record: any) => {
    let statusColor = "default";
    if (record.status === "APPROVED") statusColor = "success";
    else if (record.status === "REJECTED") statusColor = "error";
    else if (record.status === "PENDING" || record.status === "REQUESTED") statusColor = "warning";

    return (
      <div key={record.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">{record.employeeName}</span>
              <span className="text-xs text-gray-400">• {record.date}</span>
            </div>
            <span className="text-xs text-gray-600 block mt-0.5">{record.projectName}</span>
          </div>
          <Tag color={statusColor} className="mr-0 shrink-0">{record.status}</Tag>
        </div>

        {record.taskName && record.taskName !== "-" && (
          <div className="mb-2 text-xs bg-gray-50 p-2 rounded flex flex-col gap-1">
            <div className="font-medium text-gray-700 truncate">Task: {record.taskName}</div>
            <div className="flex items-center gap-1 flex-wrap">
              {record.taskCode && record.taskCode !== "-" && (
                <Tag color="cyan" className="text-[10px] m-0">{record.taskCode}</Tag>
              )}
              {record.taskStatus && record.taskStatus !== "-" && (
                <Tag color="blue" className="text-[10px] m-0">{record.taskStatus}</Tag>
              )}
            </div>
          </div>
        )}

        {record.description && record.description !== "-" && (
          <div className="mb-2">
            <FormattedWorklogDescription content={record.description} />
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-xs">
          <span className="text-gray-500">{record.startTime} - {record.endTime}</span>
          <span className="font-bold text-blue-600">{record.loggedHours} hrs</span>
        </div>
        {record.approvedBy && record.approvedBy !== "-" && (
          <div className="text-[11px] text-gray-400 mt-1">
            Approved by: {record.approvedBy}
          </div>
        )}
      </div>
    );
  };

  const renderProjectMatrixCard = (record: any) => (
    <div key={record.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1 pr-2">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{record.name}</h4>
          <span className="text-xs text-gray-500 block truncate">{record.code} • Manager: {record.manager}</span>
        </div>
        {record.costVariance > 0 ? (
          <Tag color="red" className="mr-0 text-xs shrink-0">+NPR {record.costVariance.toLocaleString("en-IN")} Over</Tag>
        ) : (
          <Tag color="green" className="mr-0 text-xs shrink-0">-NPR {Math.abs(record.costVariance).toLocaleString("en-IN")} Saved</Tag>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{record.completionPercent}%</span>
        </div>
        <Progress
          percent={record.completionPercent}
          size="small"
          status={record.completionPercent >= 100 ? "success" : "active"}
          strokeColor={{ "0%": "#1677ff", "100%": "#52c41a" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-50">
        <div>
          <span className="text-gray-400 block">Budget</span>
          <span className="font-medium text-gray-800">NPR {record.budget.toLocaleString("en-IN")}</span>
        </div>
        <div>
          <span className="text-gray-400 block">Cost</span>
          <span className="font-semibold text-blue-600">NPR {record.completionCost.toLocaleString("en-IN")}</span>
        </div>
        <div>
          <span className="text-gray-400 block">Est. Time</span>
          <span className="text-gray-700">{record.estimatedHours} hrs</span>
        </div>
        <div>
          <span className="text-gray-400 block">Spent Time</span>
          <span className="font-medium text-gray-800">{record.actualLoggedHours} hrs</span>
        </div>
      </div>
    </div>
  );

  const renderAttendanceDiscrepancyCard = (record: any) => (
    <div key={record.userId || record.name} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1 pr-2">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{record.name}</h4>
          <span className="text-xs text-gray-500 block truncate">{record.roleName}</span>
        </div>
        {record.overtimeDays > 0 ? (
          <Tag color="orange" className="mr-0 text-xs shrink-0">{record.overtimeDays} days OT</Tag>
        ) : (
          <Tag color="default" className="mr-0 text-xs shrink-0">0 OT</Tag>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-gray-50">
        <div>
          <span className="text-[11px] text-gray-400 block">Expected/Day</span>
          <span className="font-medium text-gray-700">{record.expectedDailyHours || 8} hrs</span>
        </div>
        <div>
          <span className="text-[11px] text-gray-400 block">Worklog</span>
          <span className="font-semibold text-blue-600">{(record.totalWorklogMinutes / 60).toFixed(1)} hrs</span>
        </div>
        <div>
          <span className="text-[11px] text-gray-400 block">Attendance</span>
          <span className="font-semibold text-purple-600">{(record.totalAttendanceMinutes / 60).toFixed(1)} hrs</span>
        </div>
      </div>
    </div>
  );

  // 1. If no report is selected, show the Card-style Grouped Catalog View!
  if (!selectedReport) {
    return (
      <div className="pb-16 sm:pb-0 px-2 sm:px-0">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0 tracking-tight">
              Reports & Analytics Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
              Select a report type or visual dashboard to review records, inspect performance metrics, and export data.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search reports or dashboards..."
              allowClear
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg shadow-2xs"
            />
          </div>
        </div>

        {/* Grouped Report Cards */}
        <div className="space-y-7">
          {groupedReports.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-3.5 pb-1.5 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {group.category}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {group.items.length} {group.items.length === 1 ? "Report" : "Reports"}
                </span>
              </div>
              <Row gutter={[16, 16]}>
                {group.items.map((item) => (
                  <Col xs={24} sm={12} lg={8} key={item.key}>
                    <div
                      onClick={() => handleSelectReport(item.key)}
                      className="h-full bg-white border border-slate-200/90 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                            {item.icon}
                          </div>
                          <Tag color={item.tagColor} className="m-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0">
                            {item.tag}
                          </Tag>
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors mb-1.5 flex items-center justify-between">
                          <span>{item.title}</span>
                          <ArrowRightOutlined className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all text-xs" />
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                          {item.description}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                        <span>{item.key === "analytics" ? "Open Visual Dashboard" : "Generate Report Sheet"}</span>
                        <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform font-bold">→</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
          {groupedReports.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 m-0">No reports matched your search keyword.</p>
              <Button type="link" onClick={() => setSearchQuery("")} className="mt-2 text-xs">
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. If a generator report is selected, show ReportGeneratorStudio in detailed view with Back button!
  if (selectedReport !== "analytics") {
    return (
      <div className="pb-16 sm:pb-0 px-2 sm:px-0">
        <ReportGeneratorStudio
          initialReportType={selectedReport}
          onBack={() => handleSelectReport(null)}
          hideReportTypePicker={true}
        />
      </div>
    );
  }

  // 3. Otherwise (selectedReport === "analytics"), show Visual Analytics Dashboard with Back button!
  return (
    <div className="pb-16 sm:pb-0 px-2 sm:px-0">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => handleSelectReport(null)}
            className="flex items-center justify-center font-medium"
          >
            Back to Reports
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">
              Visual Analytics Dashboard
            </h1>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Workload distribution, productivity metrics, and project delivery analytics
            </p>
          </div>
        </div>
        {!isMobile && (
          <Button
            type="primary"
            icon={<FileExcelOutlined style={{ color: "#ffffff" }} />}
            onClick={handleExportExcel}
            style={{
              borderRadius: "6px",
              backgroundColor: "#21a366",
              borderColor: "#21a366",
            }}
          >
            Export Report Excel
          </Button>
        )}
      </div>

      {/* Header Card */}
      <Card
        style={{
          borderRadius: "8px",
          marginBottom: 16,
          background: "#ffffff",
          border: "1px solid #f0f0f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <Space size="middle" align="center">
              <Avatar
                size={52}
                icon={<BarChartOutlined />}
                style={{
                  backgroundColor: "#e6f4ff",
                  color: "#1677ff",
                  border: "1px solid #91caff",
                }}
              />
              <div>
                <Title
                  level={3}
                  style={{ color: "#1e293b", margin: 0, fontWeight: 600 }}
                >
                  Analytics & Reports Hub
                </Title>
                <Text type="secondary" style={{ fontSize: "13px" }}>
                  Real-time intelligence from your database on worklogs, project
                  costs (NPR), and team output
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={12}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Total Logged Hours
                  </Text>
                  <Title
                    level={4}
                    style={{ color: "#1677ff", margin: "2px 0 0 0" }}
                  >
                    {worklogAnalytics.totalHours}h
                  </Title>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Active Projects
                  </Text>
                  <Title
                    level={4}
                    style={{ color: "#52c41a", margin: "2px 0 0 0" }}
                  >
                    {managerAnalytics.totalProjects}
                  </Title>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Completion Cost
                  </Text>
                  <Title
                    level={4}
                    style={{ color: "#722ed1", margin: "2px 0 0 0" }}
                    ellipsis={{ tooltip: true }}
                  >
                    NPR {managerAnalytics.totalCompletionCost}
                  </Title>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Global Filter Toolbar */}
      <Card
        size="small"
        style={{
          borderRadius: "8px",
          marginBottom: 16,
          border: "1px solid #f0f0f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
        bodyStyle={{ padding: "14px 18px" }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" style={{ width: "100%" }} size={4}>
              <Text strong style={{ fontSize: 12, color: "#64748b" }}>
                Filter by Project:
              </Text>
              <Select
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children ?? option?.value ?? "")
                    .toLowerCase()
                    .includes(input.trim().toLowerCase())
                }
              >
                <Select.Option value="all">All Projects</Select.Option>
                {worklogAnalytics.projectsList.map((p: any) => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" style={{ width: "100%" }} size={4}>
              <Text strong style={{ fontSize: 12, color: "#64748b" }}>
                Filter by User:
              </Text>
              <Select
                value={selectedUserId}
                onChange={setSelectedUserId}
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children ?? option?.value ?? "")
                    .toLowerCase()
                    .includes(input.trim().toLowerCase())
                }
              >
                <Select.Option value="all">
                  All Team Members ({worklogAnalytics.usersList.length})
                </Select.Option>
                {worklogAnalytics.usersList.map((u: any) => (
                  <Select.Option key={u.id} value={u.id}>
                    {u.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8}>
            <Space direction="vertical" style={{ width: "100%" }} size={4}>
              <Text strong style={{ fontSize: 12, color: "#64748b" }}>
                Filter Date Range:
              </Text>
              <RangePicker
                style={{ width: "100%" }}
                onChange={(dates) => setDateRange(dates)}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Tabbed Analytics Section */}
      <Card
        style={{
          borderRadius: "8px",
          border: "1px solid #f0f0f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
        bodyStyle={{ padding: "20px" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          size="middle"
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
          items={[
            {
              key: "worklog",
              label: (
                <span>
                  <ClockCircleOutlined /> Worklog & Hours Report
                </span>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Total Submissions
                            </Text>
                          }
                          value={worklogAnalytics.totalWorklogs}
                          prefix={
                            <FileTextOutlined style={{ color: "#1677ff" }} />
                          }
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Approved Hours
                            </Text>
                          }
                          value={worklogAnalytics.approvedHours}
                          suffix="hrs"
                          prefix={
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          }
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Pending Hours
                            </Text>
                          }
                          value={worklogAnalytics.pendingHours}
                          suffix="hrs"
                          prefix={
                            <WarningOutlined style={{ color: "#faad14" }} />
                          }
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Active Contributors
                            </Text>
                          }
                          value={worklogAnalytics.userTableData.length}
                          prefix={<TeamOutlined style={{ color: "#722ed1" }} />}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} lg={14}>
                      <Card
                        title={
                          <Space>
                            <BarChartOutlined style={{ color: "#1677ff" }} />{" "}
                            Work Hours per Project
                          </Space>
                        }
                        size="small"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <div style={{ width: "100%", height: 280 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={worklogAnalytics.projectChartData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f0f0"
                              />
                              <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={12}
                              />
                              <YAxis stroke="#64748b" fontSize={12} unit="h" />
                              <RechartsTooltip
                                formatter={(val: any) => [
                                  `${val} hours`,
                                  "Logged Time",
                                ]}
                              />
                              <Bar
                                dataKey="hours"
                                fill="#1677ff"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={10}>
                      <Card
                        title={
                          <Space>
                            <PieChartOutlined style={{ color: "#722ed1" }} />{" "}
                            Top User Output Breakdown
                          </Space>
                        }
                        size="small"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: 280,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={worklogAnalytics.userPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {worklogAnalytics.userPieData.map(
                                  (_, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        CHART_COLORS[
                                          index % CHART_COLORS.length
                                        ]
                                      }
                                    />
                                  ),
                                )}
                              </Pie>
                              <RechartsTooltip
                                formatter={(val: any) => [
                                  `${val} hrs`,
                                  "Logged Time",
                                ]}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Divider
                    orientation="left"
                    style={{ borderColor: "#f0f0f0" }}
                  >
                    Team Member Worklog Breakdown
                  </Divider>

                  <ResponsiveTable
                    tableProps={{
                      dataSource: worklogAnalytics.userTableData,
                      rowKey: "id",
                      pagination: isMobile ? false : { pageSize: 8 },
                      size: "small",
                      columns: [
                        {
                          title: "Team Member",
                          dataIndex: "name",
                          key: "name",
                          render: (text: string, record: any) => (
                            <Space>
                              <Avatar
                                size="small"
                                style={{ backgroundColor: "#1677ff" }}
                              >
                                {text.charAt(0)}
                              </Avatar>
                              <div>
                                <Text
                                  strong
                                  style={{ display: "block", fontSize: 13 }}
                                >
                                  {text}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {record.email}
                                </Text>
                              </div>
                            </Space>
                          ),
                        },
                        {
                          title: "Submissions",
                          dataIndex: "totalWorks",
                          key: "totalWorks",
                          align: "center",
                          render: (val: number) => (
                            <Tag color="blue">{val} entries</Tag>
                          ),
                        },
                        {
                          title: "Total Logged Hours",
                          dataIndex: "totalHours",
                          key: "totalHours",
                          align: "right",
                          render: (val: string) => (
                            <Text strong style={{ color: "#1677ff" }}>
                              {val} hrs
                            </Text>
                          ),
                        },
                        {
                          title: "Approved Hours",
                          dataIndex: "approvedHours",
                          key: "approvedHours",
                          align: "right",
                          render: (val: string) => (
                            <Text style={{ color: "#52c41a" }}>{val} hrs</Text>
                          ),
                        },
                        {
                          title: "Assigned Projects",
                          dataIndex: "projectsCount",
                          key: "projectsCount",
                          align: "center",
                          render: (val: number) => (
                            <Badge
                              count={val}
                              style={{ backgroundColor: "#722ed1" }}
                            />
                          ),
                        },
                      ],
                    }}
                    renderMobileCard={renderUserWorklogCard}
                  />

                  <Divider
                    orientation="left"
                    style={{
                      margin: "32px 0 16px 0",
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    Detailed Works & Tasks Log (
                    {worklogAnalytics.detailedWorklogs.length} entries)
                  </Divider>

                  <ResponsiveTable
                    tableProps={{
                      dataSource: worklogAnalytics.detailedWorklogs,
                      rowKey: "id",
                      pagination: isMobile
                        ? false
                        : {
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50", "100"],
                            showTotal: (total, range) =>
                              `${range[0]}-${range[1]} of ${total} entries`,
                          },
                      size: "small",
                      scroll: isMobile ? undefined : { x: 1200 },
                      columns: [
                        {
                          title: "Date",
                          dataIndex: "date",
                          key: "date",
                          width: 110,
                          render: (text: string) => (
                            <Text style={{ fontSize: 12 }}>{text}</Text>
                          ),
                        },
                        {
                          title: "Employee",
                          dataIndex: "employeeName",
                          key: "employeeName",
                          width: 170,
                          render: (text: string, record: any) => (
                            <div>
                              <Text
                                strong
                                style={{ display: "block", fontSize: 12 }}
                              >
                                {text}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {record.employeeEmail}
                              </Text>
                            </div>
                          ),
                        },
                        {
                          title: "Project",
                          dataIndex: "projectName",
                          key: "projectName",
                          width: 180,
                          render: (text: string, record: any) => (
                            <div>
                              <Text
                                strong
                                style={{ display: "block", fontSize: 12 }}
                              >
                                {text}
                              </Text>
                              {record.projectCode &&
                                record.projectCode !== "-" && (
                                  <Tag color="cyan" style={{ fontSize: 10 }}>
                                    {record.projectCode}
                                  </Tag>
                                )}
                            </div>
                          ),
                        },
                        {
                          title: "Task",
                          dataIndex: "taskName",
                          key: "taskName",
                          width: 180,
                          render: (text: string, record: any) => (
                            <div>
                              <Text style={{ display: "block", fontSize: 12 }}>
                                {text}
                              </Text>
                              <Space size={4} wrap>
                                {record.taskCode && record.taskCode !== "-" && (
                                  <Tag color="purple" style={{ fontSize: 10 }}>
                                    {record.taskCode}
                                  </Tag>
                                )}
                                {record.taskStatus &&
                                  record.taskStatus !== "-" && (
                                    <Tag color="blue" style={{ fontSize: 10 }}>
                                      {record.taskStatus}
                                    </Tag>
                                  )}
                              </Space>
                            </div>
                          ),
                        },
                        {
                          title: "Work Description",
                          dataIndex: "description",
                          key: "description",
                          width: 260,
                          render: (text: string) => (
                            <FormattedWorklogDescription content={text} />
                          ),
                        },
                        {
                          title: "Time",
                          key: "time",
                          width: 150,
                          render: (_: any, record: any) => (
                            <Text style={{ fontSize: 11 }}>
                              {record.startTime} - {record.endTime}
                            </Text>
                          ),
                        },
                        {
                          title: "Hours",
                          dataIndex: "loggedHours",
                          key: "loggedHours",
                          align: "right",
                          width: 90,
                          render: (val: number) => (
                            <Text strong style={{ color: "#1677ff" }}>
                              {val} hrs
                            </Text>
                          ),
                        },
                        {
                          title: "Status",
                          dataIndex: "status",
                          key: "status",
                          align: "center",
                          width: 110,
                          render: (st: string) => {
                            let color = "default";
                            if (st === "APPROVED") color = "success";
                            else if (st === "REJECTED") color = "error";
                            else if (st === "PENDING" || st === "REQUESTED")
                              color = "warning";
                            return <Tag color={color}>{st}</Tag>;
                          },
                        },
                        {
                          title: "Approved By",
                          dataIndex: "approvedBy",
                          key: "approvedBy",
                          width: 130,
                          render: (text: string) => (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {text}
                            </Text>
                          ),
                        },
                        {
                          title: "Remarks",
                          dataIndex: "remarks",
                          key: "remarks",
                          width: 140,
                          ellipsis: { tooltip: true },
                          render: (text: string) => (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {text}
                            </Text>
                          ),
                        },
                      ],
                    }}
                    renderMobileCard={renderDetailedWorklogCard}
                  />
                </div>
              ),
            },
            {
              key: "manager",
              label: (
                <span>
                  <ProjectOutlined /> Manager Executive Report
                </span>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Projects Completed
                            </Text>
                          }
                          value={managerAnalytics.completedCount}
                          suffix={`/ ${managerAnalytics.totalProjects}`}
                          prefix={
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          }
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Total Budget Allocated
                            </Text>
                          }
                          value={`NPR ${managerAnalytics.totalBudget}`}
                          prefix={
                            <DollarOutlined style={{ color: "#1677ff" }} />
                          }
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Total Completion Cost
                            </Text>
                          }
                          value={`NPR ${managerAnalytics.totalCompletionCost}`}
                          prefix={<RiseOutlined style={{ color: "#722ed1" }} />}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <Statistic
                          title={
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              Active Managed Projects
                            </Text>
                          }
                          value={
                            managerAnalytics.totalProjects -
                            managerAnalytics.completedCount
                          }
                          prefix={
                            <ProjectOutlined style={{ color: "#fa541c" }} />
                          }
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <Space>
                            <DollarOutlined style={{ color: "#52c41a" }} />{" "}
                            Budget vs. Completion Cost (NPR)
                          </Space>
                        }
                        size="small"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <div style={{ width: "100%", height: 280 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={managerAnalytics.costChartData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f0f0"
                              />
                              <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={11}
                              />
                              <YAxis
                                stroke="#64748b"
                                fontSize={11}
                                unit=" NPR"
                              />
                              <RechartsTooltip
                                formatter={(val: any) => [
                                  `NPR ${Number(val).toLocaleString("en-IN")}`,
                                  "Cost",
                                ]}
                              />
                              <Legend />
                              <Bar
                                dataKey="Budget"
                                fill="#91caff"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="CompletionCost"
                                fill="#1677ff"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <Space>
                            <ClockCircleOutlined style={{ color: "#fa8c16" }} />{" "}
                            Estimated Time vs. Actual Time Spent
                          </Space>
                        }
                        size="small"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #f0f0f0",
                        }}
                      >
                        <div style={{ width: "100%", height: 280 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={managerAnalytics.timeChartData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f0f0"
                              />
                              <XAxis
                                dataKey="name"
                                stroke="#64748b"
                                fontSize={11}
                              />
                              <YAxis stroke="#64748b" fontSize={11} unit="h" />
                              <RechartsTooltip
                                formatter={(val: any) => [
                                  `${val} hours`,
                                  "Time",
                                ]}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="Estimated"
                                stroke="#faad14"
                                fill="#fffbe6"
                              />
                              <Area
                                type="monotone"
                                dataKey="ActualSpent"
                                stroke="#fa541c"
                                fill="#fff2e8"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Divider
                    orientation="left"
                    style={{ borderColor: "#f0f0f0" }}
                  >
                    Project Progress, Completion Cost (NPR) & Time Matrix
                  </Divider>

                  <ResponsiveTable
                    tableProps={{
                      dataSource: managerAnalytics.projectReports,
                      rowKey: "id",
                      pagination: isMobile ? false : { pageSize: 8 },
                      size: "small",
                      columns: [
                        {
                          title: "Project Name",
                          dataIndex: "name",
                          key: "name",
                          render: (text: string, record: any) => (
                            <div>
                              <Text
                                strong
                                style={{ color: "#1e293b", fontSize: 13 }}
                              >
                                {text}
                              </Text>
                              <Text
                                type="secondary"
                                style={{ display: "block", fontSize: 11 }}
                              >
                                {record.code} • Manager: {record.manager}
                              </Text>
                            </div>
                          ),
                        },
                        {
                          title: "Completion Progress",
                          dataIndex: "completionPercent",
                          key: "completionPercent",
                          width: 170,
                          render: (val: number) => (
                            <Progress
                              percent={val}
                              size="small"
                              status={val >= 100 ? "success" : "active"}
                              strokeColor={{ "0%": "#1677ff", "100%": "#52c41a" }}
                            />
                          ),
                        },
                        {
                          title: "Budget (NPR)",
                          dataIndex: "budget",
                          key: "budget",
                          align: "right",
                          render: (val: number) =>
                            `NPR ${val.toLocaleString("en-IN")}`,
                        },
                        {
                          title: "Completion Cost (NPR)",
                          dataIndex: "completionCost",
                          key: "completionCost",
                          align: "right",
                          render: (val: number) => (
                            <Text strong style={{ color: "#1677ff" }}>
                              NPR {val.toLocaleString("en-IN")}
                            </Text>
                          ),
                        },
                        {
                          title: "Cost Variance",
                          dataIndex: "costVariance",
                          key: "costVariance",
                          align: "center",
                          render: (val: number) =>
                            val > 0 ? (
                              <Tag color="red">
                                +NPR {val.toLocaleString("en-IN")} Over
                              </Tag>
                            ) : (
                              <Tag color="green">
                                -NPR {Math.abs(val).toLocaleString("en-IN")} Saved
                              </Tag>
                            ),
                        },
                        {
                          title: "Time Required (Est.)",
                          dataIndex: "estimatedHours",
                          key: "estimatedHours",
                          align: "right",
                          render: (val: number) => `${val} hrs`,
                        },
                        {
                          title: "Time Spent (Logged)",
                          dataIndex: "actualLoggedHours",
                          key: "actualLoggedHours",
                          align: "right",
                          render: (val: number) => <Text strong>{val} hrs</Text>,
                        },
                      ],
                    }}
                    renderMobileCard={renderProjectMatrixCard}
                  />
                </div>
              ),
            },
            {
              key: "attendance",
              label: (
                <span>
                  <TeamOutlined /> Attendance & Working Time Discrepancy
                </span>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  <Alert
                    type="info"
                    showIcon
                    message="Working Time Discrepancy Overview"
                    description="Compares clocked-in office attendance hours against submitted worklog hours to highlight overtime or unlogged time gaps."
                    style={{ marginBottom: 16, borderRadius: "8px" }}
                  />

                  {managerData?.workingTimeStats ? (
                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                      <Col xs={12} sm={6}>
                        <Card
                          size="small"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <Statistic
                            title={
                              <Text style={{ color: "#64748b", fontSize: 12 }}>
                                Total Attendance Hours
                              </Text>
                            }
                            value={
                              managerData.workingTimeStats.summary
                                ?.totalAttendanceHours || 0
                            }
                            suffix="hrs"
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Card
                          size="small"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <Statistic
                            title={
                              <Text style={{ color: "#64748b", fontSize: 12 }}>
                                Total Worklog Hours
                              </Text>
                            }
                            value={
                              managerData.workingTimeStats.summary
                                ?.totalWorklogHours || 0
                            }
                            suffix="hrs"
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Card
                          size="small"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <Statistic
                            title={
                              <Text style={{ color: "#64748b", fontSize: 12 }}>
                                Users with Overtime
                              </Text>
                            }
                            value={
                              managerData.workingTimeStats.summary
                                ?.usersWithOvertime || 0
                            }
                            valueStyle={{ color: "#fa8c16" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Card
                          size="small"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <Statistic
                            title={
                              <Text style={{ color: "#64748b", fontSize: 12 }}>
                                Worklog Exceeds Attendance
                              </Text>
                            }
                            value={
                              managerData.workingTimeStats.summary
                                ?.usersWorklogExceedsAttendance || 0
                            }
                            valueStyle={{ color: "#ff4d4f" }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  ) : null}

                  <ResponsiveTable
                    tableProps={{
                      dataSource: managerData?.workingTimeStats?.userStats || [],
                      rowKey: "userId",
                      size: "small",
                      pagination: isMobile ? false : undefined,
                      columns: [
                        {
                          title: "Employee Name",
                          dataIndex: "name",
                          key: "name",
                        },
                        { title: "Role", dataIndex: "roleName", key: "roleName" },
                        {
                          title: "Expected Daily Hours",
                          dataIndex: "expectedDailyHours",
                          key: "expectedDailyHours",
                          render: (val: number) => `${val || 8} hrs`,
                        },
                        {
                          title: "Total Worklog (Mins)",
                          dataIndex: "totalWorklogMinutes",
                          key: "totalWorklogMinutes",
                          render: (val: number) => `${(val / 60).toFixed(1)} hrs`,
                        },
                        {
                          title: "Total Attendance (Mins)",
                          dataIndex: "totalAttendanceMinutes",
                          key: "totalAttendanceMinutes",
                          render: (val: number) => `${(val / 60).toFixed(1)} hrs`,
                        },
                        {
                          title: "Overtime Days",
                          dataIndex: "overtimeDays",
                          key: "overtimeDays",
                          render: (val: number) =>
                            val > 0 ? (
                              <Tag color="orange">{val} days</Tag>
                            ) : (
                              <Tag color="default">0</Tag>
                            ),
                        },
                      ],
                    }}
                    renderMobileCard={renderAttendanceDiscrepancyCard}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ReportsPage;

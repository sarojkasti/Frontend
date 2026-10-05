import React, { useState, useMemo } from "react";
import {
  Card,
  Radio,
  Checkbox,
  Button,
  Table,
  Tag,
  Row,
  Col,
  Space,
  Statistic,
  Tooltip,
  Select,
  DatePicker,
  Input,
  message,
  Avatar,
  Segmented,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FilterOutlined,
  TableOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  BankOutlined,
  ApartmentOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import {
  ALL_USER_EXPORT_COLUMNS,
  UserColumnDefinition,
  getSavedUserExportColumns,
  saveUserExportColumns,
} from "./userColumnsConfig";
import { fetchDashboardWorkingTime } from "@/service/dashboard.service";

interface UserExportPageProps {
  onBack: () => void;
  selectedUsers: any[];
  allUsers: any[];
  activeTabKey: string;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "orange" },
  { value: "blocked", label: "Blocked", color: "red" },
];

const TAB_STATUS_MAP: Record<string, string> = {
  "1": "active",
  "2": "inactive",
  "3": "blocked",
};

export const UserExportPage: React.FC<UserExportPageProps> = ({
  onBack,
  selectedUsers = [],
  allUsers = [],
  activeTabKey,
  isLoading = false,
}) => {
  const hasSelected = selectedUsers && selectedUsers.length > 0;

  // 1. Export Scope State: 'selected' | 'filtered'
  const [exportScope, setExportScope] = useState<"selected" | "filtered">(
    hasSelected ? "selected" : "filtered"
  );

  // 2. Status Scope Selection (defaults to active tab)
  const initialStatus = TAB_STATUS_MAP[activeTabKey] || "active";
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([initialStatus]);

  // 3. Role & Department Filters
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // 4. Analysis Month for Work Hour & Monthly Analysis
  const [analysisMonth, setAnalysisMonth] = useState<dayjs.Dayjs>(dayjs());

  // 5. Category filter for columns / fields
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("All");

  // 6. Selected Export Column Keys
  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    getSavedUserExportColumns()
  );

  // 7. Preview Search
  const [previewSearch, setPreviewSearch] = useState<string>("");

  // Save selected fields preferences
  const handleToggleField = (key: string, checked: boolean) => {
    let next: string[];
    if (checked) {
      next = [...selectedFields, key];
    } else {
      next = selectedFields.filter((k) => k !== key);
    }
    setSelectedFields(next);
    saveUserExportColumns(next);
  };

  const handleSelectAllFields = () => {
    const allKeys = ALL_USER_EXPORT_COLUMNS.map((c) => c.key);
    setSelectedFields(allKeys);
    saveUserExportColumns(allKeys);
  };

  const handleResetFields = () => {
    const defaultKeys = ALL_USER_EXPORT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    setSelectedFields(defaultKeys);
    saveUserExportColumns(defaultKeys);
  };

  // Status selection handlers
  const handleSelectAllStatuses = () => {
    setSelectedStatuses(["active", "inactive", "blocked"]);
  };

  const handleSelectActiveOnly = () => {
    setSelectedStatuses(["active"]);
  };

  const handleClearStatuses = () => {
    setSelectedStatuses([]);
  };

  // Fetch Monthly Working Time Stats for the chosen analysis month
  const targetDateStr = analysisMonth.format("YYYY-MM-DD");
  const { data: workingTimeData, isLoading: isLoadingWorkingTime } = useQuery({
    queryKey: ["dashboard-working-time-export", targetDateStr],
    queryFn: () => fetchDashboardWorkingTime(targetDateStr, "month").catch(() => null),
  });

  // Map working time stats by user id
  const workingTimeMap = useMemo(() => {
    const map = new Map<string, any>();
    if (workingTimeData && Array.isArray(workingTimeData.userStats)) {
      workingTimeData.userStats.forEach((stat: any) => {
        if (stat?.userId) {
          map.set(String(stat.userId), stat);
        }
      });
    }
    return map;
  }, [workingTimeData]);

  // Derive unique Role options
  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    const pool = allUsers && allUsers.length > 0 ? allUsers : (selectedUsers || []);
    pool.forEach((u: any) => {
      const roleName = u.role?.displayName || u.role?.name;
      if (roleName) set.add(roleName);
    });
    return Array.from(set).sort().map((r) => ({ value: r, label: r }));
  }, [allUsers, selectedUsers]);

  // Derive unique Department options
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    const pool = allUsers && allUsers.length > 0 ? allUsers : (selectedUsers || []);
    pool.forEach((u: any) => {
      const deptName = u.profile?.department?.name;
      if (deptName) set.add(deptName);
    });
    return Array.from(set).sort().map((d) => ({ value: d, label: d }));
  }, [allUsers, selectedUsers]);

  // Filtered Users based on scope, status, role, department
  const filteredUsers = useMemo(() => {
    let list: any[] = [];
    if (exportScope === "selected") {
      // Map selected rows against full allUsers objects so they contain profile, department, bank & project relations
      list = (selectedUsers || []).map((su: any) => {
        const full = (allUsers || []).find((au: any) => String(au.id) === String(su.id));
        return full || su;
      });
    } else {
      list = allUsers && allUsers.length > 0 ? [...allUsers] : [...(selectedUsers || [])];

      // Status filter
      if (selectedStatuses.length > 0) {
        list = list.filter((u: any) => selectedStatuses.includes(u.status));
      }
    }

    // Role filter
    if (selectedRoles.length > 0) {
      list = list.filter((u: any) => {
        const roleName = u.role?.displayName || u.role?.name;
        return roleName && selectedRoles.includes(roleName);
      });
    }

    // Department filter
    if (selectedDepartments.length > 0) {
      list = list.filter((u: any) => {
        const deptName = u.profile?.department?.name;
        return deptName && selectedDepartments.includes(deptName);
      });
    }

    return list;
  }, [allUsers, selectedUsers, exportScope, selectedStatuses, selectedRoles, selectedDepartments]);

  // Enriched User Data with monthly work hour analysis & relations
  const enrichedUsers = useMemo(() => {
    return filteredUsers.map((u: any) => {
      const uId = String(u.id);
      const wt = workingTimeMap.get(uId);

      const assignedProjects: any[] = Array.isArray(u.projects) ? u.projects : [];
      const assignedProjectsNames = assignedProjects.map((p) => p.name || p.title).filter(Boolean).join(", ") || "-";

      const permanentAddressParts = [
        u.profile?.permanentAddressLocality,
        u.profile?.permanentAddressDistrict,
        u.profile?.permanentAddressState,
        u.profile?.permanentAddressCountry,
      ].filter(Boolean);
      const permanentAddress = permanentAddressParts.length > 0 ? permanentAddressParts.join(", ") : "-";

      const temporaryAddressParts = [
        u.profile?.temporaryAddressLocality,
        u.profile?.temporaryAddressDistrict,
        u.profile?.temporaryAddressState,
      ].filter(Boolean);
      const temporaryAddress = temporaryAddressParts.length > 0 ? temporaryAddressParts.join(", ") : "-";

      const firstBank = Array.isArray(u.bank_detail) && u.bank_detail.length > 0 ? u.bank_detail[0] : null;

      const monthlyWorklogHours = wt?.totalWorklogMinutes ? Number((wt.totalWorklogMinutes / 60).toFixed(1)) : 0;
      const monthlyAttendanceHours = wt?.totalAttendanceMinutes ? Number((wt.totalAttendanceMinutes / 60).toFixed(1)) : 0;
      const expectedDailyHours = wt?.expectedDailyHours || 8;
      const daysWithWorklog = wt?.daysWithWorklog ?? 0;
      const daysWithAttendance = wt?.daysWithAttendance ?? 0;
      const overtimeDays = wt?.overtimeDays ?? 0;
      const worklogExceedsAttendanceDays = wt?.worklogExceedsAttendanceDays ?? 0;
      const averageWorklogHoursPerDay = wt?.averageWorklogMinutesPerDay
        ? Number((wt.averageWorklogMinutesPerDay / 60).toFixed(1))
        : 0;

      return {
        ...u,
        rawId: uId,
        roleName: u.role?.displayName || u.role?.name || "N/A",
        departmentName: u.profile?.department?.name || "-",
        gender: u.profile?.gender ? u.profile.gender.toUpperCase() : "-",
        dateOfBirth: u.profile?.dateOfBirth ? dayjs(u.profile.dateOfBirth).format("YYYY-MM-DD") : "-",
        bloodGroup: u.profile?.bloodGroup || "-",
        maritalStatus: u.profile?.maritalStatus ? u.profile.maritalStatus.toUpperCase() : "-",
        panNo: u.profile?.panNo || "-",
        permanentAddress,
        temporaryAddress,
        emergencyContact: u.profile?.guardianName || u.profile?.emergencyContactPerson || "-",
        emergencyPhone: u.profile?.guardianContact || u.profile?.emergencyContactNumber || "-",
        bankName: firstBank?.bankName || "-",
        accountNo: firstBank?.accountNo || "-",
        bankBranch: firstBank?.bankBranch || "-",
        isBankVerified: firstBank ? (firstBank.isVerified ? "Verified" : "Pending") : "-",
        // Monthly Analysis Fields
        expectedDailyHours,
        monthlyWorklogHours,
        monthlyAttendanceHours,
        daysWithWorklog,
        daysWithAttendance,
        overtimeDays,
        worklogExceedsAttendanceDays,
        averageWorklogHoursPerDay,
        assignedProjectsCount: assignedProjects.length,
        assignedProjectsList: assignedProjectsNames,
        assignedProjects,
      };
    });
  }, [filteredUsers, workingTimeMap]);

  // Preview table items filtered by preview search input
  const previewItems = useMemo(() => {
    if (!previewSearch.trim()) return enrichedUsers;
    const q = previewSearch.trim().toLowerCase();
    return enrichedUsers.filter((u: any) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.roleName || "").toLowerCase();
      const dept = (u.departmentName || "").toLowerCase();
      const phone = (u.phoneNumber || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        role.includes(q) ||
        dept.includes(q) ||
        phone.includes(q)
      );
    });
  }, [enrichedUsers, previewSearch]);

  // Total summary statistics
  const totalMonthlyHours = useMemo(() => {
    return enrichedUsers.reduce((sum, u) => sum + (u.monthlyWorklogHours || 0), 0).toFixed(1);
  }, [enrichedUsers]);

  // Helper to create worksheets with formatted auto column widths
  const createSheetWithColWidths = (data: any[], fallbackHeaders?: string[]) => {
    let ws: XLSX.WorkSheet;
    if (!data || data.length === 0) {
      ws = XLSX.utils.json_to_sheet(
        fallbackHeaders ? [fallbackHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {})] : []
      );
    } else {
      ws = XLSX.utils.json_to_sheet(data);
      const colWidths = Object.keys(data[0]).map((key) => {
        const maxContentLength = data.reduce(
          (max, row) => Math.max(max, String(row[key] ?? "").length),
          key.length
        );
        return { wch: Math.min(Math.max(maxContentLength + 4, 12), 60) };
      });
      ws["!cols"] = colWidths;
    }
    return ws;
  };

  // Execute Excel Export
  const handleExportExcel = () => {
    if (enrichedUsers.length === 0) {
      message.warning("No users match the selected export criteria.");
      return;
    }

    if (selectedFields.length === 0) {
      message.warning("Please select at least one field to export.");
      return;
    }

    const monthStr = analysisMonth.format("YYYY_MM");
    const fileName = `Users_Export_Report_${monthStr}_${dayjs().format("YYYYMMDD")}.xlsx`;

    // 1. Primary Sheet: Selected User Columns
    const orderedSelectedColumns = ALL_USER_EXPORT_COLUMNS.filter((col) =>
      selectedFields.includes(col.key)
    );

    const primarySheetData = enrichedUsers.map((u: any, idx: number) => {
      const row: Record<string, any> = {
        "S.N.": idx + 1,
      };

      orderedSelectedColumns.forEach((col) => {
        switch (col.key) {
          case "name":
            row[col.title] = u.name || "-";
            break;
          case "username":
            row[col.title] = u.username || "-";
            break;
          case "email":
            row[col.title] = u.email || "-";
            break;
          case "phoneNumber":
            row[col.title] = u.phoneNumber || "-";
            break;
          case "role":
            row[col.title] = u.roleName;
            break;
          case "status":
            row[col.title] = u.status ? u.status.toUpperCase() : "-";
            break;
          case "hourlyRate":
            row[col.title] = u.hourlyRate !== undefined ? Number(u.hourlyRate) : "-";
            break;
          case "joinedDate":
            row[col.title] = u.joinedDate ? dayjs(u.joinedDate).format("YYYY-MM-DD") : (u.createdAt ? dayjs(u.createdAt).format("YYYY-MM-DD") : "-");
            break;
          case "createdAt":
            row[col.title] = u.createdAt ? dayjs(u.createdAt).format("YYYY-MM-DD") : "-";
            break;
          case "lastActiveAt":
            row[col.title] = u.lastActiveAt ? dayjs(u.lastActiveAt).format("YYYY-MM-DD hh:mm A") : "-";
            break;
          case "isTwoFAEnabled":
            row[col.title] = u.isTwoFAEnabled ? "Enabled" : "Disabled";
            break;
          case "department":
            row[col.title] = u.departmentName;
            break;
          case "gender":
            row[col.title] = u.gender;
            break;
          case "dateOfBirth":
            row[col.title] = u.dateOfBirth;
            break;
          case "bloodGroup":
            row[col.title] = u.bloodGroup;
            break;
          case "maritalStatus":
            row[col.title] = u.maritalStatus;
            break;
          case "panNo":
            row[col.title] = u.panNo;
            break;
          case "permanentAddress":
            row[col.title] = u.permanentAddress;
            break;
          case "temporaryAddress":
            row[col.title] = u.temporaryAddress;
            break;
          case "emergencyContact":
            row[col.title] = u.emergencyContact;
            break;
          case "emergencyPhone":
            row[col.title] = u.emergencyPhone;
            break;
          case "bankName":
            row[col.title] = u.bankName;
            break;
          case "accountNo":
            row[col.title] = u.accountNo;
            break;
          case "bankBranch":
            row[col.title] = u.bankBranch;
            break;
          case "isBankVerified":
            row[col.title] = u.isBankVerified;
            break;
          case "expectedDailyHours":
            row[col.title] = Number(u.expectedDailyHours);
            break;
          case "monthlyWorklogHours":
            row[col.title] = Number(u.monthlyWorklogHours);
            break;
          case "monthlyAttendanceHours":
            row[col.title] = Number(u.monthlyAttendanceHours);
            break;
          case "daysWithWorklog":
            row[col.title] = Number(u.daysWithWorklog);
            break;
          case "daysWithAttendance":
            row[col.title] = Number(u.daysWithAttendance);
            break;
          case "overtimeDays":
            row[col.title] = Number(u.overtimeDays);
            break;
          case "worklogExceedsAttendanceDays":
            row[col.title] = Number(u.worklogExceedsAttendanceDays);
            break;
          case "averageWorklogHoursPerDay":
            row[col.title] = Number(u.averageWorklogHoursPerDay);
            break;
          case "assignedProjectsCount":
            row[col.title] = Number(u.assignedProjectsCount);
            break;
          case "assignedProjectsList":
            row[col.title] = u.assignedProjectsList;
            break;
          default:
            row[col.title] = u[col.key] || "-";
            break;
        }
      });

      return row;
    });

    // 2. Sheet 2: Monthly Workhour Analysis Deep Dive
    const monthlyAnalysisSheetData = enrichedUsers.map((u: any, idx: number) => ({
      "S.N.": idx + 1,
      "Employee Name": u.name,
      "Email Address": u.email,
      "Role": u.roleName,
      "Department": u.departmentName,
      "Analysis Month": analysisMonth.format("MMMM YYYY"),
      "Daily Expected Hours (hrs)": Number(u.expectedDailyHours),
      "Total Monthly Logged Hours (hrs)": Number(u.monthlyWorklogHours),
      "Total Clocked Attendance (hrs)": Number(u.monthlyAttendanceHours),
      "Days with Logged Work": Number(u.daysWithWorklog),
      "Days with Clocked Attendance": Number(u.daysWithAttendance),
      "Days Exceeding Daily Expectation (Overtime)": Number(u.overtimeDays),
      "Days Worklog Exceeded Clocked Attendance": Number(u.worklogExceedsAttendanceDays),
      "Average Worklog Hours / Active Day (hrs)": Number(u.averageWorklogHoursPerDay),
      "Active Assigned Projects Count": Number(u.assignedProjectsCount),
    }));

    // 3. Sheet 3: User to Project Assignment Breakdown
    const projectAssignmentRows: any[] = [];
    enrichedUsers.forEach((u: any) => {
      const projects = u.assignedProjects || [];
      if (projects.length > 0) {
        projects.forEach((proj: any, pIdx: number) => {
          projectAssignmentRows.push({
            "S.N.": projectAssignmentRows.length + 1,
            "Employee Name": u.name,
            "Email Address": u.email,
            "Role": u.roleName,
            "Project #": pIdx + 1,
            "Project Name": proj.name || proj.title || "-",
            "Project Code": proj.code || "-",
            "Project Status": proj.status ? String(proj.status).toUpperCase() : "-",
          });
        });
      } else {
        projectAssignmentRows.push({
          "S.N.": projectAssignmentRows.length + 1,
          "Employee Name": u.name,
          "Email Address": u.email,
          "Role": u.roleName,
          "Project #": "-",
          "Project Name": "No Projects Assigned",
          "Project Code": "-",
          "Project Status": "-",
        });
      }
    });

    const workbook = XLSX.utils.book_new();
    const primaryWorksheet = createSheetWithColWidths(primarySheetData);
    const monthlyWorksheet = createSheetWithColWidths(monthlyAnalysisSheetData);
    const projectWorksheet = createSheetWithColWidths(projectAssignmentRows);

    XLSX.utils.book_append_sheet(workbook, primaryWorksheet, "User Details");
    XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, "Monthly Workhour Analysis");
    XLSX.utils.book_append_sheet(workbook, projectWorksheet, "Project Assignments");

    XLSX.writeFile(workbook, fileName);
    message.success(`Successfully exported ${enrichedUsers.length} user records to Excel!`);
  };

  // Visible filtered column list for Column Selector card
  const visibleColumnPills = useMemo(() => {
    if (activeCategoryTab === "All") return ALL_USER_EXPORT_COLUMNS;
    return ALL_USER_EXPORT_COLUMNS.filter((c) => c.category === activeCategoryTab);
  }, [activeCategoryTab]);

  // Clean, focused columns for Live Data Preview (NO horizontal overflow clutter / junkies!)
  const previewColumns = useMemo(() => {
    return [
      {
        title: "Employee",
        dataIndex: "name",
        key: "name",
        width: 220,
        render: (name: string, record: any) => (
          <div className="flex items-center gap-2.5">
            <Avatar
              size={32}
              style={{
                backgroundColor: record.status === "active" ? "#1677ff" : "#94a3b8",
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {name ? name.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <div className="min-w-0">
              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }} className="truncate">
                {name}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }} className="truncate">
                {record.email || "-"}
              </div>
              {record.phoneNumber && (
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {record.phoneNumber}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Role & Department",
        key: "roleDept",
        width: 190,
        render: (_: any, record: any) => (
          <div>
            <Tag color="blue" style={{ fontSize: 11, marginBottom: 2 }}>
              {record.roleName || "No Role"}
            </Tag>
            {record.departmentName && record.departmentName !== "-" ? (
              <div style={{ fontSize: 11, color: "#475569" }} className="truncate">
                {record.departmentName}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 95,
        align: "center" as const,
        render: (st: string) => {
          let color = "default";
          if (st === "active") color = "green";
          else if (st === "inactive") color = "orange";
          else if (st === "blocked") color = "red";
          return <Tag color={color}>{st ? st.toUpperCase() : "-"}</Tag>;
        },
      },
      {
        title: `Work Hours (${analysisMonth.format("MMM YYYY")})`,
        key: "workHours",
        width: 170,
        render: (_: any, record: any) => (
          <div>
            <span style={{ fontWeight: 700, color: "#1677ff", fontSize: 13 }}>
              {record.monthlyWorklogHours} hrs
            </span>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {record.daysWithWorklog || 0} work days
              {Number(record.overtimeDays) > 0 && (
                <Tag color="orange" style={{ fontSize: 10, marginLeft: 4, padding: "0 3px" }}>
                  +{record.overtimeDays}d OT
                </Tag>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Assigned Projects",
        key: "assignedProjects",
        width: 200,
        render: (_: any, record: any) => {
          const count = record.assignedProjectsCount || 0;
          return (
            <div>
              <Tag color={count > 0 ? "cyan" : "default"} style={{ fontSize: 11, marginBottom: 2 }}>
                {count} {count === 1 ? "Project" : "Projects"}
              </Tag>
              {count > 0 && (
                <Tooltip title={record.assignedProjectsList}>
                  <div style={{ fontSize: 11, color: "#475569" }} className="truncate max-w-[190px]">
                    {record.assignedProjectsList}
                  </div>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        title: "Bank & Verification",
        key: "bankInfo",
        width: 160,
        render: (_: any, record: any) => (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#334155" }} className="truncate">
              {record.bankName !== "-" ? record.bankName : "No Bank Added"}
            </div>
            {record.bankName !== "-" && (
              <Tag
                color={record.isBankVerified === "Verified" ? "success" : "warning"}
                style={{ fontSize: 10, marginTop: 2 }}
              >
                {record.isBankVerified}
              </Tag>
            )}
          </div>
        ),
      },
    ];
  }, [analysisMonth]);

  return (
    <div style={{ padding: "0 4px", minHeight: "85vh" }}>
      {/* Top Header Bar matching ProjectExportPage */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <Space size={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="large">
            Back to Users
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
              Users Data & Monthly Work Hour Export Helper
            </h1>
            <p className="text-xs text-slate-500 m-0">
              Configure target users, status scopes, role/department filters, and export user & workhour analytics to Excel
            </p>
          </div>
        </Space>
      </div>

      {/* Main 2-Column Section matching ProjectExportPage */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Scope, Status, and Profile Filters */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* 1. Scope & Status Selection */}
            <Card
              title={
                <Space>
                  <AppstoreOutlined className="text-blue-600" />
                  <span style={{ fontWeight: 600 }}>1. Choose User Scope & Status Filters</span>
                </Space>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              <Radio.Group
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value)}
                style={{ width: "100%", marginBottom: 16 }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Card
                      size="small"
                      className={`cursor-pointer transition-all ${
                        exportScope === "selected" ? "border-blue-500 bg-blue-50/50" : "border-slate-200"
                      }`}
                      onClick={() => hasSelected && setExportScope("selected")}
                    >
                      <Radio value="selected" disabled={!hasSelected}>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          Selected Users ({selectedUsers.length})
                        </span>
                        {!hasSelected && (
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>
                            (Check checkboxes in table to select)
                          </div>
                        )}
                      </Radio>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      className={`cursor-pointer transition-all ${
                        exportScope === "filtered" ? "border-blue-500 bg-blue-50/50" : "border-slate-200"
                      }`}
                      onClick={() => setExportScope("filtered")}
                    >
                      <Radio value="filtered">
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          All Users in Scope ({allUsers.length})
                        </span>
                      </Radio>
                    </Card>
                  </Col>
                </Row>
              </Radio.Group>

              {/* Status Selector Checkboxes when exportScope is 'filtered' */}
              {exportScope === "filtered" && (
                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                      Select Statuses to Include ({selectedStatuses.length} selected):
                    </span>
                    <Space size={4}>
                      <Button size="small" type="link" onClick={handleSelectAllStatuses} style={{ padding: 0 }}>
                        Select All
                      </Button>
                      <span style={{ color: "#cbd5e1" }}>|</span>
                      <Button size="small" type="link" onClick={handleSelectActiveOnly} style={{ padding: 0 }}>
                        Active Only
                      </Button>
                      <span style={{ color: "#cbd5e1" }}>|</span>
                      <Button size="small" type="link" onClick={handleClearStatuses} style={{ padding: 0 }}>
                        Clear
                      </Button>
                    </Space>
                  </div>

                  <Checkbox.Group
                    value={selectedStatuses}
                    onChange={(vals) => setSelectedStatuses(vals as string[])}
                    style={{ width: "100%" }}
                  >
                    <Row gutter={[12, 10]}>
                      {STATUS_OPTIONS.map((st) => {
                        const count = allUsers.filter((u) => u.status === st.value).length;
                        return (
                          <Col span={8} key={st.value}>
                            <Checkbox value={st.value}>
                              <Tag color={st.color} style={{ margin: 0 }}>
                                {st.label} ({count})
                              </Tag>
                            </Checkbox>
                          </Col>
                        );
                      })}
                    </Row>
                  </Checkbox.Group>
                </div>
              )}

              {/* Selected Users Mini Preview Table matching ProjectExportPage */}
              {exportScope === "selected" && (
                <div style={{ marginBottom: 16 }}>
                  <Table
                    dataSource={selectedUsers}
                    rowKey={(r: any) => r.id?.toString() || Math.random().toString()}
                    pagination={false}
                    size="small"
                    scroll={{ y: 150 }}
                    columns={[
                      {
                        title: "Selected Employee",
                        dataIndex: "name",
                        key: "name",
                        render: (name: string, r: any) => (
                          <div>
                            <strong style={{ color: "#1e293b", display: "block" }}>{name}</strong>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{r.email}</span>
                          </div>
                        ),
                      },
                      {
                        title: "Role",
                        key: "role",
                        render: (_: any, r: any) => (
                          <Tag color="blue">{r.role?.displayName || r.role?.name || "N/A"}</Tag>
                        ),
                      },
                      {
                        title: "Status",
                        dataIndex: "status",
                        key: "status",
                        render: (st: string) => {
                          let color = "default";
                          if (st === "active") color = "green";
                          else if (st === "inactive") color = "orange";
                          else if (st === "blocked") color = "red";
                          return <Tag color={color}>{st ? st.toUpperCase() : "-"}</Tag>;
                        },
                      },
                    ]}
                  />
                </div>
              )}

              {/* Role, Department & Work Hour Month Filters */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                <Row gutter={[16, 12]}>
                  <Col span={12}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                      Filter by Role:
                    </div>
                    <Select
                      mode="multiple"
                      placeholder="All Roles"
                      value={selectedRoles}
                      onChange={setSelectedRoles}
                      options={roleOptions}
                      allowClear
                      style={{ width: "100%" }}
                      maxTagCount="responsive"
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                      Filter by Department:
                    </div>
                    <Select
                      mode="multiple"
                      placeholder="All Departments"
                      value={selectedDepartments}
                      onChange={setSelectedDepartments}
                      options={departmentOptions}
                      allowClear
                      style={{ width: "100%" }}
                      maxTagCount="responsive"
                    />
                  </Col>
                  <Col span={24}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                        Work Hour Analysis Month:
                      </span>
                      <DatePicker
                        picker="month"
                        value={analysisMonth}
                        onChange={(d) => d && setAnalysisMonth(d)}
                        format="MMMM YYYY"
                        allowClear={false}
                        style={{ width: 180 }}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Space>
        </Col>

        {/* Right Column: Live Summary & Column Field Checkboxes matching ProjectExportPage */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Live Summary Card matching ProjectExportPage */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm" size="small">
              <Row gutter={16} align="middle">
                <Col span={14}>
                  <Statistic
                    title="Users Matching All Filters"
                    value={enrichedUsers.length}
                    suffix={`/ ${allUsers.length || selectedUsers.length}`}
                    prefix={<CheckCircleOutlined style={{ color: "#1677ff" }} />}
                    valueStyle={{ color: "#1e3a8a", fontWeight: 700 }}
                  />
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: 4 }}>
                    Statuses: {exportScope === "selected" ? "Selected" : selectedStatuses.join(", ") || "All"} | Columns: {selectedFields.length} | Monthly Hours: {totalMonthlyHours} hrs
                  </div>
                </Col>
                <Col span={10} style={{ textAlign: "right" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    disabled={enrichedUsers.length === 0}
                    style={{
                      borderRadius: "6px",
                      backgroundColor: "#21a366",
                      borderColor: "#21a366",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(33, 163, 102, 0.35)",
                    }}
                  >
                    Export to Excel
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* 2. Select Columns to Export */}
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <Space>
                    <TableOutlined className="text-indigo-600" />
                    <span style={{ fontWeight: 600 }}>2. Select Columns to Export ({selectedFields.length})</span>
                  </Space>
                  <Space size={4}>
                    <Button size="small" type="link" onClick={handleSelectAllFields} style={{ padding: 0 }}>
                      Select All
                    </Button>
                    <span style={{ color: "#cbd5e1" }}>|</span>
                    <Button size="small" type="link" icon={<ReloadOutlined />} onClick={handleResetFields} style={{ padding: 0 }}>
                      Reset
                    </Button>
                  </Space>
                </div>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              {/* Category Filter Tabs */}
              <div style={{ marginBottom: 12 }}>
                <Segmented
                  options={[
                    { label: `All (${ALL_USER_EXPORT_COLUMNS.length})`, value: "All" },
                    { label: `Account (10)`, value: "Account" },
                    { label: `Profile (10)`, value: "Profile" },
                    { label: `Bank (4)`, value: "Bank" },
                    { label: `Work Hours (10)`, value: "Work Hours" },
                  ]}
                  value={activeCategoryTab}
                  onChange={(val) => setActiveCategoryTab(val as string)}
                  block
                  size="small"
                />
              </div>

              {/* 2-Column Grid Layout matching ProjectExportPage with NO scrollbar clutter */}
              <Row gutter={[10, 8]}>
                {visibleColumnPills.map((col) => {
                  const isChecked = selectedFields.includes(col.key);

                  return (
                    <Col span={12} key={col.key}>
                      <div
                        style={{
                          padding: "7px 10px",
                          borderRadius: 6,
                          border: "1px solid",
                          borderColor: isChecked ? "#93c5fd" : "#f1f5f9",
                          backgroundColor: isChecked ? "#eff6ff" : "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onClick={() => handleToggleField(col.key, !isChecked)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => handleToggleField(col.key, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={col.required}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              color: isChecked ? "#1e40af" : "#475569",
                              fontWeight: isChecked ? 600 : 400,
                            }}
                          >
                            {col.title}
                          </span>
                        </Checkbox>

                        {col.required && (
                          <Tag color="blue" style={{ fontSize: "10px", margin: 0, padding: "0 4px" }}>
                            Required
                          </Tag>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* 3. Clean, Human-Readable Live Data Preview (NO horizontal overflow junkies!) */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Space>
              <TableOutlined style={{ color: "#1677ff" }} />
              <span style={{ fontWeight: 600 }}>
                3. Live Data Preview ({previewItems.length} records ready for export)
              </span>
            </Space>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search preview by name, role, email, dept..."
              value={previewSearch}
              onChange={(e) => setPreviewSearch(e.target.value)}
              allowClear
              style={{ width: 280 }}
              size="small"
            />
          </div>
        }
        size="small"
        style={{ borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: 20 }}
      >
        <Table
          dataSource={previewItems}
          columns={previewColumns}
          rowKey={(record) => record.rawId || record.id}
          size="small"
          loading={isLoading || isLoadingWorkingTime}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ["8", "15", "30", "50"],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          }}
        />
      </Card>
    </div>
  );
};

export default UserExportPage;

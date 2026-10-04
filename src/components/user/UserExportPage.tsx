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
  Divider,
  Statistic,
  Tooltip,
  Select,
  DatePicker,
  Input,
  message,
  Tabs,
  Badge,
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
  CalendarOutlined,
  ApartmentOutlined,
  BankOutlined,
  CheckSquareOutlined,
  BorderOutlined,
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
  selectedUsers,
  allUsers,
  activeTabKey,
}) => {
  const hasSelected = selectedUsers && selectedUsers.length > 0;

  // 1. Export Scope State: 'selected' | 'filtered'
  const [exportScope, setExportScope] = useState<"selected" | "filtered">(
    hasSelected ? "selected" : "filtered"
  );

  // 2. Status Scope Selection
  const initialStatus = TAB_STATUS_MAP[activeTabKey] || "active";
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([initialStatus]);

  // 3. Role & Department Filters
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  // 4. Analysis Month for Project Work Hour & Monthly Analysis
  const [analysisMonth, setAnalysisMonth] = useState<dayjs.Dayjs>(dayjs());

  // 5. Column / Field Selection State
  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    getSavedUserExportColumns()
  );

  // 6. Preview Table Search State
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

  const handleDeselectAllFields = () => {
    setSelectedFields(["name"]);
    saveUserExportColumns(["name"]);
  };

  const handleResetFields = () => {
    const defaultKeys = ALL_USER_EXPORT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    setSelectedFields(defaultKeys);
    saveUserExportColumns(defaultKeys);
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
    allUsers.forEach((u: any) => {
      const roleName = u.role?.displayName || u.role?.name;
      if (roleName) set.add(roleName);
    });
    return Array.from(set).sort().map((r) => ({ value: r, label: r }));
  }, [allUsers]);

  // Derive unique Department options
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach((u: any) => {
      const deptName = u.profile?.department?.name;
      if (deptName) set.add(deptName);
    });
    return Array.from(set).sort().map((d) => ({ value: d, label: d }));
  }, [allUsers]);

  // Filtered Users based on scope, status, role, department
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];

    let list = exportScope === "selected" ? [...selectedUsers] : [...allUsers];

    // Status filter
    if (exportScope === "filtered" && selectedStatuses.length > 0) {
      list = list.filter((u: any) => selectedStatuses.includes(u.status));
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

  const activeUsersCount = useMemo(() => {
    return enrichedUsers.filter((u) => u.status === "active").length;
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
      "Days Clocked In": Number(u.daysWithAttendance),
      "Overtime Days This Month": Number(u.overtimeDays),
      "Discrepancy (Worklog > Clock) Days": Number(u.worklogExceedsAttendanceDays),
      "Average Worklog Hours / Day": Number(u.averageWorklogHoursPerDay),
      "Assigned Projects Count": Number(u.assignedProjectsCount),
      "Status": u.status ? u.status.toUpperCase() : "-",
    }));

    // 3. Sheet 3: Project Assignments Breakdown
    const projectAssignmentRows: any[] = [];
    enrichedUsers.forEach((u: any) => {
      if (u.assignedProjects && u.assignedProjects.length > 0) {
        u.assignedProjects.forEach((proj: any, pIdx: number) => {
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

  // Columns for Preview Table
  const previewColumns = useMemo(() => {
    const cols: any[] = [
      {
        title: "Employee",
        dataIndex: "name",
        key: "name",
        fixed: "left",
        width: 180,
        render: (text: string, record: any) => (
          <div>
            <span style={{ fontWeight: 600, color: "#1e293b", display: "block" }}>{text}</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>{record.email}</span>
          </div>
        ),
      },
      {
        title: "Role & Dept",
        key: "roleDept",
        width: 170,
        render: (_: any, record: any) => (
          <div>
            <Tag color="blue" style={{ fontSize: 11, marginBottom: 2 }}>{record.roleName}</Tag>
            {record.departmentName !== "-" && (
              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>{record.departmentName}</span>
            )}
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        align: "center",
        render: (status: string) => {
          let color = "default";
          if (status === "active") color = "green";
          else if (status === "inactive") color = "orange";
          else if (status === "blocked") color = "red";
          return <Tag color={color}>{status ? status.toUpperCase() : "-"}</Tag>;
        },
      },
    ];

    // Append dynamic columns according to selected fields
    const dynamicFields = ALL_USER_EXPORT_COLUMNS.filter(
      (c) => selectedFields.includes(c.key) && !["name", "email", "role", "status"].includes(c.key)
    );

    dynamicFields.forEach((f) => {
      cols.push({
        title: f.title,
        dataIndex: f.key,
        key: f.key,
        width: f.defaultWidth || 150,
        render: (val: any) => {
          if (val === undefined || val === null || val === "") return "-";
          if (typeof val === "boolean") return val ? "Yes" : "No";
          if (f.key === "monthlyWorklogHours" || f.key === "monthlyAttendanceHours") {
            return <span style={{ fontWeight: 600, color: "#1677ff" }}>{val} hrs</span>;
          }
          if (f.key === "overtimeDays" && Number(val) > 0) {
            return <Tag color="orange">{val} days</Tag>;
          }
          if (f.key === "worklogExceedsAttendanceDays" && Number(val) > 0) {
            return <Tag color="red">{val} days</Tag>;
          }
          return String(val);
        },
      });
    });

    return cols;
  }, [selectedFields]);

  // Categories for field selection
  const categories: ("Account" | "Profile" | "Bank" | "Work Hours")[] = [
    "Account",
    "Profile",
    "Bank",
    "Work Hours",
  ];

  return (
    <div style={{ padding: "0 4px 32px 4px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space size="middle" align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="middle">
            Back to Users
          </Button>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
              Users Data & Monthly Work Hour Export Helper
            </h2>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Select custom user details, profile attributes, and monthly project work hour analytics for Excel generation.
            </span>
          </div>
        </Space>

        <Button
          type="primary"
          size="large"
          icon={<DownloadOutlined style={{ color: "#ffffff" }} />}
          onClick={handleExportExcel}
          style={{
            borderRadius: "6px",
            backgroundColor: "#21a366",
            borderColor: "#21a366",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(33, 163, 102, 0.35)",
          }}
        >
          Export to Excel ({enrichedUsers.length} Users)
        </Button>
      </div>

      {/* Metrics Banner */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <Statistic
              title={<span style={{ color: "#64748b", fontSize: 12 }}>Users in Scope</span>}
              value={enrichedUsers.length}
              suffix={`/ ${allUsers.length}`}
              prefix={<UserOutlined style={{ color: "#1677ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <Statistic
              title={<span style={{ color: "#64748b", fontSize: 12 }}>Active Users</span>}
              value={activeUsersCount}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <Statistic
              title={<span style={{ color: "#64748b", fontSize: 12 }}>Fields Selected</span>}
              value={selectedFields.length}
              suffix={`/ ${ALL_USER_EXPORT_COLUMNS.length}`}
              prefix={<TableOutlined style={{ color: "#722ed1" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <Statistic
              title={
                <span style={{ color: "#64748b", fontSize: 12 }}>
                  Monthly Logged Hours ({analysisMonth.format("MMM YYYY")})
                </span>
              }
              value={totalMonthlyHours}
              suffix="hrs"
              prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Step 1: Export Scope & Configuration Card */}
      <Card
        title={
          <Space>
            <FilterOutlined style={{ color: "#1677ff" }} />
            <span style={{ fontWeight: 600 }}>1. Export Scope & Filters</span>
          </Space>
        }
        size="small"
        style={{ borderRadius: "8px", marginBottom: 16, border: "1px solid #e2e8f0" }}
      >
        <Row gutter={[20, 16]} align="middle">
          {/* Scope Selector */}
          <Col xs={24} md={6}>
            <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#475569" }}>
              Export Population:
            </div>
            <Radio.Group
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="filtered">
                All / Filtered Users ({allUsers.length})
              </Radio.Button>
              <Radio.Button value="selected" disabled={!hasSelected}>
                Selected ({selectedUsers.length})
              </Radio.Button>
            </Radio.Group>
          </Col>

          {/* Status Multi-select */}
          {exportScope === "filtered" && (
            <Col xs={24} md={6}>
              <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Account Statuses:
              </div>
              <Checkbox.Group
                options={STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value }))}
                value={selectedStatuses}
                onChange={(vals) => setSelectedStatuses(vals as string[])}
              />
            </Col>
          )}

          {/* Role Filter */}
          <Col xs={24} md={6}>
            <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#475569" }}>
              Filter by Role:
            </div>
            <Select
              mode="multiple"
              placeholder="All Roles"
              value={selectedRoles}
              onChange={setSelectedRoles}
              options={roleOptions}
              style={{ width: "100%" }}
              allowClear
              maxTagCount="responsive"
            />
          </Col>

          {/* Analysis Month */}
          <Col xs={24} md={6}>
            <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#475569" }}>
              Work Hour Analysis Month:
            </div>
            <DatePicker
              picker="month"
              value={analysisMonth}
              onChange={(date) => {
                if (date) setAnalysisMonth(date);
              }}
              allowClear={false}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Step 2: Custom Field / Column Selection Card */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Space>
              <TableOutlined style={{ color: "#722ed1" }} />
              <span style={{ fontWeight: 600 }}>2. Choose Fields to Download ({selectedFields.length} selected)</span>
            </Space>
            <Space size="small">
              <Button size="small" icon={<CheckSquareOutlined />} onClick={handleSelectAllFields}>
                Select All
              </Button>
              <Button size="small" icon={<BorderOutlined />} onClick={handleDeselectAllFields}>
                Deselect All
              </Button>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleResetFields}>
                Reset to Defaults
              </Button>
            </Space>
          </div>
        }
        size="small"
        style={{ borderRadius: "8px", marginBottom: 16, border: "1px solid #e2e8f0" }}
      >
        <Tabs
          type="card"
          size="small"
          items={categories.map((cat) => {
            const catColumns = ALL_USER_EXPORT_COLUMNS.filter((c) => c.category === cat);
            const catSelectedCount = catColumns.filter((c) => selectedFields.includes(c.key)).length;

            return {
              key: cat,
              label: (
                <span>
                  {cat === "Account" && <UserOutlined style={{ marginRight: 6 }} />}
                  {cat === "Profile" && <ApartmentOutlined style={{ marginRight: 6 }} />}
                  {cat === "Bank" && <BankOutlined style={{ marginRight: 6 }} />}
                  {cat === "Work Hours" && <ClockCircleOutlined style={{ marginRight: 6 }} />}
                  {cat} ({catSelectedCount}/{catColumns.length})
                </span>
              ),
              children: (
                <div style={{ padding: "12px 6px" }}>
                  <Row gutter={[16, 12]}>
                    {catColumns.map((col) => {
                      const isChecked = selectedFields.includes(col.key);
                      return (
                        <Col xs={24} sm={12} md={8} lg={6} key={col.key}>
                          <div
                            onClick={() => handleToggleField(col.key, !isChecked)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: isChecked ? "1px solid #91caff" : "1px solid #f0f0f0",
                              background: isChecked ? "#f0f7ff" : "#ffffff",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => handleToggleField(col.key, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={col.required}
                            >
                              <span style={{ fontWeight: isChecked ? 600 : 400, fontSize: 13, color: "#1e293b" }}>
                                {col.title}
                              </span>
                            </Checkbox>
                            {col.description && (
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, paddingLeft: 24 }}>
                                {col.description}
                              </div>
                            )}
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ),
            };
          })}
        />
      </Card>

      {/* Step 3: Live Preview Table */}
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
              placeholder="Search preview by name, role, email..."
              value={previewSearch}
              onChange={(e) => setPreviewSearch(e.target.value)}
              allowClear
              style={{ width: 280 }}
              size="small"
            />
          </div>
        }
        size="small"
        style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
      >
        <Table
          dataSource={previewItems}
          columns={previewColumns}
          rowKey="rawId"
          size="small"
          scroll={{ x: 1200 }}
          loading={isLoadingWorkingTime}
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

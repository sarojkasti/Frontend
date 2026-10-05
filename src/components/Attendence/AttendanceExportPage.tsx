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
  TableOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import * as XLSX from "xlsx";
import {
  ALL_ATTENDANCE_EXPORT_COLUMNS,
  AttendanceColumnDefinition,
  getSavedAttendanceExportColumns,
  saveAttendanceExportColumns,
  getSavedAttendancePagination,
  saveAttendancePagination,
} from "./attendanceColumnsConfig";
import { useExportAttendance } from "@/hooks/attendence/useExportAttendance";
import { useUser } from "@/hooks/user/useUser";
import { useSession } from "@/context/SessionContext";

const { RangePicker } = DatePicker;

interface AttendanceExportPageProps {
  onBack: () => void;
  initialDate?: string;
  initialUserId?: string;
}

type DatePreset = "this_month" | "last_month" | "today" | "last_7_days" | "last_30_days" | "custom" | "all";

export const AttendanceExportPage: React.FC<AttendanceExportPageProps> = ({
  onBack,
  initialDate,
  initialUserId,
}) => {
  const { profile } = useSession();

  // Check if current user is admin / superuser
  const roleName = ((profile?.role as any)?.name || "").toLowerCase();
  const isSuperUser =
    roleName === "superuser" ||
    roleName === "admin" ||
    roleName === "administrator" ||
    roleName.includes("admin") ||
    roleName.includes("super");

  // 1. Date Preset State
  const [datePreset, setDatePreset] = useState<DatePreset>(initialDate ? "custom" : "this_month");
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    initialDate ? dayjs(initialDate) : dayjs().startOf("month"),
    initialDate ? dayjs(initialDate) : dayjs().endOf("month"),
  ]);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs>(dayjs());

  // 2. Derive effective startDate & endDate for API query
  const { queryStartDate, queryEndDate } = useMemo(() => {
    switch (datePreset) {
      case "this_month":
        return {
          queryStartDate: selectedMonth.startOf("month").format("YYYY-MM-DD"),
          queryEndDate: selectedMonth.endOf("month").format("YYYY-MM-DD"),
        };
      case "last_month": {
        const lastM = dayjs().subtract(1, "month");
        return {
          queryStartDate: lastM.startOf("month").format("YYYY-MM-DD"),
          queryEndDate: lastM.endOf("month").format("YYYY-MM-DD"),
        };
      }
      case "today":
        return {
          queryStartDate: dayjs().format("YYYY-MM-DD"),
          queryEndDate: dayjs().format("YYYY-MM-DD"),
        };
      case "last_7_days":
        return {
          queryStartDate: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
          queryEndDate: dayjs().format("YYYY-MM-DD"),
        };
      case "last_30_days":
        return {
          queryStartDate: dayjs().subtract(29, "day").format("YYYY-MM-DD"),
          queryEndDate: dayjs().format("YYYY-MM-DD"),
        };
      case "custom":
        return {
          queryStartDate: customRange[0] ? customRange[0].format("YYYY-MM-DD") : undefined,
          queryEndDate: customRange[1] ? customRange[1].format("YYYY-MM-DD") : undefined,
        };
      case "all":
      default:
        return { queryStartDate: undefined, queryEndDate: undefined };
    }
  }, [datePreset, selectedMonth, customRange]);

  // 3. Employee Scope & Filters
  const [employeeScope, setEmployeeScope] = useState<"all" | "specific">(
    initialUserId ? "specific" : "all"
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    initialUserId ? [initialUserId] : []
  );
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete">("all");

  // 4. Category filter for columns
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("All");

  // 5. Selected Export Column Keys (loaded from LocalStorage)
  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    getSavedAttendanceExportColumns()
  );

  // 6. Preview Search Input
  const [previewSearch, setPreviewSearch] = useState<string>("");

  // 7. Pagination Size (loaded from LocalStorage)
  const [pageSize, setPageSize] = useState<number>(() => getSavedAttendancePagination(8));

  // Save selected fields preferences
  const handleToggleField = (key: string, checked: boolean) => {
    let next: string[];
    if (checked) {
      next = [...selectedFields, key];
    } else {
      next = selectedFields.filter((k) => k !== key);
    }
    setSelectedFields(next);
    saveAttendanceExportColumns(next);
  };

  const handleSelectAllFields = () => {
    const allKeys = ALL_ATTENDANCE_EXPORT_COLUMNS.map((c) => c.key);
    setSelectedFields(allKeys);
    saveAttendanceExportColumns(allKeys);
  };

  const handleResetFields = () => {
    const defaultKeys = ALL_ATTENDANCE_EXPORT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    setSelectedFields(defaultKeys);
    saveAttendanceExportColumns(defaultKeys);
  };

  // Fetch all active users for Employee & Department dropdowns
  const { data: usersData } = useUser({
    status: "active",
    limit: 150,
    page: 1,
    keywords: "",
  });

  const allActiveUsers = useMemo(() => {
    return Array.isArray(usersData) ? usersData : usersData?.results || [];
  }, [usersData]);

  // Fetch Attendance Records for Export
  const { data: rawAttendanceData, isLoading: isLoadingAttendance } = useExportAttendance({
    startDate: queryStartDate,
    endDate: queryEndDate,
    userId: employeeScope === "specific" && selectedEmployeeIds.length === 1 ? selectedEmployeeIds[0] : undefined,
  });

  const attendanceList = useMemo(() => {
    return Array.isArray(rawAttendanceData) ? rawAttendanceData : [];
  }, [rawAttendanceData]);

  // Derive unique Role options
  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    allActiveUsers.forEach((u: any) => {
      const rName = u.role?.displayName || u.role?.name;
      if (rName) set.add(rName);
    });
    attendanceList.forEach((a: any) => {
      if (a.user?.roleName && a.user.roleName !== "N/A") set.add(a.user.roleName);
    });
    return Array.from(set).sort().map((r) => ({ value: r, label: r }));
  }, [allActiveUsers, attendanceList]);

  // Derive unique Department options
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    allActiveUsers.forEach((u: any) => {
      const dName = u.profile?.department?.name;
      if (dName) set.add(dName);
    });
    attendanceList.forEach((a: any) => {
      if (a.user?.departmentName && a.user.departmentName !== "N/A") set.add(a.user.departmentName);
    });
    return Array.from(set).sort().map((d) => ({ value: d, label: d }));
  }, [allActiveUsers, attendanceList]);

  // Employee Dropdown Options
  const employeeOptions = useMemo(() => {
    return [...allActiveUsers]
      .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""))
      .map((u: any) => ({
        value: String(u.id),
        label: `${u.name} (${u.email || u.username})`,
      }));
  }, [allActiveUsers]);

  // Time & Duration Calculation Helper
  const parseTime = (timeStr: string | null | undefined, dateStr: string) => {
    if (!timeStr) return null;
    let m = moment(`${dateStr} ${timeStr}`, [
      "YYYY-MM-DD HH:mm:ss a",
      "YYYY-MM-DD hh:mm:ss a",
      "YYYY-MM-DD HH:mm:ss",
      "YYYY-MM-DD HH:mm",
    ]);
    if (!m.isValid()) {
      m = moment(timeStr, ["HH:mm:ss a", "hh:mm:ss a", "HH:mm:ss", "HH:mm"]);
    }
    return m.isValid() ? m : null;
  };

  const calculateDuration = (clockIn: string | null | undefined, clockOut: string | null | undefined, dateStr: string) => {
    if (!clockIn || !clockOut) {
      return {
        text: clockIn ? "In Progress" : "N/A",
        minutes: 0,
        hours: 0,
        mins: 0,
        decimalHours: 0,
        isOvertime: false,
      };
    }
    const inMoment = parseTime(clockIn, dateStr);
    const outMoment = parseTime(clockOut, dateStr);
    if (!inMoment || !outMoment) {
      return { text: "N/A", minutes: 0, hours: 0, mins: 0, decimalHours: 0, isOvertime: false };
    }

    let diffMinutes = outMoment.diff(inMoment, "minutes");
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Cross midnight edge case

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const decimalHours = Number((diffMinutes / 60).toFixed(2));
    const isOvertime = diffMinutes > 8 * 60;

    return {
      text: `${hours}h ${mins}m`,
      minutes: diffMinutes,
      hours,
      mins,
      decimalHours,
      isOvertime,
    };
  };

  // Enriched Attendance Data with calculated fields
  const enrichedAttendance = useMemo(() => {
    return attendanceList.map((item: any) => {
      const dateStr = item.date || dayjs().format("YYYY-MM-DD");
      const durationInfo = calculateDuration(item.clockIn, item.clockOut, dateStr);

      const dayOfWeek = dayjs(dateStr).isValid() ? dayjs(dateStr).format("dddd") : "-";

      const hasClockIn = Boolean(item.clockIn);
      const hasClockOut = Boolean(item.clockOut);

      let attendanceStatus = "Absent / Not Clocked";
      if (hasClockIn && hasClockOut) {
        attendanceStatus = "Completed";
      } else if (hasClockIn && !hasClockOut) {
        attendanceStatus = "In-Progress / Missing Out";
      }

      // Location map link
      const hasLocation =
        item.latitude &&
        item.longitude &&
        item.latitude !== "null" &&
        item.longitude !== "null";
      const locationMapLink = hasLocation
        ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
        : "-";

      // Worklogs info
      const approvedMinutes = item.worklogs?.approved?.total || 0;
      const requestedMinutes = item.worklogs?.requested?.total || 0;
      const rejectedMinutes = item.worklogs?.rejected?.total || 0;

      const approvedHoursStr = item.worklogs?.approved?.hours || "0h 0m";
      const requestedHoursStr = item.worklogs?.requested?.hours || "0h 0m";
      const rejectedHoursStr = item.worklogs?.rejected?.hours || "0h 0m";

      const allWorklogItems = item.worklogs?.all || [];
      const projectNames = item.worklogs?.projectNames || [];
      const projectsWorkedStr = projectNames.length > 0 ? projectNames.join(", ") : "-";

      // Variance between worklog and clock duration
      const varianceMinutes = approvedMinutes - durationInfo.minutes;
      const varianceHours = (varianceMinutes / 60).toFixed(1);
      const varianceStr = durationInfo.minutes > 0 ? `${varianceHours > "0" ? "+" : ""}${varianceHours} hrs` : "-";

      return {
        ...item,
        rawId: item.id || `${item.userId}_${item.date}`,
        date: dateStr,
        dayOfWeek,
        employeeName: item.user?.name || "Unknown Employee",
        username: item.user?.username || "-",
        email: item.user?.email || "-",
        phoneNumber: item.user?.phoneNumber || "-",
        role: item.user?.roleName || "No Role",
        department: item.user?.departmentName || "No Department",
        accountStatus: item.user?.status ? String(item.user.status).toUpperCase() : "ACTIVE",
        clockInTime: item.clockIn || "-",
        clockOutTime: item.clockOut || "-",
        durationText: durationInfo.text,
        durationMinutes: durationInfo.minutes,
        durationHoursDecimal: durationInfo.decimalHours,
        isOvertime: durationInfo.isOvertime,
        attendanceStatus,
        locationMapLink,
        hasLocation,
        approvedWorklogHours: approvedHoursStr,
        approvedWorklogMinutes: approvedMinutes,
        requestedWorklogHours: requestedHoursStr,
        rejectedWorklogHours: rejectedHoursStr,
        worklogTaskCount: allWorklogItems.length,
        worklogProjects: projectsWorkedStr,
        worklogVsAttendanceVariance: varianceStr,
        intermediatePunchesCount: Array.isArray(item.history) ? item.history.length : 0,
        worklogsRaw: allWorklogItems,
      };
    });
  }, [attendanceList]);

  // Filter enriched records based on Scope, Employee, Department, Role, and Status
  const filteredAttendance = useMemo(() => {
    let list = [...enrichedAttendance];

    // Employee scope filter
    if (employeeScope === "specific" && selectedEmployeeIds.length > 0) {
      list = list.filter((r) => selectedEmployeeIds.includes(String(r.userId)));
    }

    // Role filter
    if (selectedRoles.length > 0) {
      list = list.filter((r) => selectedRoles.includes(r.role));
    }

    // Department filter
    if (selectedDepartments.length > 0) {
      list = list.filter((r) => selectedDepartments.includes(r.department));
    }

    // Status filter
    if (statusFilter === "completed") {
      list = list.filter((r) => r.attendanceStatus === "Completed");
    } else if (statusFilter === "incomplete") {
      list = list.filter((r) => r.attendanceStatus === "In-Progress / Missing Out");
    }

    return list;
  }, [enrichedAttendance, employeeScope, selectedEmployeeIds, selectedRoles, selectedDepartments, statusFilter]);

  // Preview table items filtered by preview search input
  const previewItems = useMemo(() => {
    if (!previewSearch.trim()) return filteredAttendance;
    const q = previewSearch.trim().toLowerCase();
    return filteredAttendance.filter((r: any) => {
      const name = (r.employeeName || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const date = (r.date || "").toLowerCase();
      const role = (r.role || "").toLowerCase();
      const dept = (r.department || "").toLowerCase();
      const clockInR = (r.clockInRemark || "").toLowerCase();
      const clockOutR = (r.clockOutRemark || "").toLowerCase();
      const projects = (r.worklogProjects || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        date.includes(q) ||
        role.includes(q) ||
        dept.includes(q) ||
        clockInR.includes(q) ||
        clockOutR.includes(q) ||
        projects.includes(q)
      );
    });
  }, [filteredAttendance, previewSearch]);

  // Summary Metrics
  const uniqueEmployeeCount = useMemo(() => {
    const set = new Set<string>();
    filteredAttendance.forEach((r) => {
      if (r.userId) set.add(String(r.userId));
    });
    return set.size;
  }, [filteredAttendance]);

  const totalClockMinutes = useMemo(() => {
    return filteredAttendance.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
  }, [filteredAttendance]);

  const totalClockHoursStr = useMemo(() => {
    const h = Math.floor(totalClockMinutes / 60);
    const m = totalClockMinutes % 60;
    return `${h}h ${m}m`;
  }, [totalClockMinutes]);

  const totalApprovedMinutes = useMemo(() => {
    return filteredAttendance.reduce((sum, r) => sum + (r.approvedWorklogMinutes || 0), 0);
  }, [filteredAttendance]);

  const totalApprovedHoursStr = useMemo(() => {
    const h = Math.floor(totalApprovedMinutes / 60);
    const m = totalApprovedMinutes % 60;
    return `${h}h ${m}m`;
  }, [totalApprovedMinutes]);

  // Helper to create worksheets with auto-calculated column widths
  const createSheetWithColWidths = (data: any[], fallbackHeaders?: string[]) => {
    let ws: XLSX.WorkSheet;
    if (!data || data.length === 0) {
      ws = XLSX.utils.json_to_sheet(
        fallbackHeaders ? [fallbackHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {})] : [{ Info: "No Records" }]
      );
      return ws;
    }
    ws = XLSX.utils.json_to_sheet(data);

    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map((key) => {
      let maxLen = key.length;
      data.forEach((row) => {
        const val = row[key];
        if (val !== null && val !== undefined) {
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = Math.min(str.length, 55);
          }
        }
      });
      return { wch: Math.max(maxLen + 3, 12) };
    });
    ws["!cols"] = colWidths;
    return ws;
  };

  // Execute Excel Export
  const handleExportExcel = () => {
    if (filteredAttendance.length === 0) {
      message.warning("No attendance records match the selected filters to export.");
      return;
    }

    if (selectedFields.length === 0) {
      message.warning("Please select at least one column to export.");
      return;
    }

    const rangeLabel = queryStartDate && queryEndDate ? `${queryStartDate}_to_${queryEndDate}` : "all_records";
    const fileName = `Attendance_Export_${rangeLabel}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;

    // 1. Build Primary Attendance Details Sheet
    const orderedCols = ALL_ATTENDANCE_EXPORT_COLUMNS.filter((c) => selectedFields.includes(c.key));

    const primarySheetData = filteredAttendance.map((record: any, index: number) => {
      const row: Record<string, any> = {
        "S.N.": index + 1,
      };

      orderedCols.forEach((col) => {
        switch (col.key) {
          case "date":
            row[col.title] = record.date;
            break;
          case "dayOfWeek":
            row[col.title] = record.dayOfWeek;
            break;
          case "clockIn":
            row[col.title] = record.clockInTime;
            break;
          case "clockInRemark":
            row[col.title] = record.clockInRemark || "-";
            break;
          case "clockOut":
            row[col.title] = record.clockOutTime;
            break;
          case "clockOutRemark":
            row[col.title] = record.clockOutRemark || "-";
            break;
          case "duration":
            row[col.title] = record.durationText;
            break;
          case "durationHoursDecimal":
            row[col.title] = record.durationHoursDecimal;
            break;
          case "attendanceStatus":
            row[col.title] = record.attendanceStatus;
            break;
          case "isOvertime":
            row[col.title] = record.isOvertime ? "Yes (Overtime)" : "Standard";
            break;
          case "employeeName":
            row[col.title] = record.employeeName;
            break;
          case "username":
            row[col.title] = record.username;
            break;
          case "email":
            row[col.title] = record.email;
            break;
          case "phoneNumber":
            row[col.title] = record.phoneNumber;
            break;
          case "role":
            row[col.title] = record.role;
            break;
          case "department":
            row[col.title] = record.department;
            break;
          case "accountStatus":
            row[col.title] = record.accountStatus;
            break;
          case "approvedWorklogHours":
            row[col.title] = record.approvedWorklogHours;
            break;
          case "requestedWorklogHours":
            row[col.title] = record.requestedWorklogHours;
            break;
          case "rejectedWorklogHours":
            row[col.title] = record.rejectedWorklogHours;
            break;
          case "worklogTaskCount":
            row[col.title] = record.worklogTaskCount;
            break;
          case "worklogProjects":
            row[col.title] = record.worklogProjects;
            break;
          case "worklogVsAttendanceVariance":
            row[col.title] = record.worklogVsAttendanceVariance;
            break;
          case "latitude":
            row[col.title] = record.latitude || "-";
            break;
          case "longitude":
            row[col.title] = record.longitude || "-";
            break;
          case "locationMapLink":
            row[col.title] = record.locationMapLink;
            break;
          case "intermediatePunchesCount":
            row[col.title] = record.intermediatePunchesCount;
            break;
          default:
            row[col.title] = record[col.key] || "-";
        }
      });

      return row;
    });

    // 2. Build Sheet 2: Employee Attendance & Workhour Summary
    const employeeSummaryMap = new Map<string, any>();
    filteredAttendance.forEach((record: any) => {
      const uId = String(record.userId);
      if (!employeeSummaryMap.has(uId)) {
        employeeSummaryMap.set(uId, {
          userId: uId,
          name: record.employeeName,
          email: record.email,
          role: record.role,
          department: record.department,
          daysPresent: 0,
          totalClockMinutes: 0,
          completedDays: 0,
          missingClockOutDays: 0,
          overtimeDays: 0,
          totalApprovedMinutes: 0,
          totalRequestedMinutes: 0,
        });
      }

      const emp = employeeSummaryMap.get(uId)!;
      emp.daysPresent += 1;
      emp.totalClockMinutes += record.durationMinutes || 0;
      if (record.attendanceStatus === "Completed") emp.completedDays += 1;
      if (record.attendanceStatus === "In-Progress / Missing Out") emp.missingClockOutDays += 1;
      if (record.isOvertime) emp.overtimeDays += 1;
      emp.totalApprovedMinutes += record.approvedWorklogMinutes || 0;
      emp.totalRequestedMinutes += (record.worklogs?.requested?.total || 0);
    });

    const summaryRows = Array.from(employeeSummaryMap.values()).map((emp: any, idx: number) => {
      const totalClockHours = (emp.totalClockMinutes / 60).toFixed(1);
      const avgHoursPerDay = emp.daysPresent > 0 ? (emp.totalClockMinutes / emp.daysPresent / 60).toFixed(1) : "0.0";
      const totalApprovedHours = (emp.totalApprovedMinutes / 60).toFixed(1);
      const totalRequestedHours = (emp.totalRequestedMinutes / 60).toFixed(1);

      return {
        "S.N.": idx + 1,
        "Employee Name": emp.name,
        "Email Address": emp.email,
        "Role / Designation": emp.role,
        "Department": emp.department,
        "Days Present": emp.daysPresent,
        "Total Clocked Time": `${Math.floor(emp.totalClockMinutes / 60)}h ${emp.totalClockMinutes % 60}m`,
        "Total Hours (Decimal)": Number(totalClockHours),
        "Avg Clocked Hrs/Day": Number(avgHoursPerDay),
        "Completed Days (In & Out)": emp.completedDays,
        "Missing Clock-Out Days": emp.missingClockOutDays,
        "Overtime Days (>8h)": emp.overtimeDays,
        "Approved Worklog Time": `${Math.floor(emp.totalApprovedMinutes / 60)}h ${emp.totalApprovedMinutes % 60}m`,
        "Approved Worklog Hrs (Decimal)": Number(totalApprovedHours),
        "Requested Worklog Hrs (Decimal)": Number(totalRequestedHours),
      };
    });

    // 3. Build Sheet 3: Detailed Task Worklogs & Projects Mapping
    const detailedWorklogRows: any[] = [];
    filteredAttendance.forEach((record: any) => {
      const dayWorklogs = record.worklogsRaw || [];
      if (dayWorklogs.length > 0) {
        dayWorklogs.forEach((w: any) => {
          const wDurationMin = w.startTime && w.endTime ? moment(w.endTime).diff(moment(w.startTime), "minutes") : 0;
          const wHours = Math.floor(wDurationMin / 60);
          const wMins = wDurationMin % 60;

          detailedWorklogRows.push({
            "S.N.": detailedWorklogRows.length + 1,
            "Date": record.date,
            "Day": record.dayOfWeek,
            "Employee Name": record.employeeName,
            "Role": record.role,
            "Project Name": w.project?.name || w.task?.project?.name || "-",
            "Project Code": w.project?.code || w.task?.project?.code || "-",
            "Task Title": w.task?.title || w.task?.name || "-",
            "Task Type": w.task?.taskType ? String(w.task.taskType).toUpperCase() : "-",
            "Start Time": w.startTime ? moment(w.startTime).utcOffset("+05:45").format("hh:mm a") : "-",
            "End Time": w.endTime ? moment(w.endTime).utcOffset("+05:45").format("hh:mm a") : "-",
            "Logged Duration": `${wHours}h ${wMins}m`,
            "Status": w.status ? String(w.status).toUpperCase() : "-",
            "Approval Remark": w.approvedRemark || w.rejectedRemark || "-",
            "Work Description": w.remark || w.description || "-",
          });
        });
      } else {
        detailedWorklogRows.push({
          "S.N.": detailedWorklogRows.length + 1,
          "Date": record.date,
          "Day": record.dayOfWeek,
          "Employee Name": record.employeeName,
          "Role": record.role,
          "Project Name": "No Worklogs Logged",
          "Project Code": "-",
          "Task Title": "-",
          "Task Type": "-",
          "Start Time": "-",
          "End Time": "-",
          "Logged Duration": "0h 0m",
          "Status": "-",
          "Approval Remark": "-",
          "Work Description": "Employee clocked attendance without task worklogs",
        });
      }
    });

    const workbook = XLSX.utils.book_new();
    const primaryWorksheet = createSheetWithColWidths(primarySheetData);
    const summaryWorksheet = createSheetWithColWidths(summaryRows);
    const worklogWorksheet = createSheetWithColWidths(detailedWorklogRows);

    XLSX.utils.book_append_sheet(workbook, primaryWorksheet, "Attendance Records");
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Employee Period Summary");
    XLSX.utils.book_append_sheet(workbook, worklogWorksheet, "Detailed Worklogs & Tasks");

    XLSX.writeFile(workbook, fileName);
    message.success(`Successfully exported ${filteredAttendance.length} attendance records to Excel!`);
  };

  // Visible filtered column list for Column Selector card
  const visibleColumnPills = useMemo(() => {
    if (activeCategoryTab === "All") return ALL_ATTENDANCE_EXPORT_COLUMNS;
    return ALL_ATTENDANCE_EXPORT_COLUMNS.filter((c) => c.category === activeCategoryTab);
  }, [activeCategoryTab]);

  // Clean, focused columns for Live Data Preview (NO horizontal overflow clutter / junkies!)
  const previewColumns = useMemo(() => {
    return [
      {
        title: "Employee",
        dataIndex: "employeeName",
        key: "employeeName",
        width: 220,
        render: (_: string, record: any) => (
          <div className="flex items-center gap-2.5">
            <Avatar
              size={32}
              style={{
                backgroundColor: record.accountStatus === "ACTIVE" ? "#1677ff" : "#94a3b8",
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {record.employeeName ? record.employeeName.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <div className="min-w-0">
              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }} className="truncate">
                {record.employeeName}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }} className="truncate">
                {record.email}
              </div>
              <Tag color="blue" style={{ fontSize: 10, marginTop: 2, padding: "0 4px" }}>
                {record.role}
              </Tag>
            </div>
          </div>
        ),
      },
      {
        title: "Date & Day",
        dataIndex: "date",
        key: "date",
        width: 140,
        render: (date: string, record: any) => (
          <div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}>
              {dayjs(date).isValid() ? dayjs(date).format("MMM DD, YYYY") : date}
            </div>
            <Tag color="cyan" style={{ fontSize: 10, marginTop: 2 }}>
              {record.dayOfWeek}
            </Tag>
          </div>
        ),
      },
      {
        title: "Punch Timings",
        key: "punchTimings",
        width: 170,
        render: (_: any, record: any) => (
          <div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#16a34a" }}>
              <ClockCircleOutlined />
              <span style={{ fontWeight: 600 }}>In:</span> {record.clockInTime}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 11, color: record.clockOutTime !== "-" ? "#6366f1" : "#d97706" }}>
              <ClockCircleOutlined />
              <span style={{ fontWeight: 600 }}>Out:</span> {record.clockOutTime !== "-" ? record.clockOutTime : "Pending Out"}
            </div>
            {(record.clockInRemark || record.clockOutRemark) && (
              <Tooltip title={`In Remark: ${record.clockInRemark || "None"} | Out Remark: ${record.clockOutRemark || "None"}`}>
                <div style={{ fontSize: 10, color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>
                  View remarks
                </div>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        title: "Clock Duration",
        key: "duration",
        width: 140,
        render: (_: any, record: any) => (
          <div>
            <span style={{ fontWeight: 700, color: "#1e3a8a", fontSize: 13 }}>
              {record.durationText}
            </span>
            {record.isOvertime && (
              <div style={{ marginTop: 2 }}>
                <Tag color="orange" style={{ fontSize: 10, padding: "0 4px" }}>
                  Overtime (&gt;8h)
                </Tag>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Worklogs Summary",
        key: "worklogsSummary",
        width: 180,
        render: (_: any, record: any) => (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>
              ✓ {record.approvedWorklogHours} approved
            </div>
            {record.worklogTaskCount > 0 ? (
              <Tooltip title={record.worklogProjects}>
                <div style={{ fontSize: 11, color: "#64748b" }} className="truncate max-w-[170px]">
                  {record.worklogTaskCount} tasks | {record.worklogProjects}
                </div>
              </Tooltip>
            ) : (
              <div style={{ fontSize: 11, color: "#94a3b8" }}>No worklogs</div>
            )}
          </div>
        ),
      },
      {
        title: "Status & Location",
        key: "statusLocation",
        width: 160,
        render: (_: any, record: any) => (
          <div className="flex items-center justify-between">
            <Tag
              color={record.attendanceStatus === "Completed" ? "green" : "orange"}
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              {record.attendanceStatus === "Completed" ? "COMPLETED" : "IN-PROGRESS"}
            </Tag>

            {record.hasLocation ? (
              <Tooltip title="View Clock-In GPS on Google Maps">
                <Button
                  type="link"
                  icon={<EnvironmentOutlined style={{ color: "#2563eb", fontSize: 15 }} />}
                  onClick={() => window.open(record.locationMapLink, "_blank")}
                  size="small"
                  style={{ padding: 0 }}
                />
              </Tooltip>
            ) : (
              <span style={{ fontSize: 11, color: "#cbd5e1" }}>No GPS</span>
            )}
          </div>
        ),
      },
    ];
  }, []);

  return (
    <div className="pb-16 sm:pb-0 px-2 sm:px-0">
      {/* Top Header Bar matching UserExportPage & ProjectExportPage */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Space size={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="large">
            Back to Attendance
          </Button>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
              Attendance Records & Analysis Export Helper
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
              Filter by date ranges, employees, departments, and export multi-sheet analysis workbooks
            </div>
          </div>
        </Space>
      </div>

      {/* 2-Column Main Section */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Scope & Filter Controls */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Card 1: Date Range & Preset Scope */}
            <Card
              title={
                <Space>
                  <CalendarOutlined className="text-blue-600" />
                  <span style={{ fontWeight: 600 }}>1. Select Date Range & Period Scope</span>
                </Space>
              }
              size="small"
              style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Quick Date Presets:
                </div>
                <Segmented
                  options={[
                    { label: "This Month", value: "this_month" },
                    { label: "Last Month", value: "last_month" },
                    { label: "Today", value: "today" },
                    { label: "Last 7 Days", value: "last_7_days" },
                    { label: "Last 30 Days", value: "last_30_days" },
                    { label: "Custom Range", value: "custom" },
                    { label: "All Time", value: "all" },
                  ]}
                  value={datePreset}
                  onChange={(val) => setDatePreset(val as DatePreset)}
                  block
                  style={{ marginBottom: 12 }}
                />
              </div>

              {datePreset === "this_month" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Choose Month:</span>
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={(m) => m && setSelectedMonth(m)}
                    format="MMMM YYYY"
                    allowClear={false}
                    style={{ width: 200 }}
                  />
                </div>
              )}

              {datePreset === "custom" && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: 4 }}>Select Start & End Date:</div>
                  <RangePicker
                    value={customRange}
                    onChange={(dates) => {
                      if (dates) setCustomRange([dates[0], dates[1]]);
                    }}
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD"
                  />
                </div>
              )}

              {/* Employee & Department Filters */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                <Row gutter={[16, 12]}>
                  {/* Scope Radio Selector */}
                  <Col span={24}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                      Employee Scope:
                    </div>
                    <Radio.Group
                      value={employeeScope}
                      onChange={(e) => setEmployeeScope(e.target.value)}
                      className="w-full"
                    >
                      <Row gutter={8}>
                        <Col span={12}>
                          <Radio.Button value="all" className="w-full text-center">
                            All Active Employees
                          </Radio.Button>
                        </Col>
                        <Col span={12}>
                          <Radio.Button value="specific" className="w-full text-center">
                            Specific Employee(s)
                          </Radio.Button>
                        </Col>
                      </Row>
                    </Radio.Group>
                  </Col>

                  {/* Multi-select Employees if specific scope */}
                  {employeeScope === "specific" && (
                    <Col span={24}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                        Select Employee(s):
                      </div>
                      <Select
                        mode="multiple"
                        placeholder="Search & choose employees..."
                        value={selectedEmployeeIds}
                        onChange={setSelectedEmployeeIds}
                        options={employeeOptions}
                        allowClear
                        style={{ width: "100%" }}
                        maxTagCount="responsive"
                      />
                    </Col>
                  )}

                  {/* Filter by Department */}
                  <Col span={12}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                      Department:
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

                  {/* Filter by Role */}
                  <Col span={12}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                      Role:
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

                  {/* Attendance Status Filter */}
                  <Col span={24}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                        Attendance Punch Status:
                      </span>
                      <Segmented
                        options={[
                          { label: "All Records", value: "all" },
                          { label: "Completed (In & Out)", value: "completed" },
                          { label: "Incomplete (Missing Out)", value: "incomplete" },
                        ]}
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val as any)}
                        size="small"
                      />
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Space>
        </Col>

        {/* Right Column: Live Summary & Column Field Checkboxes */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Live Summary Card matching ProjectExportPage & UserExportPage */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm" size="small">
              <Row gutter={16} align="middle">
                <Col span={14}>
                  <Statistic
                    title="Attendance Records Matching Filters"
                    value={filteredAttendance.length}
                    suffix={`/ ${attendanceList.length}`}
                    prefix={<CheckCircleOutlined style={{ color: "#1677ff" }} />}
                    valueStyle={{ color: "#1e3a8a", fontWeight: 700 }}
                  />
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: 4 }}>
                    Employees: {uniqueEmployeeCount} | Total Duration: {totalClockHoursStr} | Approved Worklogs: {totalApprovedHoursStr}
                  </div>
                </Col>
                <Col span={10} style={{ textAlign: "right" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    disabled={filteredAttendance.length === 0}
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

            {/* 2. Select Columns to Export Card */}
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
                    <Button size="small" type="link" onClick={handleResetFields} style={{ padding: 0 }}>
                      Reset
                    </Button>
                  </Space>
                </div>
              }
              size="small"
              style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            >
              {/* Category Segmented Filter */}
              <Segmented
                options={["All", "Timing", "Employee", "Worklogs", "Location"]}
                value={activeCategoryTab}
                onChange={(val) => setActiveCategoryTab(val as string)}
                block
                size="small"
                style={{ marginBottom: 12 }}
              />

              {/* Checkable Column Pills Grid */}
              <Row gutter={[8, 8]} style={{ maxHeight: "250px", overflowY: "auto", paddingRight: 4 }}>
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
              placeholder="Search preview by employee, date, role, dept, project..."
              value={previewSearch}
              onChange={(e) => setPreviewSearch(e.target.value)}
              allowClear
              style={{ width: 320 }}
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
          rowKey={(record) => record.rawId}
          size="small"
          loading={isLoadingAttendance}
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["8", "15", "30", "50"],
            onShowSizeChange: (_curr, size) => {
              setPageSize(size);
              saveAttendancePagination(size);
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} attendance records`,
          }}
        />
      </Card>
    </div>
  );
};

export default AttendanceExportPage;

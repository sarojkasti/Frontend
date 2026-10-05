export interface AttendanceColumnDefinition {
  key: string;
  title: string;
  category: "Timing" | "Employee" | "Worklogs" | "Location";
  description?: string;
  defaultVisible: boolean;
  required?: boolean;
  defaultWidth?: number;
}

export const ALL_ATTENDANCE_EXPORT_COLUMNS: AttendanceColumnDefinition[] = [
  // --- Category 1: Attendance Timing ---
  {
    key: "date",
    title: "Attendance Date",
    category: "Timing",
    description: "Date of attendance (YYYY-MM-DD)",
    defaultVisible: true,
    required: true,
    defaultWidth: 140,
  },
  {
    key: "dayOfWeek",
    title: "Day of Week",
    category: "Timing",
    description: "Day name (Monday, Tuesday, etc.)",
    defaultVisible: true,
    defaultWidth: 120,
  },
  {
    key: "clockIn",
    title: "Clock In Time",
    category: "Timing",
    description: "Official time the employee clocked in",
    defaultVisible: true,
    required: true,
    defaultWidth: 130,
  },
  {
    key: "clockInRemark",
    title: "Clock In Remark",
    category: "Timing",
    description: "Remark or note entered at clock in",
    defaultVisible: true,
    defaultWidth: 180,
  },
  {
    key: "clockOut",
    title: "Clock Out Time",
    category: "Timing",
    description: "Official time the employee clocked out",
    defaultVisible: true,
    defaultWidth: 130,
  },
  {
    key: "clockOutRemark",
    title: "Clock Out Remark",
    category: "Timing",
    description: "Remark or note entered at clock out",
    defaultVisible: true,
    defaultWidth: 180,
  },
  {
    key: "duration",
    title: "Total Clock Duration",
    category: "Timing",
    description: "Calculated duration between clock-in and clock-out (hours & mins)",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "durationHoursDecimal",
    title: "Duration (Decimal Hours)",
    category: "Timing",
    description: "Duration formatted as decimal hours (e.g., 8.5 hrs)",
    defaultVisible: false,
    defaultWidth: 150,
  },
  {
    key: "attendanceStatus",
    title: "Attendance Status",
    category: "Timing",
    description: "Completed (In & Out), In-Progress / Missing Out, or Absent",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "isOvertime",
    title: "Overtime Flag (>8h)",
    category: "Timing",
    description: "Whether duration exceeded standard 8 hours",
    defaultVisible: true,
    defaultWidth: 140,
  },

  // --- Category 2: Employee Information ---
  {
    key: "employeeName",
    title: "Employee Full Name",
    category: "Employee",
    description: "Full name of the employee",
    defaultVisible: true,
    required: true,
    defaultWidth: 180,
  },
  {
    key: "username",
    title: "Username",
    category: "Employee",
    description: "System login username",
    defaultVisible: false,
    defaultWidth: 130,
  },
  {
    key: "email",
    title: "Email Address",
    category: "Employee",
    description: "Employee primary email address",
    defaultVisible: true,
    defaultWidth: 200,
  },
  {
    key: "phoneNumber",
    title: "Phone Number",
    category: "Employee",
    description: "Employee telephone / mobile number",
    defaultVisible: false,
    defaultWidth: 140,
  },
  {
    key: "role",
    title: "Role / Designation",
    category: "Employee",
    description: "System permission role or job designation",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "department",
    title: "Department",
    category: "Employee",
    description: "Department assigned in employee profile",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "accountStatus",
    title: "Account Status",
    category: "Employee",
    description: "Active, Inactive, or Blocked status of user",
    defaultVisible: false,
    defaultWidth: 120,
  },

  // --- Category 3: Worklog Integration ---
  {
    key: "approvedWorklogHours",
    title: "Approved Worklog Time",
    category: "Worklogs",
    description: "Total worklog time approved by leads/managers on this date",
    defaultVisible: true,
    defaultWidth: 160,
  },
  {
    key: "requestedWorklogHours",
    title: "Requested Worklog Time",
    category: "Worklogs",
    description: "Total worklog time pending approval on this date",
    defaultVisible: true,
    defaultWidth: 160,
  },
  {
    key: "rejectedWorklogHours",
    title: "Rejected Worklog Time",
    category: "Worklogs",
    description: "Worklog time rejected on this date",
    defaultVisible: false,
    defaultWidth: 150,
  },
  {
    key: "worklogTaskCount",
    title: "Tasks Worked Count",
    category: "Worklogs",
    description: "Count of distinct tasks logged on this date",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "worklogProjects",
    title: "Projects Worked On",
    category: "Worklogs",
    description: "List of project names logged on this date",
    defaultVisible: true,
    defaultWidth: 220,
  },
  {
    key: "worklogVsAttendanceVariance",
    title: "Variance (Worklog vs Clock)",
    category: "Worklogs",
    description: "Difference between logged task hours and clocked duration",
    defaultVisible: false,
    defaultWidth: 180,
  },

  // --- Category 4: Location & Verification ---
  {
    key: "latitude",
    title: "Clock-In Latitude",
    category: "Location",
    description: "Geographic latitude coordinate at clock in",
    defaultVisible: false,
    defaultWidth: 140,
  },
  {
    key: "longitude",
    title: "Clock-In Longitude",
    category: "Location",
    description: "Geographic longitude coordinate at clock in",
    defaultVisible: false,
    defaultWidth: 140,
  },
  {
    key: "locationMapLink",
    title: "Google Maps Location Link",
    category: "Location",
    description: "Clickable Google Maps link for punch coordinate",
    defaultVisible: true,
    defaultWidth: 220,
  },
  {
    key: "intermediatePunchesCount",
    title: "Breaks / Punch Logs Count",
    category: "Location",
    description: "Count of intermediate punch history records",
    defaultVisible: false,
    defaultWidth: 160,
  },
];

export const LS_ATTENDANCE_EXPORT_COLUMNS_KEY = "artha_attendance_export_columns_v1";
export const LS_ATTENDANCE_PAGINATION_KEY = "artha_attendance_export_pagination_v1";

export const getSavedAttendanceExportColumns = (): string[] => {
  try {
    const saved = localStorage.getItem(LS_ATTENDANCE_EXPORT_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = ALL_ATTENDANCE_EXPORT_COLUMNS.map((c) => c.key);
        const filtered = parsed.filter((k) => validKeys.includes(k));
        if (filtered.length > 0) {
          if (!filtered.includes("employeeName")) filtered.unshift("employeeName");
          if (!filtered.includes("date")) filtered.unshift("date");
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load saved attendance export columns:", e);
  }
  return ALL_ATTENDANCE_EXPORT_COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key);
};

export const saveAttendanceExportColumns = (keys: string[]): void => {
  try {
    localStorage.setItem(LS_ATTENDANCE_EXPORT_COLUMNS_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save attendance export columns:", e);
  }
};

export const getSavedAttendancePagination = (defaultSize = 8): number => {
  try {
    const saved = localStorage.getItem(LS_ATTENDANCE_PAGINATION_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load saved attendance pagination:", e);
  }
  return defaultSize;
};

export const saveAttendancePagination = (size: number): void => {
  try {
    localStorage.setItem(LS_ATTENDANCE_PAGINATION_KEY, String(size));
  } catch (e) {
    console.error("Failed to save attendance pagination:", e);
  }
};

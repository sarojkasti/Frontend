export interface UserColumnDefinition {
  key: string;
  title: string;
  category: "Account" | "Profile" | "Bank" | "Work Hours";
  description?: string;
  defaultVisible: boolean;
  required?: boolean;
  defaultWidth?: number;
}

export const ALL_USER_EXPORT_COLUMNS: UserColumnDefinition[] = [
  // --- Category 1: Account & System ---
  {
    key: "name",
    title: "Employee Full Name",
    category: "Account",
    description: "Legal full name of the user / employee",
    defaultVisible: true,
    required: true,
    defaultWidth: 180,
  },
  {
    key: "username",
    title: "Username",
    category: "Account",
    description: "System login username",
    defaultVisible: true,
    defaultWidth: 140,
  },
  {
    key: "email",
    title: "Email Address",
    category: "Account",
    description: "Official / primary email address",
    defaultVisible: true,
    defaultWidth: 200,
  },
  {
    key: "phoneNumber",
    title: "Phone Number",
    category: "Account",
    description: "Primary telephone / mobile number",
    defaultVisible: true,
    defaultWidth: 140,
  },
  {
    key: "role",
    title: "Role / Designation",
    category: "Account",
    description: "System permission role and designation",
    defaultVisible: true,
    defaultWidth: 160,
  },
  {
    key: "status",
    title: "Account Status",
    category: "Account",
    description: "Active, Inactive, or Blocked status",
    defaultVisible: true,
    defaultWidth: 120,
  },
  {
    key: "hourlyRate",
    title: "Hourly Rate (NPR)",
    category: "Account",
    description: "Standard hourly billing / cost rate",
    defaultVisible: false,
    defaultWidth: 140,
  },
  {
    key: "createdAt",
    title: "Joining / Created Date",
    category: "Account",
    description: "Account registration or start date",
    defaultVisible: true,
    defaultWidth: 140,
  },
  {
    key: "lastActiveAt",
    title: "Last Active Time",
    category: "Account",
    description: "Timestamp of last system activity",
    defaultVisible: false,
    defaultWidth: 160,
  },
  {
    key: "isTwoFAEnabled",
    title: "2FA Status",
    category: "Account",
    description: "Whether Two-Factor Authentication is enabled",
    defaultVisible: false,
    defaultWidth: 120,
  },

  // --- Category 2: Personal Profile Details ---
  {
    key: "department",
    title: "Department",
    category: "Profile",
    description: "Department assigned in employee profile",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "gender",
    title: "Gender",
    category: "Profile",
    description: "Gender specified in personal profile",
    defaultVisible: false,
    defaultWidth: 110,
  },
  {
    key: "dateOfBirth",
    title: "Date of Birth",
    category: "Profile",
    description: "Employee date of birth",
    defaultVisible: false,
    defaultWidth: 130,
  },
  {
    key: "bloodGroup",
    title: "Blood Group",
    category: "Profile",
    description: "Blood group type (A+, B+, O+, etc.)",
    defaultVisible: false,
    defaultWidth: 110,
  },
  {
    key: "maritalStatus",
    title: "Marital Status",
    category: "Profile",
    description: "Single, Married, Divorced, etc.",
    defaultVisible: false,
    defaultWidth: 120,
  },
  {
    key: "panNo",
    title: "PAN Number",
    category: "Profile",
    description: "Permanent Account Number for tax",
    defaultVisible: false,
    defaultWidth: 140,
  },
  {
    key: "permanentAddress",
    title: "Permanent Address",
    category: "Profile",
    description: "State, district, locality permanent residence",
    defaultVisible: false,
    defaultWidth: 200,
  },
  {
    key: "temporaryAddress",
    title: "Temporary Address",
    category: "Profile",
    description: "Current / local living address",
    defaultVisible: false,
    defaultWidth: 200,
  },
  {
    key: "emergencyContact",
    title: "Emergency Contact Person",
    category: "Profile",
    description: "Guardian or designated emergency contact",
    defaultVisible: false,
    defaultWidth: 180,
  },
  {
    key: "emergencyPhone",
    title: "Emergency Phone",
    category: "Profile",
    description: "Emergency contact telephone number",
    defaultVisible: false,
    defaultWidth: 150,
  },

  // --- Category 3: Bank & Payroll Details ---
  {
    key: "bankName",
    title: "Bank Name",
    category: "Bank",
    description: "Official bank name for payroll",
    defaultVisible: false,
    defaultWidth: 160,
  },
  {
    key: "accountNo",
    title: "Bank Account No",
    category: "Bank",
    description: "Salary deposit account number",
    defaultVisible: false,
    defaultWidth: 160,
  },
  {
    key: "bankBranch",
    title: "Bank Branch",
    category: "Bank",
    description: "Branch location for bank account",
    defaultVisible: false,
    defaultWidth: 150,
  },
  {
    key: "isBankVerified",
    title: "Bank Verification",
    category: "Bank",
    description: "Whether bank details have been verified",
    defaultVisible: false,
    defaultWidth: 130,
  },

  // --- Category 4: Work Hours & Monthly Analysis ---
  {
    key: "expectedDailyHours",
    title: "Daily Expected Hours",
    category: "Work Hours",
    description: "Assigned daily working hours (e.g., 8 hrs)",
    defaultVisible: true,
    defaultWidth: 140,
  },
  {
    key: "monthlyWorklogHours",
    title: "Monthly Logged Hours",
    category: "Work Hours",
    description: "Total worklog hours submitted this month",
    defaultVisible: true,
    defaultWidth: 160,
  },
  {
    key: "monthlyAttendanceHours",
    title: "Monthly Attendance Hours",
    category: "Work Hours",
    description: "Total office clocked-in hours this month",
    defaultVisible: true,
    defaultWidth: 170,
  },
  {
    key: "daysWithWorklog",
    title: "Days Logged Work",
    category: "Work Hours",
    description: "Number of days with submitted worklogs",
    defaultVisible: true,
    defaultWidth: 140,
  },
  {
    key: "daysWithAttendance",
    title: "Days Clocked In",
    category: "Work Hours",
    description: "Number of days attendance was recorded",
    defaultVisible: false,
    defaultWidth: 140,
  },
  {
    key: "overtimeDays",
    title: "Overtime Days",
    category: "Work Hours",
    description: "Days where worklog exceeded expected hours",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "worklogExceedsAttendanceDays",
    title: "Discrepancy Days (Worklog > Clock)",
    category: "Work Hours",
    description: "Days where worklog hours exceeded clocked attendance",
    defaultVisible: false,
    defaultWidth: 180,
  },
  {
    key: "averageWorklogHoursPerDay",
    title: "Average Logged Hrs / Day",
    category: "Work Hours",
    description: "Daily average hours logged on active work days",
    defaultVisible: false,
    defaultWidth: 160,
  },
  {
    key: "assignedProjectsCount",
    title: "Assigned Projects Count",
    category: "Work Hours",
    description: "Total number of active projects assigned",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "assignedProjectsList",
    title: "Assigned Projects List",
    category: "Work Hours",
    description: "Names of all projects the user is assigned to",
    defaultVisible: false,
    defaultWidth: 220,
  },
];

export const LS_USER_EXPORT_COLUMNS_KEY = "artha_user_export_columns_v1";

export const getSavedUserExportColumns = (): string[] => {
  try {
    const saved = localStorage.getItem(LS_USER_EXPORT_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = ALL_USER_EXPORT_COLUMNS.map((c) => c.key);
        const filtered = parsed.filter((k) => validKeys.includes(k));
        if (filtered.length > 0) {
          if (!filtered.includes("name")) filtered.unshift("name");
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load saved user export columns:", e);
  }
  return ALL_USER_EXPORT_COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key);
};

export const saveUserExportColumns = (keys: string[]): void => {
  try {
    localStorage.setItem(LS_USER_EXPORT_COLUMNS_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save user export columns:", e);
  }
};

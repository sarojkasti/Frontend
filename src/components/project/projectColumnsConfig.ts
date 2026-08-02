export interface ColumnDefinition {
  key: string;
  title: string;
  defaultVisible: boolean;
  required?: boolean;
  defaultWidth?: number;
}

export const ALL_PROJECT_COLUMNS: ColumnDefinition[] = [
  { key: "name", title: "Project Name", defaultVisible: true, required: true, defaultWidth: 200 },
  { key: "natureOfWork", title: "Nature Of Project", defaultVisible: true, defaultWidth: 160 },
  { key: "client", title: "Client", defaultVisible: true, defaultWidth: 160 },
  { key: "projectManager", title: "Manager", defaultVisible: true, defaultWidth: 150 },
  { key: "projectLead", title: "Lead", defaultVisible: true, defaultWidth: 150 },
  { key: "startingDate", title: "Start Date", defaultVisible: true, defaultWidth: 130 },
  { key: "endingDate", title: "End Date", defaultVisible: true, defaultWidth: 130 },
  { key: "fiscalYear", title: "Fiscal Year", defaultVisible: true, defaultWidth: 110 },
  { key: "completion", title: "Completion", defaultVisible: true, defaultWidth: 160 },
  { key: "users", title: "Team Members", defaultVisible: true, defaultWidth: 150 },
  { key: "activeUsers", title: "Active Members", defaultVisible: true, defaultWidth: 150 },
  { key: "description", title: "Description", defaultVisible: false, defaultWidth: 220 },
  { key: "isPaymentDone", title: "Payment Status", defaultVisible: false, defaultWidth: 130 },
  { key: "countsForAvailability", title: "Counts Availability", defaultVisible: false, defaultWidth: 140 },
  { key: "allowSubtaskWorklog", title: "Subtask Worklog", defaultVisible: false, defaultWidth: 130 },
  { key: "action", title: "Action", defaultVisible: true, required: true, defaultWidth: 90 },
];

export const LS_COLUMNS_KEY = "artha_project_table_columns_v3";
export const LS_WIDTHS_KEY = "artha_project_table_column_widths_v1";
export const LS_PAGINATION_KEY = "artha_project_table_pagination_v1";

export const getSavedVisibleColumns = (): string[] => {
  try {
    const saved = localStorage.getItem(LS_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any removed keys (like status) and filter valid keys
        const validKeys = ALL_PROJECT_COLUMNS.map(c => c.key);
        const filtered = parsed.filter(k => validKeys.includes(k));
        if (filtered.length > 0) {
          // Ensure required columns like name and action are present
          if (!filtered.includes("name")) filtered.unshift("name");
          if (!filtered.includes("action")) filtered.push("action");
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load saved project table columns:", e);
  }
  return ALL_PROJECT_COLUMNS.filter(col => col.defaultVisible).map(col => col.key);
};

export const saveVisibleColumns = (keys: string[]): void => {
  try {
    localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save project table columns:", e);
  }
};

export const getSavedColumnWidths = (): Record<string, number> => {
  try {
    const saved = localStorage.getItem(LS_WIDTHS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load saved column widths:", e);
  }
  const defaults: Record<string, number> = {};
  ALL_PROJECT_COLUMNS.forEach(col => {
    defaults[col.key] = col.defaultWidth || 150;
  });
  return defaults;
};

export const saveColumnWidths = (widths: Record<string, number>): void => {
  try {
    localStorage.setItem(LS_WIDTHS_KEY, JSON.stringify(widths));
  } catch (e) {
    console.error("Failed to save column widths:", e);
  }
};

export const getSavedPageSize = (): number => {
  try {
    const saved = localStorage.getItem(LS_PAGINATION_KEY);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {
    console.error("Failed to load saved page size:", e);
  }
  return 10;
};

export const savePageSize = (size: number): void => {
  try {
    localStorage.setItem(LS_PAGINATION_KEY, size.toString());
  } catch (e) {
    console.error("Failed to save page size:", e);
  }
};

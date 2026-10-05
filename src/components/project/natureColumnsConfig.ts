export interface NatureColumnDefinition {
  key: string;
  title: string;
  category: "General" | "Group Info" | "Audit";
  description?: string;
  defaultVisible: boolean;
  required?: boolean;
  defaultWidth?: number;
}

export const ALL_NATURE_OF_WORK_EXPORT_COLUMNS: NatureColumnDefinition[] = [
  {
    key: "name",
    title: "Nature of Work Name",
    category: "General",
    description: "Official name of the project nature / type of work",
    defaultVisible: true,
    required: true,
    defaultWidth: 220,
  },
  {
    key: "shortName",
    title: "Short Code / Abbreviation",
    category: "General",
    description: "Abbreviated code or identifier (e.g. PV, CA, AUD)",
    defaultVisible: true,
    required: true,
    defaultWidth: 150,
  },
  {
    key: "status",
    title: "Status",
    category: "General",
    description: "Active or Inactive status",
    defaultVisible: true,
    defaultWidth: 120,
  },
  {
    key: "groupName",
    title: "Nature Group",
    category: "Group Info",
    description: "Assigned parent group category",
    defaultVisible: true,
    defaultWidth: 180,
  },
  {
    key: "groupRank",
    title: "Group Display Rank",
    category: "Group Info",
    description: "Ordering sequence index of the parent group",
    defaultVisible: false,
    defaultWidth: 140,
  },
  {
    key: "groupDescription",
    title: "Group Description",
    category: "Group Info",
    description: "Detailed description of the parent group",
    defaultVisible: false,
    defaultWidth: 220,
  },
  {
    key: "createdAt",
    title: "Created Date",
    category: "Audit",
    description: "Date when this nature of work was created",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "updatedAt",
    title: "Last Updated Date",
    category: "Audit",
    description: "Date of the last modification",
    defaultVisible: false,
    defaultWidth: 150,
  },
];

export const ALL_NATURE_GROUP_EXPORT_COLUMNS: NatureColumnDefinition[] = [
  {
    key: "name",
    title: "Group Name",
    category: "General",
    description: "Name of the nature of work group",
    defaultVisible: true,
    required: true,
    defaultWidth: 200,
  },
  {
    key: "description",
    title: "Group Description",
    category: "General",
    description: "Description or notes for this group",
    defaultVisible: true,
    defaultWidth: 240,
  },
  {
    key: "rank",
    title: "Display Rank / Priority",
    category: "General",
    description: "Ordering sequence integer value",
    defaultVisible: true,
    defaultWidth: 140,
  },
  {
    key: "naturesCount",
    title: "Project Types Count",
    category: "Group Info",
    description: "Total number of project natures assigned to this group",
    defaultVisible: true,
    defaultWidth: 160,
  },
  {
    key: "naturesList",
    title: "Assigned Project Types",
    category: "Group Info",
    description: "Comma-separated list of assigned nature of works",
    defaultVisible: true,
    defaultWidth: 280,
  },
  {
    key: "createdAt",
    title: "Created Date",
    category: "Audit",
    description: "Date when group was created",
    defaultVisible: true,
    defaultWidth: 150,
  },
  {
    key: "updatedAt",
    title: "Last Updated Date",
    category: "Audit",
    description: "Date of last modification",
    defaultVisible: false,
    defaultWidth: 150,
  },
];

export const LS_NATURE_EXPORT_COLUMNS_KEY = "artha_nature_export_columns_v1";
export const LS_NATURE_GROUP_EXPORT_COLUMNS_KEY = "artha_nature_group_export_columns_v1";
export const LS_NATURE_PAGINATION_KEY = "artha_nature_export_pagination_v1";

export const getSavedNatureExportColumns = (): string[] => {
  try {
    const saved = localStorage.getItem(LS_NATURE_EXPORT_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = ALL_NATURE_OF_WORK_EXPORT_COLUMNS.map((c) => c.key);
        const filtered = parsed.filter((k) => validKeys.includes(k));
        if (filtered.length > 0) {
          if (!filtered.includes("name")) filtered.unshift("name");
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load saved nature export columns:", e);
  }
  return ALL_NATURE_OF_WORK_EXPORT_COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key);
};

export const saveNatureExportColumns = (keys: string[]): void => {
  try {
    localStorage.setItem(LS_NATURE_EXPORT_COLUMNS_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save nature export columns:", e);
  }
};

export const getSavedNatureGroupExportColumns = (): string[] => {
  try {
    const saved = localStorage.getItem(LS_NATURE_GROUP_EXPORT_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = ALL_NATURE_GROUP_EXPORT_COLUMNS.map((c) => c.key);
        const filtered = parsed.filter((k) => validKeys.includes(k));
        if (filtered.length > 0) {
          if (!filtered.includes("name")) filtered.unshift("name");
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load saved nature group export columns:", e);
  }
  return ALL_NATURE_GROUP_EXPORT_COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key);
};

export const saveNatureGroupExportColumns = (keys: string[]): void => {
  try {
    localStorage.setItem(LS_NATURE_GROUP_EXPORT_COLUMNS_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save nature group export columns:", e);
  }
};

export const getSavedNaturePagination = (defaultSize = 8): number => {
  try {
    const saved = localStorage.getItem(LS_NATURE_PAGINATION_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load saved nature pagination:", e);
  }
  return defaultSize;
};

export const saveNaturePagination = (size: number): void => {
  try {
    localStorage.setItem(LS_NATURE_PAGINATION_KEY, String(size));
  } catch (e) {
    console.error("Failed to save nature pagination:", e);
  }
};

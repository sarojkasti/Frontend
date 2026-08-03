export interface ColumnDefinition {
  key: string;
  title: string;
  defaultVisible: boolean;
  required?: boolean;
  defaultWidth?: number;
}

export const ALL_CLIENT_COLUMNS: ColumnDefinition[] = [
  { key: "name", title: "Client Name", defaultVisible: true, required: true, defaultWidth: 200 },
  { key: "shortName", title: "Short Name", defaultVisible: true, defaultWidth: 120 },
  { key: "panNo", title: "PAN Number", defaultVisible: true, defaultWidth: 140 },
  { key: "legalStatus", title: "Legal Status", defaultVisible: true, defaultWidth: 160 },
  { key: "industryNature", title: "Industry Nature", defaultVisible: true, defaultWidth: 180 },
  { key: "businessSize", title: "Business Size", defaultVisible: true, defaultWidth: 140 },
  { key: "registeredDate", title: "Registered Date", defaultVisible: true, defaultWidth: 140 },
  { key: "contact", title: "Contact Info", defaultVisible: true, defaultWidth: 180 },
  { key: "address", title: "Location / District", defaultVisible: false, defaultWidth: 180 },
  { key: "status", title: "Status", defaultVisible: true, defaultWidth: 120 },
  { key: "action", title: "Action", defaultVisible: true, required: true, defaultWidth: 100 },
];

export const LS_CLIENT_COLUMNS_KEY = "artha_client_table_columns_v1";
export const LS_CLIENT_WIDTHS_KEY = "artha_client_table_widths_v1";
export const LS_CLIENT_PAGINATION_KEY = "artha_client_table_pagination_v1";

export const getSavedClientVisibleColumns = (): string[] => {
  try {
    const saved = localStorage.getItem(LS_CLIENT_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = ALL_CLIENT_COLUMNS.map(c => c.key);
        const filtered = parsed.filter(k => validKeys.includes(k));
        if (filtered.length > 0) {
          if (!filtered.includes("name")) filtered.unshift("name");
          if (!filtered.includes("action")) filtered.push("action");
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load saved client table columns:", e);
  }
  return ALL_CLIENT_COLUMNS.filter(col => col.defaultVisible).map(col => col.key);
};

export const saveClientVisibleColumns = (keys: string[]): void => {
  try {
    localStorage.setItem(LS_CLIENT_COLUMNS_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save client table columns:", e);
  }
};

export const getSavedClientColumnWidths = (): Record<string, number> => {
  try {
    const saved = localStorage.getItem(LS_CLIENT_WIDTHS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load saved client column widths:", e);
  }
  const defaults: Record<string, number> = {};
  ALL_CLIENT_COLUMNS.forEach(col => {
    defaults[col.key] = col.defaultWidth || 150;
  });
  return defaults;
};

export const saveClientColumnWidths = (widths: Record<string, number>): void => {
  try {
    localStorage.setItem(LS_CLIENT_WIDTHS_KEY, JSON.stringify(widths));
  } catch (e) {
    console.error("Failed to save client column widths:", e);
  }
};

export const getSavedClientPageSize = (): number => {
  try {
    const saved = localStorage.getItem(LS_CLIENT_PAGINATION_KEY);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {
    console.error("Failed to load saved client page size:", e);
  }
  return 10;
};

export const saveClientPageSize = (pageSize: number): void => {
  try {
    localStorage.setItem(LS_CLIENT_PAGINATION_KEY, pageSize.toString());
  } catch (e) {
    console.error("Failed to save client page size:", e);
  }
};

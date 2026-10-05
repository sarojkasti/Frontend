import { ColumnDefinition } from "@/components/Table/types";

export const ALL_BILLING_COLUMNS: ColumnDefinition[] = [
  { key: "name", title: "Name", defaultVisible: true, required: true, defaultWidth: 180 },
  { key: "shortName", title: "Short Name", defaultVisible: true, defaultWidth: 130 },
  { key: "pan_number", title: "PAN Number", defaultVisible: true, defaultWidth: 140 },
  { key: "email", title: "Email", defaultVisible: true, defaultWidth: 200 },
  { key: "phone", title: "Phone", defaultVisible: true, defaultWidth: 140 },
  { key: "registration_number", title: "Reg. Number", defaultVisible: false, defaultWidth: 140 },
  { key: "vat_number", title: "VAT Number", defaultVisible: false, defaultWidth: 140 },
  { key: "bank_name", title: "Bank Name", defaultVisible: false, defaultWidth: 160 },
  { key: "address", title: "Address", defaultVisible: false, defaultWidth: 180 },
  { key: "status", title: "Status", defaultVisible: true, defaultWidth: 120 },
  { key: "action", title: "Action", defaultVisible: true, required: true, defaultWidth: 140 },
];

export const LS_BILLING_COLUMNS_KEY = "artha_billing_columns_v1";

export const getSavedBillingVisibleColumns = (): string[] => {
  try {
    const saved = localStorage.getItem(LS_BILLING_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validKeys = ALL_BILLING_COLUMNS.map((c) => c.key);
        const filtered = parsed.filter((k) => validKeys.includes(k));
        if (filtered.length > 0) {
          if (!filtered.includes("name")) filtered.unshift("name");
          if (!filtered.includes("action")) filtered.push("action");
          return filtered;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load saved billing columns:", e);
  }
  return ALL_BILLING_COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key);
};

export const saveBillingVisibleColumns = (keys: string[]): void => {
  try {
    localStorage.setItem(LS_BILLING_COLUMNS_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save billing columns:", e);
  }
};

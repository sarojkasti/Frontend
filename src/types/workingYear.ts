export interface WorkingYearType {
  id: string;
  name: string; // e.g. "2081/82"
  nepaliStartYear: number;
  nepaliStartMonth: number; // 1-12, default 5 (Bhadra)
  nepaliStartDay: number; // default 1
  startDateAD: string; // YYYY-MM-DD
  endDateAD: string; // YYYY-MM-DD
  isCurrent: boolean;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkingYearConfigType {
  id?: string;
  defaultStartMonth: number; // 1-12, default 5 (Bhadra)
  defaultStartDay: number; // default 1
  description?: string;
}

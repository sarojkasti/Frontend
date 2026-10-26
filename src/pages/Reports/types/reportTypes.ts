import React from "react";

export type ReportType =
  | "worklog"
  | "attendance"
  | "reconciliation"
  | "project"
  | "leave";

export type ActiveReportKey = ReportType | "analytics" | "availability";

export type DatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "custom";

export type DetailMode =
  | "detailed"
  | "summary_employee"
  | "summary_project"
  | "summary_date";

export interface ReportColumnConfig {
  key: string;
  title: string;
  dataIndex?: string;
  category?: string;
  defaultVisible: boolean;
  width?: number;
  align?: "left" | "center" | "right";
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

export interface ReportFilterState {
  reportType: ReportType;
  datePreset: DatePreset;
  startDate?: string;
  endDate?: string;
  departmentId: string;
  userIds: string[];
  projectId: string;
  status: string;
  detailMode: DetailMode;
  selectedColumns: string[];
  searchKeyword: string;
}

export interface ReportSummaryKpi {
  label: string;
  value: string | number;
  suffix?: string;
  prefix?: React.ReactNode;
  color?: string;
}

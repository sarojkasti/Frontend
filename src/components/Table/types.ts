import React from "react";
import type { TableProps } from "antd";
import type { ColumnType } from "antd/es/table";
import type { Rule } from "antd/es/form";

/**
 * Standard column definition used for column customization (show/hide, reorder, width).
 * Compatible with existing clientColumnsConfig and attendanceColumnsConfig.
 */
export interface ColumnDefinition {
  key: string;
  title: string;
  defaultVisible: boolean;
  required?: boolean;
  defaultWidth?: number;
  category?: string;
  description?: string;
}

/**
 * Configuration for inline editable table cells.
 */
export type EditType =
  | "text"
  | "number"
  | "select"
  | "date"
  | "switch"
  | "textarea"
  | "custom";

export interface CellEditOption {
  label: string;
  value: any;
  color?: string;
}

export interface CellEditConfig<T = any> {
  type?: EditType;
  placeholder?: string;
  options?: CellEditOption[] | ((record: T) => CellEditOption[]);
  rules?: Rule[];
  disabled?: boolean | ((record: T) => boolean);
  /**
   * Save handler called when user commits edit for this cell.
   * Can return a Promise. If promise rejects or throws, the edit stays open.
   */
  onSave?: (record: T, newValue: any, oldValue: any) => Promise<boolean | void> | boolean | void;
  renderCustomInput?: (props: {
    value: any;
    record: T;
    onChange: (val: any) => void;
    onSave: () => void;
    onCancel: () => void;
    loading: boolean;
  }) => React.ReactNode;
}

/**
 * Extended Column definition for PowerTable.
 * Inherits all standard Ant Design ColumnType properties.
 */
export interface PowerTableColumn<T = any> extends Omit<ColumnType<T>, "title" | "dataIndex" | "render"> {
  key: string;
  title: string | React.ReactNode | ((props: any) => React.ReactNode);
  dataIndex?: string | string[];

  // Width & Resizing
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean; // Default: true when enableResize is on

  // Search & Filter
  searchable?: boolean; // Auto-generate search/filter dropdown
  searchPlaceholder?: string;
  searchTitle?: string;
  sortable?: boolean; // Default true; set false to disable sorting on this column

  // Inline Editing
  editable?: boolean | ((record: T, index: number) => boolean);
  editConfig?: CellEditConfig<T>;

  // Column Customization / Visibility
  defaultVisible?: boolean; // Default: true
  required?: boolean; // Cannot be hidden in customizer
  category?: string;

  // Custom cell renderer with typed parameters
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

/**
 * Main Props for PowerTable component.
 */
export interface PowerTableProps<T extends Record<string, any> = any>
  extends Omit<TableProps<T>, "columns"> {
  // Columns
  columns: PowerTableColumn<T>[];

  // Feature Toggles (all safely opt-in or with sensible defaults)
  enableResize?: boolean;
  enableSearch?: boolean; // Global search query filter
  enableColumnSearch?: boolean; // Per-column search dropdowns
  enableColumnCustomizer?: boolean; // Column show/hide/reorder drawer/popover
  enableRowSelection?: boolean;
  enableMobileCards?: boolean; // Automatically switch to card list on mobile (ResponsiveTable)

  // LocalStorage Persistence & Controlled Column State
  persistenceKey?: string; // If provided, persists visible columns, widths, page size
  visibleColumnKeys?: string[];
  onVisibleColumnKeysChange?: (keys: string[]) => void;
  columnWidths?: Record<string, number>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;

  // Global search input state (controlled or uncontrolled)
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  searchPlaceholder?: string;

  // Cell Edit Handler (table-level fallback for all editable columns)
  onCellSave?: (
    record: T,
    dataIndex: string,
    newValue: any,
    oldValue: any
  ) => Promise<boolean | void> | boolean | void;

  // Row Selection Callback helper
  selectedRows?: T[];
  onSelectedRowsChange?: (selectedRows: T[], selectedKeys: React.Key[]) => void;

  // Toolbar & Custom Header actions
  toolbarExtra?: React.ReactNode;
  showToolbar?: boolean;

  // Responsive / Mobile Card renderer
  renderMobileCard?: (record: T, index: number) => React.ReactNode;
  mobileBreakpoint?: number;
  forceTableOnMobile?: boolean;

  // Custom empty text
  emptyText?: string;
}

import React, { useMemo, useState } from "react";
import { Card, TableProps } from "antd";
import ResponsiveTable from "@/components/ui/MobileCardList";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ResizableHeader } from "./components/ResizableHeader";
import { EditableCell } from "./components/EditableCell";
import { PowerTableToolbar } from "./components/PowerTableToolbar";
import { useTableSearch, getNestedValue } from "./hooks/useTableSearch";
import { useTablePersistence } from "./hooks/useTablePersistence";
import type {
  PowerTableProps,
  PowerTableColumn,
  ColumnDefinition,
} from "./types";

/**
 * Global PowerTable component.
 *
 * Built on Ant Design Table & ResponsiveTable with:
 *  - Interactive Drag-to-Resize Column Widths
 *  - Standardized Autocomplete Column Search & Filters with Highlights
 *  - Full Inline Cell Editing (Text, Number, Select, Date, Switch, Custom)
 *  - Column Customization (Show/Hide, DnD Reorder)
 *  - LocalStorage Persistence for Column Widths, Visible Columns, and Pagination
 *  - Seamless Mobile Card Transformation
 *  - 100% Backward-Compatible with all Ant Design Table props
 */
export function PowerTable<T extends Record<string, any> = any>({
  columns,
  dataSource = [],
  rowKey = "id",
  loading = false,

  // Feature Toggles
  enableResize = true,
  enableSearch = false,
  enableColumnSearch = true,
  enableColumnCustomizer = true,
  enableRowSelection = false,
  enableMobileCards = true,

  // LocalStorage Persistence & Controlled Column State
  persistenceKey,
  visibleColumnKeys: controlledVisibleColumnKeys,
  onVisibleColumnKeysChange,
  columnWidths: controlledColumnWidths,
  onColumnWidthsChange,

  // Global Search
  searchQuery: externalSearchQuery,
  onSearchQueryChange: externalOnSearchQueryChange,
  searchPlaceholder = "Search table...",

  // Inline Cell Editing
  onCellSave,

  // Selection
  selectedRows,
  onSelectedRowsChange,
  rowSelection: customRowSelection,

  // Toolbar
  toolbarExtra,
  showToolbar,

  // Responsive / Mobile
  renderMobileCard,
  mobileBreakpoint = 768,
  forceTableOnMobile = false,

  // Pass-through props
  components: customComponents,
  pagination: customPagination,
  onChange: customOnChange,
  scroll: customScroll,
  size = "small",
  bordered,
  className = "",
  style,
  ...restTableProps
}: PowerTableProps<T>) {
  const { isMobile } = useIsMobile();

  // Internal search query state if not controlled externally
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : internalSearchQuery;
  const onSearchQueryChange =
    externalOnSearchQueryChange || setInternalSearchQuery;

  // Convert PowerTable columns into ColumnDefinition list for persistence & customizer
  const columnDefs: ColumnDefinition[] = useMemo(() => {
    return columns.map((col) => ({
      key: col.key,
      title: typeof col.title === "string" ? col.title : col.key,
      defaultVisible: col.defaultVisible !== false,
      required: col.required || col.key === "action",
      defaultWidth: col.width || col.defaultWidth,
      category: col.category,
    }));
  }, [columns]);

  // Persistence Hook
  const {
    visibleColumnKeys: internalVisibleColumnKeys,
    setVisibleColumnKeys: internalSetVisibleColumnKeys,
    columnWidths: internalColumnWidths,
    handleResize: internalHandleResize,
    pageSize,
    setPageSize,
    resetAll,
  } = useTablePersistence({
    persistenceKey,
    columns: columnDefs,
    defaultPageSize:
      typeof customPagination === "object" && customPagination?.pageSize
        ? customPagination.pageSize
        : 10,
  });

  const visibleColumnKeys = controlledVisibleColumnKeys || internalVisibleColumnKeys;
  const setVisibleColumnKeys = onVisibleColumnKeysChange || internalSetVisibleColumnKeys;
  const columnWidths = controlledColumnWidths || internalColumnWidths;
  const handleResize = onColumnWidthsChange
    ? (key: string) => (width: number) =>
        onColumnWidthsChange({ ...columnWidths, [key]: width })
    : internalHandleResize;

  // Column Search Hook
  const { getColumnSearchProps } = useTableSearch<T>({
    dataSource,
  });

  // Map and assemble active processed columns
  const processedColumns = useMemo(() => {
    // 1. Filter columns by visibility (unless column customizer is disabled and no persistence)
    const isCustomizerActive =
      !!controlledVisibleColumnKeys ||
      enableColumnCustomizer ||
      !!persistenceKey;
    const activeKeys = isCustomizerActive
      ? visibleColumnKeys
      : columns.map((c) => c.key);

    const colMap = new Map<string, PowerTableColumn<T>>();
    columns.forEach((col) => colMap.set(col.key, col));

    // Preserve custom order from visibleColumnKeys
    const orderedCols: PowerTableColumn<T>[] = [];
    activeKeys.forEach((key) => {
      const col = colMap.get(key);
      if (col) orderedCols.push(col);
    });

    // Make sure required columns that might be missing are included
    columns.forEach((col) => {
      if (col.required && !orderedCols.some((c) => c.key === col.key)) {
        orderedCols.push(col);
      }
    });

    // Make sure "action" column always stays at the end if present
    const actionIndex = orderedCols.findIndex(
      (c) => c.key === "action" || c.key === "operations"
    );
    if (actionIndex !== -1 && actionIndex !== orderedCols.length - 1) {
      const [actionCol] = orderedCols.splice(actionIndex, 1);
      orderedCols.push(actionCol);
    }

    // 2. Enhance each column with Resizing, Searching, and Editing
    return orderedCols.map((col) => {
      const effectiveWidth =
        columnWidths[col.key] || col.width || col.defaultWidth || 150;
      const isColResizable =
        enableResize &&
        col.resizable !== false &&
        col.key !== "action" &&
        col.key !== "operations";

      // Base column with width and resizing header
      const enhancedCol: any = {
        ...col,
        width: effectiveWidth,
        onHeaderCell: isColResizable
          ? () => ({
              width: effectiveWidth,
              minWidth: col.minWidth || 70,
              maxWidth: col.maxWidth || 800,
              columnKey: col.key,
              resizable: true,
              onResize: handleResize(col.key),
            })
          : col.onHeaderCell,
      };

      // Auto-inject Column Sorter if not already provided and column is sortable
      const isActionCol =
        col.key === "action" ||
        col.key === "operations" ||
        col.key === "s" ||
        col.dataIndex === "o";

      if (
        enhancedCol.sorter === undefined &&
        col.sortable !== false &&
        !isActionCol &&
        (col.dataIndex || typeof col.key === "string")
      ) {
        const targetField = (col.dataIndex || col.key) as string | string[];
        enhancedCol.sorter = (a: any, b: any) => {
          const valA = getNestedValue(a, targetField);
          const valB = getNestedValue(b, targetField);
          if (valA === valB) return 0;
          if (valA === null || valA === undefined || valA === "") return 1;
          if (valB === null || valB === undefined || valB === "") return -1;
          if (typeof valA === "number" && typeof valB === "number") {
            return valA - valB;
          }
          if (
            typeof valA === "string" &&
            typeof valB === "string" &&
            (valA.includes("-") || valA.includes("/")) &&
            (valB.includes("-") || valB.includes("/"))
          ) {
            const timeA = Date.parse(valA);
            const timeB = Date.parse(valB);
            if (!isNaN(timeA) && !isNaN(timeB)) {
              return timeA - timeB;
            }
          }
          return String(valA).localeCompare(String(valB), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        };
      }

      // Sanitize sortOrder if false (AntD expects null/undefined/'ascend'/'descend')
      if (enhancedCol.sortOrder === false) {
        enhancedCol.sortOrder = null;
      }

      // Auto-inject Column Search if enabled or explicitly requested
      if (
        (enableColumnSearch || col.searchable) &&
        col.dataIndex &&
        !col.filterDropdown
      ) {
        const titleStr =
          typeof col.title === "string" ? col.title : String(col.key);
        const searchProps = getColumnSearchProps(
          col.dataIndex,
          col.searchTitle || titleStr,
          {
            placeholder: col.searchPlaceholder,
          }
        );

        enhancedCol.filterDropdown = searchProps.filterDropdown;
        enhancedCol.filterIcon = searchProps.filterIcon;
        enhancedCol.onFilter = col.onFilter || searchProps.onFilter;
        enhancedCol.onFilterDropdownOpenChange =
          searchProps.onFilterDropdownOpenChange;

        // Wrap cell render with search highlighter if no custom render
        if (!col.render) {
          enhancedCol.render = (val: any) => searchProps.renderHighlight(val);
        }
      }

      // Auto-inject Inline Cell Editing if enabled
      if (col.editable && col.dataIndex) {
        const originalRender = col.render;
        const stringDataIndex = Array.isArray(col.dataIndex)
          ? col.dataIndex.join(".")
          : col.dataIndex;

        enhancedCol.render = (val: any, record: T, index: number) => {
          const rawValue =
            val !== undefined ? val : getNestedValue(record, col.dataIndex!);

          return (
            <EditableCell<T>
              value={rawValue}
              record={record}
              dataIndex={stringDataIndex}
              config={col.editConfig}
              editable={col.editable}
              onSave={col.editConfig?.onSave || onCellSave}
              renderDefault={() =>
                originalRender ? originalRender(val, record, index) : val
              }
            />
          );
        };
      }

      return enhancedCol;
    });
  }, [
    columns,
    visibleColumnKeys,
    columnWidths,
    enableResize,
    enableColumnSearch,
    enableColumnCustomizer,
    persistenceKey,
    handleResize,
    getColumnSearchProps,
    onCellSave,
  ]);

  // Row Selection Configuration
  const effectiveRowSelection: TableProps<T>["rowSelection"] = useMemo(() => {
    if (customRowSelection) return customRowSelection;
    if (!enableRowSelection) return undefined;

    const getKey = (record: T) =>
      typeof rowKey === "function" ? rowKey(record) : record[rowKey];

    return {
      type: "checkbox",
      selectedRowKeys: selectedRows?.map((r) => getKey(r)) || [],
      onChange: (keys: React.Key[], rows: T[]) => {
        if (onSelectedRowsChange) {
          onSelectedRowsChange(rows, keys);
        }
      },
    };
  }, [
    customRowSelection,
    enableRowSelection,
    selectedRows,
    rowKey,
    onSelectedRowsChange,
  ]);

  // Combined Table Components (with ResizableHeader)
  const combinedComponents = useMemo(() => {
    return {
      ...customComponents,
      header: {
        cell: ResizableHeader,
        ...(customComponents as any)?.header,
      },
    };
  }, [customComponents]);

  // Pagination Configuration with Persistence
  const effectivePagination = useMemo(() => {
    if (customPagination === false) return false;
    if (isMobile && enableMobileCards) return false;

    const basePagination =
      typeof customPagination === "object" ? customPagination : {};

    return {
      pageSize,
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: [5, 10, 20, 50, 100],
      showTotal: (total: number, range: [number, number]) =>
        `${range[0]}-${range[1]} of ${total} items`,
      ...basePagination,
    };
  }, [customPagination, pageSize, isMobile, enableMobileCards]);

  // Handle pagination size change
  const handleTableChange: TableProps<T>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
    if (customOnChange) {
      customOnChange(pagination, filters, sorter, extra);
    }
  };

  // Compute total width of all active columns for fixed table scrolling
  const totalColumnsWidth = useMemo(() => {
    return processedColumns.reduce((sum, c) => {
      const w = Number(c.width) || Number(c.defaultWidth) || 150;
      return sum + w;
    }, 0);
  }, [processedColumns]);

  // Horizontal scroll fallback for wide tables
  const effectiveScroll = useMemo(() => {
    if (isMobile) return undefined;
    if (customScroll) {
      return {
        ...customScroll,
        x: customScroll.x !== undefined ? customScroll.x : totalColumnsWidth,
      };
    }
    return { x: totalColumnsWidth };
  }, [isMobile, customScroll, totalColumnsWidth]);

  const isCustomizerActive = enableColumnCustomizer === true;

  const shouldShowToolbar =
    showToolbar !== undefined
      ? showToolbar
      : enableSearch ||
        isCustomizerActive ||
        !!toolbarExtra;

  return (
    <div className={`w-full ${className}`} style={style}>
      {/* Table Toolbar */}
      {shouldShowToolbar && (
        <PowerTableToolbar
          showSearch={enableSearch}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          searchPlaceholder={searchPlaceholder}
          showColumnCustomizer={isCustomizerActive}
          allColumns={columnDefs}
          visibleColumnKeys={visibleColumnKeys}
          setVisibleColumnKeys={setVisibleColumnKeys}
          onResetColumns={resetAll}
          extra={toolbarExtra}
        />
      )}

      {/* Main Table / Responsive View */}
      <ResponsiveTable<T>
        components={combinedComponents}
        tableLayout="fixed"
        loading={loading}
        dataSource={dataSource}
        columns={processedColumns}
        rowSelection={isMobile ? undefined : effectiveRowSelection}
        onChange={handleTableChange}
        rowKey={rowKey}
        size={size}
        bordered={bordered}
        scroll={effectiveScroll}
        pagination={effectivePagination}
        renderMobileCard={renderMobileCard}
        mobileBreakpoint={mobileBreakpoint}
        forceTableOnMobile={forceTableOnMobile || !enableMobileCards}
        {...restTableProps}
      />
    </div>
  );
}

export default PowerTable;

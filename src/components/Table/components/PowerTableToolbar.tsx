import React from "react";
import { Input, Button, Popover } from "antd";
import { SearchOutlined, SettingOutlined } from "@ant-design/icons";
import { SortableColumnCustomizer } from "../SortableColumnCustomizer";
import type { ColumnDefinition } from "../types";

export interface PowerTableToolbarProps {
  // Search
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;

  // Column Customizer
  showColumnCustomizer?: boolean;
  allColumns?: ColumnDefinition[];
  visibleColumnKeys?: string[];
  setVisibleColumnKeys?: (keys: string[] | ((prev: string[]) => string[])) => void;
  onResetColumns?: () => void;

  // Extra buttons/content
  extra?: React.ReactNode;
  totalCount?: number;
}

export const PowerTableToolbar: React.FC<PowerTableToolbarProps> = ({
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder = "Search...",
  showSearch = false,
  showColumnCustomizer = false,
  allColumns = [],
  visibleColumnKeys = [],
  setVisibleColumnKeys,
  onResetColumns,
  extra,
}) => {
  const isCustomizerActive =
    showColumnCustomizer &&
    setVisibleColumnKeys &&
    allColumns &&
    allColumns.length > 0;

  const hasToolbarContent =
    showSearch || isCustomizerActive || extra !== undefined;

  if (!hasToolbarContent) return null;

  return (
    <div
      className={`flex items-center gap-3 mb-2.5 ${
        showSearch
          ? "flex-col sm:flex-row items-stretch sm:items-center justify-between"
          : "justify-end"
      }`}
    >
      {/* Left section: Search bar (rendered only when showSearch is active) */}
      {showSearch && onSearchQueryChange && (
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            allowClear
            size="middle"
            className="w-full text-sm rounded-lg"
          />
        </div>
      )}

      {/* Right section: Column customizer & Custom extra buttons */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {extra}

        {isCustomizerActive && (
          <Popover
            content={
              <SortableColumnCustomizer
                allColumns={allColumns}
                visibleColumnKeys={visibleColumnKeys}
                setVisibleColumnKeys={setVisibleColumnKeys}
                onReset={onResetColumns || (() => {})}
              />
            }
            trigger="click"
            placement="bottomRight"
          >
            <Button
              icon={<SettingOutlined />}
              size="middle"
              className="rounded-lg text-slate-700 flex items-center gap-1.5"
              title="Customize & Reorder Columns"
            >
              <span className="text-xs">Edit Columns</span>
            </Button>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default PowerTableToolbar;

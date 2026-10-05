import React, { useState, useMemo, useCallback } from "react";
import { Button, Popover } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { SortableColumnCustomizer } from "../SortableColumnCustomizer";
import type { ColumnDefinition, PowerTableColumn } from "../types";

export interface UseColumnVisibilityOptions {
  persistenceKey: string;
  columns: (PowerTableColumn<any> | ColumnDefinition)[];
  buttonText?: string;
  size?: "small" | "middle" | "large";
}

/**
 * Clean, standard hook for placing the "Edit Columns" Popover button
 * into any page's top action bar, card header, or filter row.
 */
export function useColumnVisibility({
  persistenceKey,
  columns,
  buttonText = "Edit Columns",
  size = "middle",
}: UseColumnVisibilityOptions) {
  const storageKey = `artha_cols_${persistenceKey}`;

  // Normalized column definitions
  const columnDefs: ColumnDefinition[] = useMemo(() => {
    return columns.map((col: any) => ({
      key: col.key,
      title:
        typeof col.title === "string"
          ? col.title
          : typeof col.key === "string"
          ? col.key.charAt(0).toUpperCase() + col.key.slice(1)
          : String(col.key),
      defaultVisible: col.defaultVisible !== false,
      required:
        col.required ||
        col.key === "action" ||
        col.key === "actions" ||
        col.key === "operations",
      defaultWidth: col.defaultWidth || col.width,
      category: col.category,
      description: col.description,
    }));
  }, [columns]);

  const defaultKeys = useMemo(() => {
    return columnDefs.filter((c) => c.defaultVisible).map((c) => c.key);
  }, [columnDefs]);

  const [visibleColumnKeys, setVisibleColumnKeysState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validKeys = columnDefs.map((c) => c.key);
          const filtered = parsed.filter((k) => validKeys.includes(k));
          if (filtered.length > 0) {
            // Keep action at the end if present
            if (validKeys.includes("action") && !filtered.includes("action")) {
              filtered.push("action");
            } else if (validKeys.includes("actions") && !filtered.includes("actions")) {
              filtered.push("actions");
            }
            return filtered;
          }
        }
      }
    } catch (e) {
      console.error(`Failed to load column visibility for ${persistenceKey}:`, e);
    }
    return defaultKeys;
  });

  const setVisibleColumnKeys = useCallback(
    (keysOrFn: string[] | ((prev: string[]) => string[])) => {
      setVisibleColumnKeysState((prev) => {
        const next = typeof keysOrFn === "function" ? keysOrFn(prev) : keysOrFn;
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {
          console.error(`Failed to save column visibility for ${persistenceKey}:`, e);
        }
        return next;
      });
    },
    [storageKey, persistenceKey]
  );

  const resetVisibleKeys = useCallback(() => {
    setVisibleColumnKeys(defaultKeys);
  }, [defaultKeys, setVisibleColumnKeys]);

  const columnCustomizer = (
    <Popover
      content={
        <SortableColumnCustomizer
          allColumns={columnDefs}
          visibleColumnKeys={visibleColumnKeys}
          setVisibleColumnKeys={setVisibleColumnKeys}
          onReset={resetVisibleKeys}
        />
      }
      trigger="click"
      placement="bottomRight"
    >
      <Button
        icon={<SettingOutlined />}
        size={size}
        className="rounded-lg text-slate-700 flex items-center gap-1.5"
        title="Customize & Reorder Columns"
      >
        <span className="text-xs">{buttonText}</span>
      </Button>
    </Popover>
  );

  return {
    visibleColumnKeys,
    setVisibleColumnKeys,
    resetVisibleKeys,
    columnCustomizer,
  };
}

export default useColumnVisibility;

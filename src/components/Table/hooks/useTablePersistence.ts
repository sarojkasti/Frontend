import { useState, useEffect, useCallback, useRef } from "react";
import type { ColumnDefinition } from "../types";

export interface UseTablePersistenceOptions {
  persistenceKey?: string;
  columns?: ColumnDefinition[];
  defaultPageSize?: number;
}

export function useTablePersistence({
  persistenceKey,
  columns = [],
  defaultPageSize = 10,
}: UseTablePersistenceOptions) {
  const columnsStorageKey = persistenceKey
    ? `artha_table_cols_${persistenceKey}_v1`
    : null;
  const widthsStorageKey = persistenceKey
    ? `artha_table_widths_${persistenceKey}_v1`
    : null;
  const paginationStorageKey = persistenceKey
    ? `artha_table_paging_${persistenceKey}_v1`
    : null;

  // Compute default visible keys
  const defaultVisibleKeys = columns
    .filter((col) => col.defaultVisible !== false)
    .map((col) => col.key);

  // Compute default widths
  const defaultWidths: Record<string, number> = {};
  columns.forEach((col) => {
    if (col.defaultWidth) {
      defaultWidths[col.key] = col.defaultWidth;
    }
  });

  // 1. Visible Column Keys
  const [visibleColumnKeys, setVisibleColumnKeysState] = useState<string[]>(() => {
    if (!columnsStorageKey) return defaultVisibleKeys;
    try {
      const saved = localStorage.getItem(columnsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const allKeys = columns.map((c) => c.key);
          const valid = parsed.filter((k) => allKeys.includes(k));
          if (valid.length > 0) {
            // Guarantee required keys remain present
            columns.forEach((col) => {
              if (col.required && !valid.includes(col.key)) {
                valid.push(col.key);
              }
            });
            return valid;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to read table visible columns from localStorage:", e);
    }
    return defaultVisibleKeys;
  });

  const setVisibleColumnKeys = useCallback(
    (keysOrUpdater: string[] | ((prev: string[]) => string[])) => {
      setVisibleColumnKeysState((prev) => {
        const newKeys =
          typeof keysOrUpdater === "function"
            ? keysOrUpdater(prev)
            : keysOrUpdater;
        if (columnsStorageKey) {
          try {
            localStorage.setItem(columnsStorageKey, JSON.stringify(newKeys));
          } catch (e) {
            console.warn("Failed to persist table visible columns:", e);
          }
        }
        return newKeys;
      });
    },
    [columnsStorageKey]
  );

  // 2. Column Widths
  const [columnWidths, setColumnWidthsState] = useState<Record<string, number>>(() => {
    if (!widthsStorageKey) return defaultWidths;
    try {
      const saved = localStorage.getItem(widthsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...defaultWidths, ...parsed };
        }
      }
    } catch (e) {
      console.warn("Failed to read table widths from localStorage:", e);
    }
    return defaultWidths;
  });

  const widthsDebounceTimer = useRef<any>(null);

  const handleResize = useCallback(
    (key: string) => (newWidth: number) => {
      setColumnWidthsState((prev) => {
        const updated = { ...prev, [key]: newWidth };
        if (widthsStorageKey) {
          if (widthsDebounceTimer.current) {
            clearTimeout(widthsDebounceTimer.current);
          }
          widthsDebounceTimer.current = setTimeout(() => {
            try {
              localStorage.setItem(widthsStorageKey, JSON.stringify(updated));
            } catch (e) {
              console.warn("Failed to persist table column widths:", e);
            }
          }, 300);
        }
        return updated;
      });
    },
    [widthsStorageKey]
  );

  // 3. Page Size
  const [pageSize, setPageSizeState] = useState<number>(() => {
    if (!paginationStorageKey) return defaultPageSize;
    try {
      const saved = localStorage.getItem(paginationStorageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to read table page size from localStorage:", e);
    }
    return defaultPageSize;
  });

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      if (paginationStorageKey) {
        try {
          localStorage.setItem(paginationStorageKey, String(size));
        } catch (e) {
          console.warn("Failed to persist table page size:", e);
        }
      }
    },
    [paginationStorageKey]
  );

  // 4. Reset All
  const resetAll = useCallback(() => {
    setVisibleColumnKeysState(defaultVisibleKeys);
    setColumnWidthsState(defaultWidths);
    setPageSizeState(defaultPageSize);

    if (columnsStorageKey) localStorage.removeItem(columnsStorageKey);
    if (widthsStorageKey) localStorage.removeItem(widthsStorageKey);
    if (paginationStorageKey) localStorage.removeItem(paginationStorageKey);
  }, [
    columnsStorageKey,
    widthsStorageKey,
    paginationStorageKey,
    defaultVisibleKeys,
    defaultWidths,
    defaultPageSize,
  ]);

  return {
    visibleColumnKeys,
    setVisibleColumnKeys,
    columnWidths,
    handleResize,
    pageSize,
    setPageSize,
    resetAll,
  };
}

export default useTablePersistence;

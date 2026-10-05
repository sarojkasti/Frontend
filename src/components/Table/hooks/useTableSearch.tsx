import React, { useState, useRef, useCallback } from "react";
import { Input, Button, Space } from "antd";
import type { InputRef } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";

export interface UseTableSearchOptions<T = any> {
  dataSource?: T[];
}

/**
 * Helper to safely extract nested property values using dot-notation (e.g. "role.name", "legalStatus.name")
 * or array paths.
 */
export function getNestedValue(obj: any, path: string | string[]): any {
  if (!obj) return null;
  if (Array.isArray(path)) {
    let curr = obj;
    for (const key of path) {
      if (curr === undefined || curr === null) return null;
      curr = curr[key];
    }
    return curr;
  }
  if (typeof path === "string") {
    if (!path.includes(".")) return obj[path];
    const keys = path.split(".");
    let curr = obj;
    for (const key of keys) {
      if (curr === undefined || curr === null) return null;
      curr = curr[key];
    }
    return curr;
  }
  return null;
}

/**
 * Standardized column search & filter hook.
 * Extracts and consolidates the ~80-line getColumnSearchProps pattern used across 15+ table files.
 */
export function useTableSearch<T = any>(options?: UseTableSearchOptions<T>) {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInputRef = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: () => void,
    dataIndex: string
  ) => {
    confirm();
    setSearchText(selectedKeys[0] || "");
    setSearchedColumn(dataIndex);
  };

  const handleReset = (
    clearFilters?: () => void,
    confirm?: (param?: { closeDropdown: boolean }) => void
  ) => {
    if (clearFilters) clearFilters();
    setSearchText("");
    setSearchedColumn("");
    if (confirm) confirm({ closeDropdown: false });
  };

  /**
   * Generates Ant Design column filter props for a given dataIndex and title.
   */
  const getColumnSearchProps = useCallback((
    dataIndex: string | string[],
    title: string,
    extraOptions?: {
      placeholder?: string;
      customData?: T[];
      highlightMatch?: boolean;
    }
  ) => {
    const stringDataIndex = Array.isArray(dataIndex) ? dataIndex.join(".") : dataIndex;
    const effectiveData = extraOptions?.customData || options?.dataSource || [];

    const getUniqueValues = () => {
      const values = new Set<string>();
      effectiveData.forEach((record: any) => {
        const val = getNestedValue(record, dataIndex);
        if (val !== undefined && val !== null && val !== "") {
          values.add(String(val));
        }
      });
      return Array.from(values).sort();
    };

    return {
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }: any) => {
        const uniqueValues = getUniqueValues();
        const currentValue = selectedKeys[0] ? String(selectedKeys[0]) : "";
        const filteredOptions = currentValue
          ? uniqueValues
              .filter((val) =>
                val.toLowerCase().includes(currentValue.toLowerCase())
              )
              .slice(0, 10)
          : uniqueValues.slice(0, 10);

        return (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              ref={searchInputRef}
              placeholder={extraOptions?.placeholder || `Search ${title}`}
              value={currentValue}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() =>
                handleSearch(selectedKeys, confirm, stringDataIndex)
              }
              style={{ marginBottom: 8, display: "block" }}
              allowClear
            />
            {filteredOptions.length > 0 && (
              <div
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  marginBottom: 8,
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  backgroundColor: "#fff",
                }}
              >
                {filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "5px 10px",
                      cursor: "pointer",
                      fontSize: 12,
                      borderBottom:
                        idx < filteredOptions.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                    className="hover:bg-blue-50 text-slate-700 transition-colors"
                    onClick={() => {
                      setSelectedKeys([option]);
                      handleSearch([option], confirm, stringDataIndex);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            <Space size={6}>
              <Button
                type="primary"
                onClick={() =>
                  handleSearch(selectedKeys, confirm, stringDataIndex)
                }
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 85 }}
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  setSelectedKeys([]);
                  handleReset(clearFilters, confirm);
                }}
                size="small"
                style={{ width: 85 }}
              >
                Reset
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined
          style={{
            color: filtered ? "#1677ff" : "#94a3b8",
            fontSize: 13,
          }}
        />
      ),
      onFilter: (value: any, record: any) => {
        const val = getNestedValue(record, dataIndex);
        if (val === undefined || val === null) return false;
        return String(val)
          .toLowerCase()
          .includes(String(value).toLowerCase());
      },
      onFilterDropdownOpenChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInputRef.current?.select(), 100);
        }
      },
      onFilterDropdownVisibleChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInputRef.current?.select(), 100);
        }
      },
      render: (text: any) => {
        if (extraOptions?.highlightMatch === false) return text;
        const textStr =
          text === undefined || text === null ? "" : String(text);
        if (searchedColumn === stringDataIndex && searchText) {
          return (
            <Highlighter
              highlightStyle={{
                backgroundColor: "#fef08a",
                padding: "0 2px",
                borderRadius: 2,
              }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={textStr}
            />
          );
        }
        return text;
      },
      renderHighlight: (text: any) => {
        if (extraOptions?.highlightMatch === false) return text;
        const textStr =
          text === undefined || text === null ? "" : String(text);
        if (searchedColumn === stringDataIndex && searchText) {
          return (
            <Highlighter
              highlightStyle={{
                backgroundColor: "#fef08a",
                padding: "0 2px",
                borderRadius: 2,
              }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={textStr}
            />
          );
        }
        return text;
      },
    };
  }, [options?.dataSource, searchText, searchedColumn]);

  return {
    searchText,
    searchedColumn,
    setSearchText,
    setSearchedColumn,
    getColumnSearchProps,
    handleReset,
  };
}

export default useTableSearch;

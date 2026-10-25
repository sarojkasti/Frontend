import React from "react";
import { Button } from "antd";
import { InboxOutlined, SearchOutlined, ClearOutlined } from "@ant-design/icons";

export interface TableEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  isFiltered = false,
  onClearFilters,
  className = "",
  style,
}) => {
  const displayTitle = title || (isFiltered ? "No Matching Results" : "No Data Found");
  const displayDescription =
    description ||
    (isFiltered
      ? "We couldn't find any records matching your active search or filters."
      : "There are currently no records to display.");

  return (
    <div
      className={`w-full bg-white rounded-xl border border-gray-100/80 py-14 px-6 text-center flex flex-col items-center justify-center my-1 ${className}`}
      style={{ minHeight: 260, ...style }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: isFiltered ? "#eff6ff" : "#f8fafc",
          border: isFiltered ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          color: isFiltered ? "#1677ff" : "#94a3b8",
          fontSize: 28,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        {icon || (isFiltered ? <SearchOutlined /> : <InboxOutlined />)}
      </div>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#1e293b",
          marginBottom: 6,
        }}
      >
        {displayTitle}
      </h3>

      <p
        style={{
          fontSize: 13,
          color: "#64748b",
          maxWidth: 380,
          margin: "0 auto 16px auto",
          lineHeight: 1.5,
        }}
      >
        {displayDescription}
      </p>

      {action ? (
        action
      ) : isFiltered && onClearFilters ? (
        <Button
          icon={<ClearOutlined />}
          onClick={onClearFilters}
          style={{ borderRadius: 6 }}
        >
          Clear Filters
        </Button>
      ) : null}
    </div>
  );
};

export default TableEmptyState;

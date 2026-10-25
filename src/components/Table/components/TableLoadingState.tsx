import React from "react";
import { Skeleton, Spin } from "antd";

export interface TableLoadingStateProps {
  type?: "skeleton" | "spinner";
  tip?: string;
  rows?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const TableLoadingState: React.FC<TableLoadingStateProps> = ({
  type = "skeleton",
  tip = "Loading records, please wait...",
  rows = 5,
  className = "",
  style,
}) => {
  if (type === "spinner") {
    return (
      <div
        className={`w-full bg-white rounded-xl border border-gray-100 py-16 px-6 text-center flex flex-col items-center justify-center my-1 ${className}`}
        style={{ minHeight: 280, ...style }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, fontSize: 14, fontWeight: 500, color: "#334155" }}>
          {tip}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
          Retrieving latest data from server
        </div>
      </div>
    );
  }

  // Elegant shimmer skeleton simulating table headers & rows
  return (
    <div
      className={`w-full bg-white rounded-xl border border-gray-100 p-6 my-1 ${className}`}
      style={{ minHeight: 280, ...style }}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Spin size="small" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>{tip}</span>
        </div>
        <Skeleton.Input active size="small" style={{ width: 120, height: 24, borderRadius: 6 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              paddingBottom: 10,
              borderBottom: index < rows - 1 ? "1px solid #f8fafc" : "none",
            }}
          >
            <Skeleton.Input active size="small" style={{ width: "20%", height: 16, borderRadius: 4 }} />
            <Skeleton.Input active size="small" style={{ width: "35%", height: 16, borderRadius: 4 }} />
            <Skeleton.Input active size="small" style={{ width: "15%", height: 16, borderRadius: 4 }} />
            <Skeleton.Input active size="small" style={{ width: "15%", height: 16, borderRadius: 4 }} />
            <Skeleton.Input active size="small" style={{ width: "10%", height: 16, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableLoadingState;

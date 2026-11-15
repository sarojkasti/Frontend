import React from "react";
import { Select, Tag, Tooltip, Space } from "antd";
import { CalendarOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useWorkingYearContext } from "@/context/WorkingYearContext";

interface WorkingYearSelectorProps {
  size?: "small" | "middle" | "large";
  style?: React.CSSProperties;
  className?: string;
}

export const WorkingYearSelector: React.FC<WorkingYearSelectorProps> = ({
  size = "middle",
  style,
  className
}) => {
  const {
    workingYears,
    selectedWorkingYear,
    selectedWorkingYearId,
    currentWorkingYear,
    setSelectedWorkingYearById,
    isLoading
  } = useWorkingYearContext();

  const value = selectedWorkingYearId || "all";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, ...style }} className={className}>
      <Tooltip title="Switch Active Fiscal Year context across the system">
        <Select
          size={size}
          loading={isLoading}
          value={value}
          onChange={(val) => setSelectedWorkingYearById(val === "all" ? null : val)}
          style={{ minWidth: 125 }}
          popupMatchSelectWidth={false}
          optionLabelProp="label"
          className="rounded-lg shadow-xs"
        >
          {workingYears.map((wy) => {
            const isCurrent = currentWorkingYear?.id === wy.id;
            return (
              <Select.Option
                key={wy.id}
                value={wy.id}
                label={
                  <Space size={6}>
                    <CalendarOutlined style={{ color: isCurrent ? "#0c66e4" : "#64748b" }} />
                    <span style={{ fontWeight: isCurrent ? 600 : 500 }}>FY {wy.name}</span>
                  </Space>
                }
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minWidth: 170 }}>
                  <Space size={6}>
                    <CalendarOutlined style={{ color: isCurrent ? "#0c66e4" : "#64748b" }} />
                    <span style={{ fontWeight: isCurrent ? 600 : 400 }}>FY {wy.name}</span>
                  </Space>
                  {isCurrent && (
                    <Tag
                      color="blue"
                      style={{
                        margin: 0,
                        fontSize: 10,
                        lineHeight: "16px",
                        padding: "0 5px",
                        borderRadius: 4
                      }}
                    >
                      Current
                    </Tag>
                  )}
                </div>
              </Select.Option>
            );
          })}
          <Select.Option
            value="all"
            label={
              <Space size={6}>
                <CalendarOutlined style={{ color: "#64748b" }} />
                <span style={{ color: "#64748b" }}>All FY</span>
              </Space>
            }
          >
            <Space size={6}>
              <CalendarOutlined style={{ color: "#64748b" }} />
              <span style={{ color: "#64748b", fontStyle: "italic" }}>All Fiscal Years</span>
            </Space>
          </Select.Option>
        </Select>
      </Tooltip>
    </div>
  );
};

export default WorkingYearSelector;

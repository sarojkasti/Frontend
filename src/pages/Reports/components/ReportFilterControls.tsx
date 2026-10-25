import React, { useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  Radio,
  Tag,
  Tooltip,
  Typography,
  Badge,
  Popover,
  Checkbox,
  Divider,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ProjectOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  FilterOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  ReportType,
  DatePreset,
  DetailMode,
  ReportFilterState,
  ReportColumnConfig,
} from "../types/reportTypes";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface ReportFilterControlsProps {
  filters: ReportFilterState;
  onFilterChange: <K extends keyof ReportFilterState>(key: K, value: ReportFilterState[K]) => void;
  onResetFilters: () => void;
  onGenerateReport: () => void;
  isLoading: boolean;
  departments: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; email?: string; departmentName?: string }>;
  projects: Array<{ id: string; name: string; code?: string }>;
  allColumns: ReportColumnConfig[];
  recordCount: number;
  hideReportTypePicker?: boolean;
}

export const ReportFilterControls: React.FC<ReportFilterControlsProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onGenerateReport,
  isLoading,
  departments,
  users,
  projects,
  allColumns,
  recordCount,
  hideReportTypePicker = false,
}) => {
  // Preset handlers
  const handleDatePreset = (preset: DatePreset) => {
    let start: string | undefined;
    let end: string | undefined;

    const today = dayjs();
    switch (preset) {
      case "today":
        start = today.format("YYYY-MM-DD");
        end = today.format("YYYY-MM-DD");
        break;
      case "yesterday":
        start = today.subtract(1, "day").format("YYYY-MM-DD");
        end = today.subtract(1, "day").format("YYYY-MM-DD");
        break;
      case "this_week":
        start = today.startOf("week").format("YYYY-MM-DD");
        end = today.endOf("week").format("YYYY-MM-DD");
        break;
      case "last_week":
        start = today.subtract(1, "week").startOf("week").format("YYYY-MM-DD");
        end = today.subtract(1, "week").endOf("week").format("YYYY-MM-DD");
        break;
      case "this_month":
        start = today.startOf("month").format("YYYY-MM-DD");
        end = today.endOf("month").format("YYYY-MM-DD");
        break;
      case "last_month":
        start = today.subtract(1, "month").startOf("month").format("YYYY-MM-DD");
        end = today.subtract(1, "month").endOf("month").format("YYYY-MM-DD");
        break;
      case "last_30_days":
        start = today.subtract(29, "day").format("YYYY-MM-DD");
        end = today.format("YYYY-MM-DD");
        break;
      case "custom":
        start = filters.startDate;
        end = filters.endDate;
        break;
    }

    onFilterChange("datePreset", preset);
    onFilterChange("startDate", start);
    onFilterChange("endDate", end);
  };

  const handleRangePickerChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      onFilterChange("datePreset", "custom");
      onFilterChange("startDate", dates[0].format("YYYY-MM-DD"));
      onFilterChange("endDate", dates[1].format("YYYY-MM-DD"));
    } else {
      onFilterChange("datePreset", "custom");
      onFilterChange("startDate", undefined);
      onFilterChange("endDate", undefined);
    }
  };

  // Column Customizer content
  const columnCategories = useMemo(() => {
    const cats: Record<string, ReportColumnConfig[]> = {};
    allColumns.forEach((c) => {
      const cat = c.category || "General";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(c);
    });
    return cats;
  }, [allColumns]);

  // Memoized employee options sorted with selected on top
  const employeeOptions = useMemo(() => {
    const selectedIds = new Set(filters.userIds || []);

    const sortedUsers = [...users].sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return sortedUsers.map((u) => {
      const isSelected = selectedIds.has(u.id);
      return {
        value: u.id,
        tagLabel: u.name,
        searchValue: `${u.name} ${u.email || ""}`,
        label: (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span
              style={{
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? "#1677ff" : "inherit",
              }}
            >
              {u.name}
            </span>
            {u.email && (
              <span
                style={{
                  fontSize: 11,
                  color: isSelected ? "#60a5fa" : "#94a3b8",
                  marginLeft: 8,
                }}
              >
                {u.email}
              </span>
            )}
          </div>
        ),
      };
    });
  }, [users, filters.userIds]);

  const columnSelectorPopover = (
    <div style={{ width: 340, maxHeight: 420, overflowY: "auto", padding: "8px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Text strong style={{ fontSize: 13 }}>Choose Report Columns</Text>
        <Space size="small">
          <Button
            size="small"
            type="link"
            onClick={() => onFilterChange("selectedColumns", allColumns.map((c) => c.key))}
          >
            All
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() =>
              onFilterChange(
                "selectedColumns",
                allColumns.filter((c) => c.defaultVisible).map((c) => c.key)
              )
            }
          >
            Reset
          </Button>
        </Space>
      </div>
      <Divider style={{ margin: "6px 0 12px" }} />
      {Object.entries(columnCategories).map(([cat, cols]) => (
        <div key={cat} style={{ marginBottom: 14 }}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
            {cat}
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {cols.map((col) => {
              const checked = filters.selectedColumns.includes(col.key);
              return (
                <Checkbox
                  key={col.key}
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...filters.selectedColumns, col.key]
                      : filters.selectedColumns.filter((k) => k !== col.key);
                    onFilterChange("selectedColumns", next);
                  }}
                  style={{ fontSize: 12 }}
                >
                  {col.title}
                </Checkbox>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card
      style={{
        borderRadius: "12px",
        marginBottom: 20,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        border: "1px solid #e2e8f0",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      {/* 1. Report Type Picker */}
      {!hideReportTypePicker && (
        <>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text strong style={{ fontSize: 14, color: "#1e293b" }}>
                <FileTextOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                Select Report Type
              </Text>
              <Tag color="blue" style={{ borderRadius: 12, padding: "2px 10px", fontSize: 11 }}>
                {recordCount} Records Available
              </Tag>
            </div>

            <Row gutter={[12, 12]}>
              {[
                {
                  key: "worklog",
                  title: "Worklog Sheet",
                  desc: "Timesheets, tasks, logged hours & work descriptions",
                  icon: <ClockCircleOutlined style={{ fontSize: 18, color: "#1677ff" }} />,
                },
                {
                  key: "attendance",
                  title: "Attendance Sheet",
                  desc: "Office register, clock in/out, duration & remarks",
                  icon: <CalendarOutlined style={{ fontSize: 18, color: "#52c41a" }} />,
                },
                {
                  key: "reconciliation",
                  title: "Discrepancy Audit",
                  desc: "Side-by-side attendance vs worklog hours comparison",
                  icon: <AuditOutlined style={{ fontSize: 18, color: "#fa8c16" }} />,
                },
                {
                  key: "project",
                  title: "Project Progress & Cost",
                  desc: "Budget variance, estimated vs actual hours & progress",
                  icon: <ProjectOutlined style={{ fontSize: 18, color: "#722ed1" }} />,
                },
                {
                  key: "leave",
                  title: "Leave & Absence Sheet",
                  desc: "Leaves taken, leave types, approvals & absence log",
                  icon: <SafetyCertificateOutlined style={{ fontSize: 18, color: "#eb2f96" }} />,
                },
              ].map((item) => {
                const isSelected = filters.reportType === item.key;
                return (
                  <Col xs={24} sm={12} md={8} lg={item.key === "leave" ? 4 : 5} key={item.key}>
                    <div
                      onClick={() => onFilterChange("reportType", item.key as ReportType)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: isSelected ? "2px solid #1677ff" : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? "#f0f7ff" : "#ffffff",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        {item.icon}
                        <Text strong style={{ fontSize: 13, color: isSelected ? "#1677ff" : "#1e293b" }}>
                          {item.title}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11, lineHeight: "1.3" }}>
                        {item.desc}
                      </Text>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          <Divider style={{ margin: "16px 0" }} />
        </>
      )}

      {/* 2. Date Filter Row */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text strong style={{ fontSize: 13, color: "#334155" }}>
            <CalendarOutlined style={{ marginRight: 6 }} /> Date Range & Period
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {filters.startDate && filters.endDate
              ? `${filters.startDate} to ${filters.endDate}`
              : "All Available Dates"}
          </Text>
        </div>

        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} lg={14}>
            <Space wrap size={[6, 8]}>
              {(
                [
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "this_week", label: "This Week" },
                  { key: "last_week", label: "Last Week" },
                  { key: "this_month", label: "This Month" },
                  { key: "last_month", label: "Last Month" },
                  { key: "last_30_days", label: "Last 30 Days" },
                  { key: "custom", label: "Custom Range" },
                ] as const
              ).map((p) => {
                const isActive = filters.datePreset === p.key;
                return (
                  <Button
                    key={p.key}
                    size="small"
                    type={isActive ? "primary" : "default"}
                    onClick={() => handleDatePreset(p.key)}
                    style={{
                      borderRadius: 16,
                      fontSize: 12,
                      padding: "0 12px",
                      height: 28,
                      borderColor: isActive ? "#1677ff" : "#d9d9d9",
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <RangePicker
              style={{ width: "100%", borderRadius: 6 }}
              value={
                filters.startDate && filters.endDate
                  ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                  : null
              }
              onChange={handleRangePickerChange}
              allowClear
              placeholder={["Start Date", "End Date"]}
            />
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* 3. Entity & Dimension Filters */}
      <Row gutter={[16, 16]}>
        {/* Department Filter */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
              Department
            </Text>
          </div>
          <Select
            style={{ width: "100%" }}
            placeholder="All Departments"
            value={filters.departmentId}
            onChange={(val) => onFilterChange("departmentId", val)}
            allowClear
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            options={[
              { value: "all", label: "All Departments" },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </Col>

        {/* Employee Filter */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
              Employee(s)
            </Text>
          </div>
          <Select
            mode="multiple"
            maxTagCount="responsive"
            optionLabelProp="tagLabel"
            style={{ width: "100%" }}
            placeholder="All Employees"
            value={filters.userIds}
            onChange={(val) => onFilterChange("userIds", val)}
            allowClear
            showSearch
            optionFilterProp="searchValue"
            filterOption={(input, option) => {
              const search = input.trim().toLowerCase();
              if (!search) return true;
              const text = String((option as any)?.searchValue || (option as any)?.tagLabel || "").toLowerCase();
              return text.includes(search);
            }}
            tagRender={(tagProps) => {
              const { label, closable, onClose } = tagProps;
              const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
                event.preventDefault();
                event.stopPropagation();
              };
              return (
                <Tag
                  closable={closable}
                  onClose={onClose}
                  onMouseDown={onPreventMouseDown}
                  style={{
                    marginRight: 3,
                    display: "inline-flex",
                    alignItems: "center",
                    maxWidth: 130,
                    fontSize: 12,
                    borderRadius: 4,
                    padding: "0 6px",
                    lineHeight: "20px",
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                </Tag>
              );
            }}
            maxTagPlaceholder={(omittedValues) => (
              <Tooltip
                title={
                  <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 12, padding: "2px 4px" }}>
                    {omittedValues.map((item, idx) => (
                      <div key={idx} style={{ padding: "2px 0" }}>
                        {(item as any)?.tagLabel || item.label || item.value}
                      </div>
                    ))}
                  </div>
                }
              >
                <Tag
                  style={{
                    marginRight: 0,
                    backgroundColor: "#f1f5f9",
                    borderColor: "#cbd5e1",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: 4,
                    padding: "0 6px",
                    lineHeight: "20px",
                  }}
                >
                  +{omittedValues.length}
                </Tag>
              </Tooltip>
            )}
            options={employeeOptions}
          />
        </Col>

        {/* Project Filter (relevant for worklogs and projects) */}
        {(filters.reportType === "worklog" || filters.reportType === "project") && (
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
                Project
              </Text>
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="All Projects"
              value={filters.projectId}
              onChange={(val) => onFilterChange("projectId", val)}
              allowClear
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.trim().toLowerCase())
              }
              options={[
                { value: "all", label: "All Projects" },
                ...projects.map((p) => ({
                  value: p.id,
                  label: `${p.name}${p.code ? ` (${p.code})` : ""}`,
                })),
              ]}
            />
          </Col>
        )}

        {/* Status Filter */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
              Status
            </Text>
          </div>
          <Select
            style={{ width: "100%" }}
            value={filters.status}
            onChange={(val) => onFilterChange("status", val)}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            options={[
              { value: "all", label: "All Statuses" },
              { value: "approved", label: "Approved Only" },
              { value: "requested", label: "Requested / Pending Only" },
              { value: "rejected", label: "Rejected Only" },
            ]}
          />
        </Col>

        {/* Presentation / Detail Mode */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
              Report Detail Mode
            </Text>
          </div>
          <Select
            style={{ width: "100%" }}
            value={filters.detailMode}
            onChange={(val) => onFilterChange("detailMode", val as DetailMode)}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            options={[
              { value: "detailed", label: "Detailed Itemized Sheet" },
              { value: "summary_employee", label: "Summary by Employee" },
              ...(filters.reportType === "worklog" || filters.reportType === "project"
                ? [{ value: "summary_project", label: "Summary by Project" }]
                : []),
              { value: "summary_date", label: "Summary by Date" },
            ]}
          />
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0 14px" }} />

      {/* 4. Action Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Space size="middle">
          <Popover content={columnSelectorPopover} trigger="click" placement="bottomLeft">
            <Button icon={<SettingOutlined />} size="middle" style={{ borderRadius: 6 }}>
              Columns ({filters.selectedColumns.length}/{allColumns.length})
            </Button>
          </Popover>

          <Button
            icon={<ReloadOutlined />}
            size="middle"
            onClick={onResetFilters}
            style={{ borderRadius: 6 }}
          >
            Reset Filters
          </Button>
        </Space>

        <Space size="middle">
          <Button
            type="primary"
            icon={<FilterOutlined />}
            size="large"
            loading={isLoading}
            onClick={onGenerateReport}
            style={{
              borderRadius: 6,
              backgroundColor: "#1677ff",
              paddingLeft: 24,
              paddingRight: 24,
              fontWeight: 500,
              boxShadow: "0 2px 6px rgba(22, 119, 255, 0.25)",
            }}
          >
            Generate Report Sheet
          </Button>
        </Space>
      </div>
    </Card>
  );
};

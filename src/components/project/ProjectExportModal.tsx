import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Radio,
  Checkbox,
  Button,
  Table,
  Tag,
  Row,
  Col,
  Space,
  Card,
  Divider,
  Alert,
  message,
  Tooltip
} from "antd";
import {
  DownloadOutlined,
  CheckCircleOutlined,
  TableOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { ALL_PROJECT_COLUMNS, ColumnDefinition } from "./projectColumnsConfig";
import { ProjectType } from "@/types/project";

interface ProjectExportModalProps {
  open: boolean;
  onCancel: () => void;
  selectedProjects: ProjectType[];
  allProjects: any[];
  visibleColumnKeys: string[];
  activeTabKey: string;
  showFilters: boolean;
  advancedFilters: any;
}

const TAB_STATUS_MAP: Record<string, { label: string; status: string; color: string }> = {
  "1": { label: "Active", status: "active", color: "blue" },
  "2": { label: "Completed", status: "completed", color: "green" },
  "3": { label: "Signed Off", status: "signed_off", color: "purple" },
  "4": { label: "Suspended", status: "suspended", color: "orange" },
  "5": { label: "Archived", status: "archive", color: "volcano" },
};

const ProjectExportModal: React.FC<ProjectExportModalProps> = ({
  open,
  onCancel,
  selectedProjects,
  allProjects,
  visibleColumnKeys,
  activeTabKey,
  showFilters,
  advancedFilters,
}) => {
  const hasSelected = selectedProjects.length > 0;

  // Export scope state: 'selected' | 'filtered'
  const [exportScope, setExportScope] = useState<"selected" | "filtered">(
    hasSelected ? "selected" : "filtered"
  );

  // Available exportable columns (excluding action)
  const exportableColumns = useMemo(() => {
    return ALL_PROJECT_COLUMNS.filter((c) => c.key !== "action");
  }, []);

  // Pre-select fields based on table's visible columns
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Update selected scope and pre-select fields when modal opens
  useEffect(() => {
    if (open) {
      setExportScope(hasSelected ? "selected" : "filtered");
      const defaultFields = visibleColumnKeys.filter((k) => k !== "action");
      setSelectedFields(defaultFields.length > 0 ? defaultFields : exportableColumns.map((c) => c.key));
    }
  }, [open, hasSelected, visibleColumnKeys, exportableColumns]);

  // Determine active tab status info
  const tabInfo = TAB_STATUS_MAP[activeTabKey] || { label: "Active", status: "active", color: "blue" };

  // Calculate filtered projects for current view/tab
  const filteredViewProjects = useMemo(() => {
    if (!allProjects) return [];
    let list = [...allProjects];

    // If advanced filters are active, apply them
    if (showFilters && advancedFilters) {
      if (advancedFilters.dateRange && advancedFilters.dateRange.length === 2) {
        list = list.filter((p: any) => {
          const startDate = dayjs(p.startingDate);
          const endDate = dayjs(p.endingDate);
          const [filterStart, filterEnd] = advancedFilters.dateRange;
          return (
            startDate.isSameOrAfter(filterStart, "day") &&
            endDate.isSameOrBefore(filterEnd, "day")
          );
        });
      }
      if (advancedFilters.clientId) {
        list = list.filter((p: any) => p.customer?.id === advancedFilters.clientId);
      }
      if (advancedFilters.projectLeadId) {
        list = list.filter((p: any) => p.projectLead?.id === advancedFilters.projectLeadId);
      }
      if (advancedFilters.projectManagerId) {
        list = list.filter((p: any) => p.projectManager?.id === advancedFilters.projectManagerId);
      }
      if (advancedFilters.natureOfWork) {
        list = list.filter((p: any) => {
          const natureId = typeof p.natureOfWork === "object" ? p.natureOfWork?.id : p.natureOfWork;
          return natureId === advancedFilters.natureOfWork;
        });
      }
      if (advancedFilters.status) {
        list = list.filter((p: any) => p.status === advancedFilters.status);
      }
    } else {
      // Filter by current active tab status
      list = list.filter((p: any) => p.status === tabInfo.status);
    }

    return list;
  }, [allProjects, showFilters, advancedFilters, tabInfo.status]);

  // Handle select all / clear / reset fields
  const handleSelectAllFields = () => {
    setSelectedFields(exportableColumns.map((c) => c.key));
  };

  const handleResetToTableFields = () => {
    const tableFields = visibleColumnKeys.filter((k) => k !== "action");
    setSelectedFields(tableFields);
  };

  const handleToggleField = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedFields((prev) => [...prev, key]);
    } else {
      setSelectedFields((prev) => prev.filter((k) => k !== key));
    }
  };

  // Calculate completion details helper
  const getCompletionText = (record: any) => {
    let total = 0;
    let completed = 0;

    if (record.taskCompletionStats) {
      total = Number(record.taskCompletionStats.total || 0);
      completed = Number(record.taskCompletionStats.completed || 0);
    } else if (record.tasks && Array.isArray(record.tasks)) {
      const mainTasks = record.tasks.filter((t: any) => !t.parentTask && !t.parentTaskId);
      total = mainTasks.length;
      completed = mainTasks.filter(
        (t: any) =>
          t.status === "done" ||
          (t.status as any) === "first_verified" ||
          (t.status as any) === "second_verified"
      ).length;
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return total > 0 ? `${completed}/${total} tasks (${percent}%)` : "No Tasks (0/0)";
  };

  // Perform Excel export
  const handleExport = () => {
    const targets = exportScope === "selected" ? selectedProjects : filteredViewProjects;

    if (!targets || targets.length === 0) {
      message.warning("No projects available to export in the selected scope.");
      return;
    }

    if (selectedFields.length === 0) {
      message.warning("Please select at least one field/column to export.");
      return;
    }

    // Build ordered field list based on exportableColumns order
    const orderedSelectedFields = exportableColumns
      .filter((c) => selectedFields.includes(c.key))
      .map((c) => c.key);

    const formattedRows = targets.map((p: any) => {
      const row: Record<string, any> = {};

      orderedSelectedFields.forEach((fieldKey) => {
        const colDef = exportableColumns.find((c) => c.key === fieldKey);
        const title = colDef ? colDef.title : fieldKey;

        switch (fieldKey) {
          case "name":
            row[title] = p.name || "-";
            break;
          case "natureOfWork":
            row[title] = typeof p.natureOfWork === "object" ? p.natureOfWork?.name || "-" : p.natureOfWork || "-";
            break;
          case "client":
            row[title] = p.customer?.name || "-";
            break;
          case "projectManager":
            row[title] = p.projectManager?.name || p.projectManager?.username || "-";
            break;
          case "projectLead":
            row[title] = p.projectLead?.name || p.projectLead?.username || "-";
            break;
          case "startingDate":
            row[title] = p.startingDate ? dayjs(p.startingDate).format("YYYY-MM-DD") : "-";
            break;
          case "endingDate":
            row[title] = p.endingDate ? dayjs(p.endingDate).format("YYYY-MM-DD") : "-";
            break;
          case "fiscalYear":
            row[title] = p.fiscalYear ? `${p.fiscalYear}/${(p.fiscalYear + 1).toString().slice(-2)}` : "-";
            break;
          case "completion":
            row[title] = getCompletionText(p);
            break;
          case "status":
            row[title] = p.status ? p.status.toUpperCase() : "-";
            break;
          case "users":
            row[title] = Array.isArray(p.users) && p.users.length > 0
              ? p.users.map((u: any) => u.name || u.username || u.email).join(", ")
              : "No members";
            break;
          case "activeUsers":
            row[title] = Array.isArray(p.activeUsers) && p.activeUsers.length > 0
              ? p.activeUsers.map((u: any) => u.name || u.username || u.email).join(", ")
              : "No active members";
            break;
          case "description":
            row[title] = p.description || "-";
            break;
          case "isPaymentDone":
            row[title] = p.isPaymentDone ? "Paid" : "Unpaid";
            break;
          case "countsForAvailability":
            row[title] = p.countsForAvailability ? "Yes" : "No";
            break;
          case "allowSubtaskWorklog":
            row[title] = p.allowSubtaskWorklog ? "Yes" : "No";
            break;
          default:
            row[title] = p[fieldKey] !== undefined && p[fieldKey] !== null ? String(p[fieldKey]) : "-";
        }
      });

      return row;
    });

    try {
      const worksheet = XLSX.utils.json_to_sheet(formattedRows);

      // Auto-calculate column widths
      if (formattedRows.length > 0) {
        const colWidths = Object.keys(formattedRows[0]).map((key) => {
          const maxLen = Math.max(
            key.length,
            ...formattedRows.map((r) => String(r[key] || "").length)
          );
          return { wch: Math.min(Math.max(maxLen + 4, 12), 60) };
        });
        worksheet["!cols"] = colWidths;
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

      const scopeName = exportScope === "selected" ? "Selected" : (showFilters ? "Filtered_Search" : tabInfo.label);
      const filename = `Artha_Projects_${scopeName}_${dayjs().format("YYYY-MM-DD")}.xlsx`;

      XLSX.writeFile(workbook, filename);
      message.success(`Successfully exported ${targets.length} project(s) to Excel!`);
      onCancel();
    } catch (err) {
      console.error("Export to Excel failed:", err);
      message.error("Failed to generate Excel file. Please try again.");
    }
  };

  return (
    <Modal
      title={
        <Space align="center">
          <DownloadOutlined style={{ color: "#1890ff", fontSize: "18px" }} />
          <span style={{ fontSize: "16px", fontWeight: 600 }}>Export Projects (Download Helper)</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
        >
          Export Excel ({exportScope === "selected" ? selectedProjects.length : filteredViewProjects.length} Projects)
        </Button>,
      ]}
      width={720}
      bodyStyle={{ paddingTop: 12 }}
    >
      {/* 1. Scope Selection Section */}
      <Card size="small" style={{ marginBottom: 16, backgroundColor: "#f8fafc" }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: "#334155" }}>
          1. Choose Export Scope
        </div>
        <Radio.Group
          value={exportScope}
          onChange={(e) => setExportScope(e.target.value)}
          style={{ width: "100%" }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Radio value="selected" disabled={!hasSelected}>
                <span style={{ fontWeight: 500 }}>
                  Selected Project(s) ({selectedProjects.length})
                </span>
                {!hasSelected && (
                  <div style={{ fontSize: "11px", color: "#888", marginLeft: 24 }}>
                    (Check radio button in table to select)
                  </div>
                )}
              </Radio>
            </Col>
            <Col span={12}>
              <Radio value="filtered">
                <span style={{ fontWeight: 500 }}>
                  All Projects in Current View ({filteredViewProjects.length})
                </span>
              </Radio>
            </Col>
          </Row>
        </Radio.Group>
      </Card>

      {/* 2. Scope Details Preview */}
      {exportScope === "selected" ? (
        <Card
          size="small"
          title={
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1d4ed8" }}>
              Selected Projects Preview ({selectedProjects.length})
            </div>
          }
          style={{ marginBottom: 16, borderColor: "#bfdbfe" }}
        >
          <Table
            dataSource={selectedProjects}
            rowKey={(r: any) => r.id?.toString() || Math.random().toString()}
            pagination={false}
            size="small"
            scroll={{ y: 150 }}
            columns={[
              {
                title: "Project Name",
                dataIndex: "name",
                key: "name",
                render: (name: string) => <strong style={{ color: "#1e293b" }}>{name}</strong>,
              },
              {
                title: "Client",
                key: "client",
                render: (_: any, r: any) => r.customer?.name || "-",
              },
              {
                title: "Lead",
                key: "lead",
                render: (_: any, r: any) => r.projectLead?.name || "-",
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (st: string) => <Tag color="blue">{st || "active"}</Tag>,
              },
            ]}
          />
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
          message={
            <Space align="center">
              <span>Auto-detected View Scope:</span>
              {showFilters ? (
                <Tag color="purple" icon={<FilterOutlined />}>
                  Advanced Search Filters ({filteredViewProjects.length} Projects)
                </Tag>
              ) : (
                <Tag color={tabInfo.color} icon={<TableOutlined />}>
                  {tabInfo.label} Tab ({filteredViewProjects.length} Projects)
                </Tag>
              )}
            </Space>
          }
          description={`All ${filteredViewProjects.length} projects currently matching the ${
            showFilters ? "advanced search filters" : `"${tabInfo.label}" tab`
          } will be exported to Excel.`}
        />
      )}

      {/* 3. Fields / Data Selection Section */}
      <Card size="small" style={{ backgroundColor: "#ffffff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: "#334155" }}>
              2. Select Fields / Columns to Export ({selectedFields.length} selected)
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Default pre-selected based on your table view column settings
            </div>
          </div>
          <Space size={6}>
            <Button size="small" type="link" onClick={handleSelectAllFields} style={{ padding: 0 }}>
              Select All
            </Button>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <Button size="small" type="link" icon={<ReloadOutlined />} onClick={handleResetToTableFields} style={{ padding: 0 }}>
              Reset to Table Columns
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: "8px 0 12px 0" }} />

        <div style={{ maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
          <Row gutter={[12, 10]}>
            {exportableColumns.map((col) => {
              const isChecked = selectedFields.includes(col.key);
              const isTableVisible = visibleColumnKeys.includes(col.key);

              return (
                <Col span={12} key={col.key}>
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid",
                      borderColor: isChecked ? "#93c5fd" : "#f1f5f9",
                      backgroundColor: isChecked ? "#eff6ff" : "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => handleToggleField(col.key, !isChecked)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => handleToggleField(col.key, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span style={{ fontSize: "13px", color: isChecked ? "#1e40af" : "#475569", fontWeight: isChecked ? 500 : 400 }}>
                        {col.title}
                      </span>
                    </Checkbox>

                    {isTableVisible && (
                      <Tooltip title="Currently visible in table">
                        <Tag color="cyan" style={{ fontSize: "10px", margin: 0, padding: "0 4px" }}>
                          Visible Column
                        </Tag>
                      </Tooltip>
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </Card>
    </Modal>
  );
};

export default ProjectExportModal;

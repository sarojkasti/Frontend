import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Radio,
  Checkbox,
  Button,
  Table,
  Tag,
  Row,
  Col,
  Space,
  Divider,
  Alert,
  Statistic,
  Tooltip,
  Tree,
  message
} from "antd";
import type { TreeDataNode } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FilterOutlined,
  TableOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  CompressOutlined,
  ExpandOutlined,
  CheckSquareOutlined,
  BorderOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { ALL_PROJECT_COLUMNS } from "./projectColumnsConfig";
import { ProjectType } from "@/types/project";
import {
  fetchNatureOfWorks,
  fetchNatureOfWorkGroups,
  NatureOfWork,
  NatureOfWorkGroup,
} from "@/service/natureOfWork.service";

interface ProjectExportPageProps {
  onBack: () => void;
  selectedProjects: ProjectType[];
  allProjects: any[];
  visibleColumnKeys: string[];
  activeTabKey: string;
  showFilters: boolean;
  advancedFilters: any;
  canExportProject?: boolean;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "signed_off", label: "Signed Off", color: "purple" },
  { value: "suspended", label: "Suspended", color: "orange" },
  { value: "archive", label: "Archived", color: "volcano" },
];

const TAB_STATUS_MAP: Record<string, string> = {
  "1": "active",
  "2": "completed",
  "3": "signed_off",
  "4": "suspended",
  "5": "archive",
};

const ProjectExportPage: React.FC<ProjectExportPageProps> = ({
  onBack,
  selectedProjects,
  allProjects,
  visibleColumnKeys,
  activeTabKey,
  showFilters,
  advancedFilters,
  canExportProject = true,
}) => {
  if (!canExportProject) {
    return (
      <div style={{ padding: "60px 20px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <Alert
          type="error"
          showIcon
          message="Access Denied"
          description="You do not have permission to export project data. Please contact your administrator."
          action={
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="primary" style={{ marginTop: 12 }}>
              Back
            </Button>
          }
        />
      </div>
    );
  }
  const hasSelected = selectedProjects.length > 0;

  // 1. Export Scope State: 'selected' | 'filtered'
  const [exportScope, setExportScope] = useState<"selected" | "filtered">(
    hasSelected ? "selected" : "filtered"
  );

  // 2. Status Scope Selection (Multi-select statuses e.g. Active, Completed, All)
  const initialStatus = TAB_STATUS_MAP[activeTabKey] || "active";
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([initialStatus]);

  // 3. Nature of Project Filter State: 'all' | 'specific'
  const [natureMode, setNatureMode] = useState<"all" | "specific">("all");

  // Backend Nature Data
  const [natureData, setNatureData] = useState<NatureOfWork[]>([]);
  const [groupData, setGroupData] = useState<NatureOfWorkGroup[]>([]);
  const [loadingNatures, setLoadingNatures] = useState(false);

  // Tree state for Nature selection
  const [checkedTreeKeys, setCheckedTreeKeys] = useState<React.Key[]>([]);
  const [expandedTreeKeys, setExpandedTreeKeys] = useState<React.Key[]>([]);

  // Fetch Nature of Work and Groups
  useEffect(() => {
    setLoadingNatures(true);
    Promise.all([fetchNatureOfWorks(), fetchNatureOfWorkGroups()])
      .then(([natures, groups]) => {
        setNatureData(natures || []);
        setGroupData(groups || []);

        // Auto-expand all group nodes initially
        const groupKeys = (groups || []).map((g) => `group:${g.id}`);
        groupKeys.push("group:uncategorized");
        setExpandedTreeKeys(groupKeys);
      })
      .catch((err) => {
        console.error("Failed to load nature of work options:", err);
      })
      .finally(() => {
        setLoadingNatures(false);
      });
  }, []);

  // Build Tree Data for Collapsible Group View
  const treeData = useMemo<TreeDataNode[]>(() => {
    const nodes: TreeDataNode[] = [];

    // Group nodes
    groupData.forEach((group) => {
      const childNatures = natureData.filter(
        (n) => (n.groupId || n.group?.id) === group.id
      );

      nodes.push({
        title: (
          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>
            📁 {group.name} ({childNatures.length})
          </span>
        ),
        key: `group:${group.id}`,
        children: childNatures.map((n) => ({
          title: (
            <span style={{ color: "#334155", fontSize: "13px" }}>
              {n.name} <span style={{ color: "#94a3b8", fontSize: "11px" }}>({n.shortName})</span>
            </span>
          ),
          key: `nature:${n.id}`,
        })),
      });
    });

    // Uncategorized natures
    const uncategorized = natureData.filter((n) => !n.groupId && !n.group?.id);
    if (uncategorized.length > 0) {
      nodes.push({
        title: (
          <span style={{ fontWeight: 600, color: "#64748b", fontSize: "13px" }}>
            📁 Uncategorized ({uncategorized.length})
          </span>
        ),
        key: "group:uncategorized",
        children: uncategorized.map((n) => ({
          title: (
            <span style={{ color: "#334155", fontSize: "13px" }}>
              {n.name} <span style={{ color: "#94a3b8", fontSize: "11px" }}>({n.shortName})</span>
            </span>
          ),
          key: `nature:${n.id}`,
        })),
      });
    }

    return nodes;
  }, [groupData, natureData]);

  // Expand / Collapse all Tree groups helper
  const handleExpandAllTree = () => {
    const allGroupKeys = groupData.map((g) => `group:${g.id}`);
    allGroupKeys.push("group:uncategorized");
    setExpandedTreeKeys(allGroupKeys);
  };

  const handleCollapseAllTree = () => {
    setExpandedTreeKeys([]);
  };

  // Select / Clear all tree nodes
  const handleSelectAllTreeNodes = () => {
    const allKeys: string[] = [];
    groupData.forEach((g) => allKeys.push(`group:${g.id}`));
    allKeys.push("group:uncategorized");
    natureData.forEach((n) => allKeys.push(`nature:${n.id}`));
    setCheckedTreeKeys(allKeys);
  };

  const handleClearTreeSelection = () => {
    setCheckedTreeKeys([]);
  };

  // Resolve active Nature IDs from Tree selection
  const activeNatureIds = useMemo(() => {
    if (natureMode === "all") return null;

    const natureIdSet = new Set<string>();

    const keysArray = Array.isArray(checkedTreeKeys)
      ? checkedTreeKeys
      : (checkedTreeKeys as any)?.checked || [];

    keysArray.forEach((keyStr: any) => {
      const key = String(keyStr);
      if (key.startsWith("nature:")) {
        natureIdSet.add(key.replace("nature:", ""));
      } else if (key.startsWith("group:")) {
        const groupId = key.replace("group:", "");
        if (groupId === "uncategorized") {
          natureData
            .filter((n) => !n.groupId && !n.group?.id)
            .forEach((n) => natureIdSet.add(n.id));
        } else {
          natureData
            .filter((n) => (n.groupId || n.group?.id) === groupId)
            .forEach((n) => natureIdSet.add(n.id));
        }
      }
    });

    return natureIdSet;
  }, [natureMode, checkedTreeKeys, natureData]);

  // 4. Exportable Columns State (excluding action)
  const exportableColumns = useMemo(() => {
    return ALL_PROJECT_COLUMNS.filter((c) => c.key !== "action");
  }, []);

  // Pre-select fields based on table's visible columns
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    const defaultFields = visibleColumnKeys.filter((k) => k !== "action");
    return defaultFields.length > 0 ? defaultFields : exportableColumns.map((c) => c.key);
  });

  // Status selection handlers
  const handleSelectAllStatuses = () => {
    setSelectedStatuses(STATUS_OPTIONS.map((s) => s.value));
  };

  const handleClearStatuses = () => {
    setSelectedStatuses([]);
  };

  // Calculate Final Export Projects List
  const finalExportProjects = useMemo(() => {
    if (!allProjects) return [];

    let list = exportScope === "selected" ? [...selectedProjects] : [...allProjects];

    if (exportScope === "filtered") {
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
      } else if (selectedStatuses.length > 0) {
        // Filter by user's chosen status checkboxes
        list = list.filter((p: any) => selectedStatuses.includes(p.status));
      }
    }

    // Apply Nature of Project filter if active
    if (activeNatureIds && activeNatureIds.size > 0) {
      list = list.filter((p: any) => {
        const pNatureId = typeof p.natureOfWork === "object" ? p.natureOfWork?.id : p.natureOfWork;
        return pNatureId && activeNatureIds.has(pNatureId);
      });
    }

    return list;
  }, [allProjects, selectedProjects, exportScope, showFilters, advancedFilters, selectedStatuses, activeNatureIds]);

  // Column Field Selectors
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

  // Completion calculation helper
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

  // Execute Excel Export
  const handleExportExcel = () => {
    if (finalExportProjects.length === 0) {
      message.warning("No projects match the selected criteria to export.");
      return;
    }

    if (selectedFields.length === 0) {
      message.warning("Please select at least one field/column to export.");
      return;
    }

    const orderedSelectedFields = exportableColumns
      .filter((c) => selectedFields.includes(c.key))
      .map((c) => c.key);

    const formattedRows = finalExportProjects.map((p: any) => {
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

      const scopeName = exportScope === "selected" ? "Selected" : "Custom_Scope";
      const filename = `Artha_Projects_${scopeName}_${dayjs().format("YYYY-MM-DD")}.xlsx`;

      XLSX.writeFile(workbook, filename);
      message.success(`Successfully exported ${finalExportProjects.length} project(s) to Excel!`);
    } catch (err) {
      console.error("Export to Excel failed:", err);
      message.error("Failed to generate Excel file.");
    }
  };

  return (
    <div style={{ padding: "0 4px", minHeight: "85vh" }}>
      {/* Top Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <Space size={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="large">
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
              Project Export & Download Helper
            </h1>
            <p className="text-xs text-slate-500 m-0">
              Configure target projects, status scopes, nature of project filters, and columns to export as Excel
            </p>
          </div>
        </Space>

      </div>

      <Row gutter={[20, 20]}>
        {/* Left Column: Scope, Status, and Nature Filters */}
        <Col span={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* 1. Scope & Status Selection */}
            <Card
              title={
                <Space>
                  <AppstoreOutlined className="text-blue-600" />
                  <span>1. Choose Project Scope & Status Filters</span>
                </Space>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              <Radio.Group
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value)}
                style={{ width: "100%", marginBottom: 16 }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Card
                      size="small"
                      className={`cursor-pointer transition-all ${exportScope === "selected" ? "border-blue-500 bg-blue-50/50" : "border-slate-200"
                        }`}
                      onClick={() => hasSelected && setExportScope("selected")}
                    >
                      <Radio value="selected" disabled={!hasSelected}>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          Selected Projects ({selectedProjects.length})
                        </span>
                        {!hasSelected && (
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>
                            (Check radio in table to select)
                          </div>
                        )}
                      </Radio>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      className={`cursor-pointer transition-all ${exportScope === "filtered" ? "border-blue-500 bg-blue-50/50" : "border-slate-200"
                        }`}
                      onClick={() => setExportScope("filtered")}
                    >
                      <Radio value="filtered">
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          All Projects in Scope ({allProjects?.length || 0})
                        </span>
                      </Radio>
                    </Card>
                  </Col>
                </Row>
              </Radio.Group>

              {/* Status Selector checkboxes when exportScope is 'filtered' */}
              {exportScope === "filtered" && (
                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                      Select Statuses to Include ({selectedStatuses.length} selected):
                    </span>
                    <Space size={4}>
                      <Button size="small" type="link" onClick={handleSelectAllStatuses} style={{ padding: 0 }}>
                        Select All
                      </Button>
                      <span style={{ color: "#cbd5e1" }}>|</span>
                      <Button size="small" type="link" onClick={handleClearStatuses} style={{ padding: 0 }}>
                        Clear
                      </Button>
                    </Space>
                  </div>

                  <Checkbox.Group
                    value={selectedStatuses}
                    onChange={(vals) => setSelectedStatuses(vals as string[])}
                    style={{ width: "100%" }}
                  >
                    <Row gutter={[12, 10]}>
                      {STATUS_OPTIONS.map((st) => (
                        <Col span={8} key={st.value}>
                          <Checkbox value={st.value}>
                            <Tag color={st.color} style={{ margin: 0 }}>
                              {st.label}
                            </Tag>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </div>
              )}

              {/* Selected Projects Preview Table */}
              {exportScope === "selected" && (
                <div style={{ marginTop: 12 }}>
                  <Table
                    dataSource={selectedProjects}
                    rowKey={(r: any) => r.id?.toString() || Math.random().toString()}
                    pagination={false}
                    size="small"
                    scroll={{ y: 150 }}
                    columns={[
                      {
                        title: "Selected Project Name",
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
                        title: "Status",
                        dataIndex: "status",
                        key: "status",
                        render: (st: string) => <Tag color="blue">{st || "active"}</Tag>,
                      },
                    ]}
                  />
                </div>
              )}
            </Card>

            {/* 2. Nature of Project Filter (Collapsible Tree View) */}
            <Card
              title={
                <div className="flex justify-between items-center w-full">
                  <Space>
                    <FilterOutlined className="text-emerald-600" />
                    <span>2. Filter by Nature of Project</span>
                  </Space>

                  {natureMode === "specific" && (
                    <Space size={6}>
                      <Tooltip title="Expand All Groups">
                        <Button size="small" icon={<ExpandOutlined />} onClick={handleExpandAllTree}>
                          Expand
                        </Button>
                      </Tooltip>
                      <Tooltip title="Collapse All Groups">
                        <Button size="small" icon={<CompressOutlined />} onClick={handleCollapseAllTree}>
                          Collapse
                        </Button>
                      </Tooltip>
                      <Divider type="vertical" />
                      <Button size="small" type="link" onClick={handleSelectAllTreeNodes} style={{ padding: 0 }}>
                        Check All
                      </Button>
                      <span style={{ color: "#cbd5e1" }}>|</span>
                      <Button size="small" type="link" onClick={handleClearTreeSelection} style={{ padding: 0 }}>
                        Clear
                      </Button>
                    </Space>
                  )}
                </div>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              <Radio.Group
                value={natureMode}
                onChange={(e) => setNatureMode(e.target.value)}
                style={{ marginBottom: 12 }}
              >
                <Radio value="all">
                  <span style={{ fontWeight: 500 }}>All Nature of Projects</span>
                </Radio>
                <Radio value="specific">
                  <span style={{ fontWeight: 500 }}>Specific Nature of Projects / Groups</span>
                </Radio>
              </Radio.Group>

              {natureMode === "specific" && (
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: 8 }}>
                    Check group boxes to include all nature types inside, or toggle arrow to expand/collapse:
                  </div>

                  {treeData.length > 0 ? (
                    <Tree
                      checkable
                      showIcon={false}
                      treeData={treeData}
                      checkedKeys={checkedTreeKeys}
                      onCheck={(keys) => setCheckedTreeKeys(keys as React.Key[])}
                      expandedKeys={expandedTreeKeys}
                      onExpand={(keys) => setExpandedTreeKeys(keys)}
                      style={{ backgroundColor: "transparent" }}
                    />
                  ) : (
                    <div style={{ color: "#888", fontSize: "12px", textAlign: "center", padding: "12px 0" }}>
                      Loading Nature of Work groups...
                    </div>
                  )}

                  {activeNatureIds && (
                    <div style={{ marginTop: 8, fontSize: "12px", color: "#059669", fontWeight: 500 }}>
                      ✓ Includes {activeNatureIds.size} Nature of Work type(s) in export filter
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Space>
        </Col>

        {/* Right Column: Column Field Checkboxes (2 columns grid, NO scrollbar) & Live Summary */}
        <Col span={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Live Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm" size="small">
              <Row gutter={16} align="middle">
                <Col span={14}>
                  <Statistic
                    title="Projects Matching All Filters"
                    value={finalExportProjects.length}
                    prefix={<CheckCircleOutlined style={{ color: "#1677ff" }} />}
                    valueStyle={{ color: "#1e3a8a", fontWeight: 700 }}
                  />
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: 4 }}>
                    Statuses: {exportScope === "selected" ? "Selected" : selectedStatuses.join(", ")} | Columns: {selectedFields.length}
                  </div>
                </Col>
                <Col span={10} style={{ textAlign: "right" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    disabled={finalExportProjects.length === 0}
                  >
                    Export Now
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* 3. Fields / Data Columns Selection (No scrollbar, 2-column grid layout) */}
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <Space>
                    <TableOutlined className="text-indigo-600" />
                    <span>3. Select Columns to Export ({selectedFields.length})</span>
                  </Space>
                  <Space size={4}>
                    <Button size="small" type="link" onClick={handleSelectAllFields} style={{ padding: 0 }}>
                      Select All
                    </Button>
                    <span style={{ color: "#cbd5e1" }}>|</span>
                    <Button size="small" type="link" icon={<ReloadOutlined />} onClick={handleResetToTableFields} style={{ padding: 0 }}>
                      Reset
                    </Button>
                  </Space>
                </div>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: 12 }}>
                Default pre-selected from your active table view settings
              </div>

              {/* 2-Column Grid Layout with NO scrollbars */}
              <Row gutter={[12, 10]}>
                {exportableColumns.map((col) => {
                  const isChecked = selectedFields.includes(col.key);
                  const isTableVisible = visibleColumnKeys.includes(col.key);

                  return (
                    <Col span={12} key={col.key}>
                      <div
                        style={{
                          padding: "8px 12px",
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
                          <span style={{ fontSize: "13px", color: isChecked ? "#1e40af" : "#475569", fontWeight: isChecked ? 600 : 400 }}>
                            {col.title}
                          </span>
                        </Checkbox>

                        {isTableVisible && (
                          <Tooltip title="Currently visible in table">
                            <Tag color="cyan" style={{ fontSize: "10px", margin: 0, padding: "0 4px" }}>
                              Table Column
                            </Tag>
                          </Tooltip>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectExportPage;

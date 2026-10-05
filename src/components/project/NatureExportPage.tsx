import React, { useState, useMemo } from "react";
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
  Statistic,
  Tooltip,
  Select,
  Input,
  message,
  Segmented,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  TableOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  AppstoreOutlined,
  FolderOutlined,
  ApartmentOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  NatureOfWork,
  NatureOfWorkGroup,
} from "@/service/natureOfWork.service";
import {
  ALL_NATURE_OF_WORK_EXPORT_COLUMNS,
  ALL_NATURE_GROUP_EXPORT_COLUMNS,
  getSavedNatureExportColumns,
  saveNatureExportColumns,
  getSavedNatureGroupExportColumns,
  saveNatureGroupExportColumns,
  getSavedNaturePagination,
  saveNaturePagination,
} from "./natureColumnsConfig";

interface NatureExportPageProps {
  onBack: () => void;
  natures: NatureOfWork[];
  groups: NatureOfWorkGroup[];
  initialTab?: "nature" | "groups";
  isLoading?: boolean;
}

type ExportMode = "all" | "nature" | "groups";

export const NatureExportPage: React.FC<NatureExportPageProps> = ({
  onBack,
  natures = [],
  groups = [],
  initialTab = "nature",
  isLoading = false,
}) => {
  // 1. Export Mode State: 'all' (Multi-sheet workbook), 'nature' (Nature of work only), 'groups' (Groups only)
  const [exportMode, setExportMode] = useState<ExportMode>(
    initialTab === "groups" ? "groups" : "all"
  );

  // 2. Active Preview Tab (Nature vs Groups)
  const [activePreviewTab, setActivePreviewTab] = useState<"nature" | "groups">(
    initialTab === "groups" ? "groups" : "nature"
  );

  // 3. Status Filter: 'all' | 'active' | 'inactive'
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // 4. Group Filter: specific group IDs
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // 5. Selected Export Columns for Nature of Work & Groups
  const [selectedNatureFields, setSelectedNatureFields] = useState<string[]>(() =>
    getSavedNatureExportColumns()
  );
  const [selectedGroupFields, setSelectedGroupFields] = useState<string[]>(() =>
    getSavedNatureGroupExportColumns()
  );

  // 6. Column category tab
  const [activeNatureCategory, setActiveNatureCategory] = useState<string>("All");
  const [activeGroupCategory, setActiveGroupCategory] = useState<string>("All");

  // 7. Preview Search Input
  const [previewSearch, setPreviewSearch] = useState<string>("");

  // 8. Pagination Size
  const [pageSize, setPageSize] = useState<number>(() => getSavedNaturePagination(8));

  // Build group lookup map
  const groupMap = useMemo(() => {
    const map = new Map<string, NatureOfWorkGroup>();
    groups.forEach((g) => {
      map.set(g.id, g);
    });
    return map;
  }, [groups]);

  // Enriched Natures of Work
  const enrichedNatures = useMemo(() => {
    return natures.map((n, idx) => {
      const gId = n.groupId || n.group?.id;
      const grp = gId ? groupMap.get(gId) || n.group : null;
      const groupName = grp ? grp.name : "Unassigned / Standalone";
      const groupRank = grp?.rank ?? 0;
      const groupDescription = grp?.description || "-";

      return {
        ...n,
        rawId: n.id,
        sn: idx + 1,
        name: n.name,
        shortName: n.shortName || "-",
        groupName,
        groupRank,
        groupDescription,
        status: n.isActive === false ? "Inactive" : "Active",
        isActiveBool: n.isActive !== false,
        createdAtStr: n.createdAt ? dayjs(n.createdAt).format("YYYY-MM-DD HH:mm") : "-",
        updatedAtStr: n.updatedAt ? dayjs(n.updatedAt).format("YYYY-MM-DD HH:mm") : "-",
      };
    });
  }, [natures, groupMap]);

  // Enriched Groups
  const enrichedGroups = useMemo(() => {
    return groups.map((g, idx) => {
      // Find all project types attached to this group
      const attachedNatures = natures.filter((n) => (n.groupId || n.group?.id) === g.id);
      const activeAttached = attachedNatures.filter((n) => n.isActive !== false);
      const naturesNames = attachedNatures.map((n) => n.name).join(", ") || "-";

      return {
        ...g,
        rawId: g.id,
        sn: idx + 1,
        name: g.name,
        description: g.description || "-",
        rank: g.rank ?? 0,
        naturesCount: attachedNatures.length,
        activeNaturesCount: activeAttached.length,
        naturesList: naturesNames,
        attachedNatures,
        createdAtStr: g.createdAt ? dayjs(g.createdAt).format("YYYY-MM-DD HH:mm") : "-",
        updatedAtStr: g.updatedAt ? dayjs(g.updatedAt).format("YYYY-MM-DD HH:mm") : "-",
      };
    });
  }, [groups, natures]);

  // Filtered Natures based on Status and Group selection
  const filteredNatures = useMemo(() => {
    let list = [...enrichedNatures];

    // Status filter
    if (statusFilter === "active") {
      list = list.filter((n) => n.isActiveBool);
    } else if (statusFilter === "inactive") {
      list = list.filter((n) => !n.isActiveBool);
    }

    // Group filter
    if (selectedGroupIds.length > 0) {
      list = list.filter((n) => {
        const gId = n.groupId || n.group?.id;
        if (selectedGroupIds.includes("unassigned") && !gId) return true;
        return gId && selectedGroupIds.includes(gId);
      });
    }

    return list;
  }, [enrichedNatures, statusFilter, selectedGroupIds]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    let list = [...enrichedGroups];
    if (selectedGroupIds.length > 0) {
      list = list.filter((g) => selectedGroupIds.includes(g.id));
    }
    return list;
  }, [enrichedGroups, selectedGroupIds]);

  // Preview Items filtered by search text
  const previewNatureItems = useMemo(() => {
    if (!previewSearch.trim()) return filteredNatures;
    const q = previewSearch.trim().toLowerCase();
    return filteredNatures.filter((n) => {
      const name = (n.name || "").toLowerCase();
      const code = (n.shortName || "").toLowerCase();
      const grp = (n.groupName || "").toLowerCase();
      const st = (n.status || "").toLowerCase();
      return name.includes(q) || code.includes(q) || grp.includes(q) || st.includes(q);
    });
  }, [filteredNatures, previewSearch]);

  const previewGroupItems = useMemo(() => {
    if (!previewSearch.trim()) return filteredGroups;
    const q = previewSearch.trim().toLowerCase();
    return filteredGroups.filter((g) => {
      const name = (g.name || "").toLowerCase();
      const desc = (g.description || "").toLowerCase();
      const list = (g.naturesList || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || list.includes(q);
    });
  }, [filteredGroups, previewSearch]);

  // Column Toggles
  const handleToggleNatureField = (key: string, checked: boolean) => {
    let next: string[];
    if (checked) {
      next = [...selectedNatureFields, key];
    } else {
      next = selectedNatureFields.filter((k) => k !== key);
    }
    setSelectedNatureFields(next);
    saveNatureExportColumns(next);
  };

  const handleSelectAllNatureFields = () => {
    const allKeys = ALL_NATURE_OF_WORK_EXPORT_COLUMNS.map((c) => c.key);
    setSelectedNatureFields(allKeys);
    saveNatureExportColumns(allKeys);
  };

  const handleResetNatureFields = () => {
    const defaultKeys = ALL_NATURE_OF_WORK_EXPORT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    setSelectedNatureFields(defaultKeys);
    saveNatureExportColumns(defaultKeys);
  };

  const handleToggleGroupField = (key: string, checked: boolean) => {
    let next: string[];
    if (checked) {
      next = [...selectedGroupFields, key];
    } else {
      next = selectedGroupFields.filter((k) => k !== key);
    }
    setSelectedGroupFields(next);
    saveNatureGroupExportColumns(next);
  };

  const handleSelectAllGroupFields = () => {
    const allKeys = ALL_NATURE_GROUP_EXPORT_COLUMNS.map((c) => c.key);
    setSelectedGroupFields(allKeys);
    saveNatureGroupExportColumns(allKeys);
  };

  const handleResetGroupFields = () => {
    const defaultKeys = ALL_NATURE_GROUP_EXPORT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    setSelectedGroupFields(defaultKeys);
    saveNatureGroupExportColumns(defaultKeys);
  };

  // Group Dropdown Options
  const groupSelectOptions = useMemo(() => {
    const opts = groups.map((g) => ({
      value: g.id,
      label: `📁 ${g.name} (Rank: ${g.rank ?? 0})`,
    }));
    opts.push({
      value: "unassigned",
      label: "📁 Unassigned / No Group",
    });
    return opts;
  }, [groups]);

  // Worksheet auto-column width helper
  const createSheetWithColWidths = (data: any[], fallbackHeaders?: string[]) => {
    let ws: XLSX.WorkSheet;
    if (!data || data.length === 0) {
      ws = XLSX.utils.json_to_sheet(
        fallbackHeaders ? [fallbackHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {})] : [{ Info: "No Records" }]
      );
      return ws;
    }
    ws = XLSX.utils.json_to_sheet(data);

    const keys = Object.keys(data[0] || {});
    const colWidths = keys.map((key) => {
      let maxLen = key.length;
      data.forEach((row) => {
        const val = row[key];
        if (val !== null && val !== undefined) {
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = Math.min(str.length, 55);
          }
        }
      });
      return { wch: Math.max(maxLen + 3, 12) };
    });
    ws["!cols"] = colWidths;
    return ws;
  };

  // Execute Excel Export
  const handleExportExcel = () => {
    if (exportMode === "nature" && filteredNatures.length === 0) {
      message.warning("No nature of work records match the selected criteria.");
      return;
    }
    if (exportMode === "groups" && filteredGroups.length === 0) {
      message.warning("No group records match the selected criteria.");
      return;
    }
    if (exportMode === "all" && filteredNatures.length === 0 && filteredGroups.length === 0) {
      message.warning("No records found to export.");
      return;
    }

    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    const fileName = `Nature_Of_Work_Export_${exportMode}_${timestamp}.xlsx`;

    const workbook = XLSX.utils.book_new();

    // 1. Prepare Nature of Work Data
    if (exportMode === "all" || exportMode === "nature") {
      const orderedNatureCols = ALL_NATURE_OF_WORK_EXPORT_COLUMNS.filter((c) =>
        selectedNatureFields.includes(c.key)
      );

      const natureRows = filteredNatures.map((n, index) => {
        const row: Record<string, any> = {
          "S.N.": index + 1,
        };

        orderedNatureCols.forEach((col) => {
          switch (col.key) {
            case "name":
              row[col.title] = n.name;
              break;
            case "shortName":
              row[col.title] = n.shortName;
              break;
            case "status":
              row[col.title] = n.status;
              break;
            case "groupName":
              row[col.title] = n.groupName;
              break;
            case "groupRank":
              row[col.title] = n.groupRank;
              break;
            case "groupDescription":
              row[col.title] = n.groupDescription;
              break;
            case "createdAt":
              row[col.title] = n.createdAtStr;
              break;
            case "updatedAt":
              row[col.title] = n.updatedAtStr;
              break;
            default:
              row[col.title] = (n as any)[col.key] || "-";
          }
        });

        return row;
      });

      const natureSheet = createSheetWithColWidths(natureRows);
      XLSX.utils.book_append_sheet(workbook, natureSheet, "Nature of Work");
    }

    // 2. Prepare Nature Groups Data
    if (exportMode === "all" || exportMode === "groups") {
      const orderedGroupCols = ALL_NATURE_GROUP_EXPORT_COLUMNS.filter((c) =>
        selectedGroupFields.includes(c.key)
      );

      const groupRows = filteredGroups.map((g, index) => {
        const row: Record<string, any> = {
          "S.N.": index + 1,
        };

        orderedGroupCols.forEach((col) => {
          switch (col.key) {
            case "name":
              row[col.title] = g.name;
              break;
            case "description":
              row[col.title] = g.description;
              break;
            case "rank":
              row[col.title] = g.rank;
              break;
            case "naturesCount":
              row[col.title] = g.naturesCount;
              break;
            case "naturesList":
              row[col.title] = g.naturesList;
              break;
            case "createdAt":
              row[col.title] = g.createdAtStr;
              break;
            case "updatedAt":
              row[col.title] = g.updatedAtStr;
              break;
            default:
              row[col.title] = (g as any)[col.key] || "-";
          }
        });

        return row;
      });

      const groupSheet = createSheetWithColWidths(groupRows);
      XLSX.utils.book_append_sheet(workbook, groupSheet, "Nature Groups");
    }

    // 3. Prepare Hierarchical Mapping Sheet (for Combined Mode)
    if (exportMode === "all") {
      const mappingRows: any[] = [];
      let sn = 1;

      // Grouped entries
      filteredGroups.forEach((g) => {
        const children = filteredNatures.filter((n) => (n.groupId || n.group?.id) === g.id);
        if (children.length > 0) {
          children.forEach((c) => {
            mappingRows.push({
              "S.N.": sn++,
              "Group Name": g.name,
              "Group Rank": g.rank,
              "Group Description": g.description,
              "Nature of Work Name": c.name,
              "Short Code": c.shortName,
              "Status": c.status,
            });
          });
        } else {
          mappingRows.push({
            "S.N.": sn++,
            "Group Name": g.name,
            "Group Rank": g.rank,
            "Group Description": g.description,
            "Nature of Work Name": "No Project Types Assigned",
            "Short Code": "-",
            "Status": "-",
          });
        }
      });

      // Unassigned entries
      const unassignedNatures = filteredNatures.filter((n) => !n.groupId && !n.group?.id);
      unassignedNatures.forEach((u) => {
        mappingRows.push({
          "S.N.": sn++,
          "Group Name": "Unassigned / Standalone",
          "Group Rank": 999,
          "Group Description": "-",
          "Nature of Work Name": u.name,
          "Short Code": u.shortName,
          "Status": u.status,
        });
      });

      const mappingSheet = createSheetWithColWidths(mappingRows);
      XLSX.utils.book_append_sheet(workbook, mappingSheet, "Hierarchy & Mapping");
    }

    XLSX.writeFile(workbook, fileName);
    message.success(
      `Successfully exported ${
        exportMode === "all"
          ? `${filteredNatures.length} natures and ${filteredGroups.length} groups`
          : exportMode === "nature"
          ? `${filteredNatures.length} nature of work records`
          : `${filteredGroups.length} nature groups`
      } to Excel!`
    );
  };

  // Visible column pills
  const visibleNatureColumnPills = useMemo(() => {
    if (activeNatureCategory === "All") return ALL_NATURE_OF_WORK_EXPORT_COLUMNS;
    return ALL_NATURE_OF_WORK_EXPORT_COLUMNS.filter((c) => c.category === activeNatureCategory);
  }, [activeNatureCategory]);

  const visibleGroupColumnPills = useMemo(() => {
    if (activeGroupCategory === "All") return ALL_NATURE_GROUP_EXPORT_COLUMNS;
    return ALL_NATURE_GROUP_EXPORT_COLUMNS.filter((c) => c.category === activeGroupCategory);
  }, [activeGroupCategory]);

  // Clean, focused columns for Nature of Work Preview (NO junkies!)
  const naturePreviewColumns = useMemo(() => {
    return [
      {
        title: "S.N.",
        key: "sn",
        width: 60,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Nature of Work",
        dataIndex: "name",
        key: "name",
        render: (name: string, record: any) => (
          <div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{name}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Code: {record.shortName}</div>
          </div>
        ),
      },
      {
        title: "Short Code",
        dataIndex: "shortName",
        key: "shortName",
        width: 110,
        render: (code: string) => (
          <Tag color="geekblue" style={{ fontWeight: 600, fontFamily: "monospace" }}>
            {code}
          </Tag>
        ),
      },
      {
        title: "Parent Group",
        dataIndex: "groupName",
        key: "groupName",
        width: 200,
        render: (gName: string, record: any) => (
          <div>
            <Tag color={gName.includes("Unassigned") ? "default" : "blue"} style={{ fontSize: 11 }}>
              📁 {gName}
            </Tag>
            {record.groupRank !== undefined && record.groupRank !== 0 && (
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>
                Rank #{record.groupRank}
              </span>
            )}
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        align: "center" as const,
        render: (st: string) => (
          <Tag color={st === "Active" ? "green" : "default"}>{st.toUpperCase()}</Tag>
        ),
      },
      {
        title: "Created Date",
        dataIndex: "createdAtStr",
        key: "createdAt",
        width: 140,
        render: (d: string) => <span style={{ fontSize: 12, color: "#64748b" }}>{d}</span>,
      },
    ];
  }, []);

  // Clean, focused columns for Nature Groups Preview (NO junkies!)
  const groupPreviewColumns = useMemo(() => {
    return [
      {
        title: "S.N.",
        key: "sn",
        width: 60,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Group Name",
        dataIndex: "name",
        key: "name",
        render: (name: string, record: any) => (
          <div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>📁 {name}</div>
            {record.description && record.description !== "-" && (
              <div style={{ fontSize: 11, color: "#64748b" }} className="truncate max-w-[280px]">
                {record.description}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Display Rank",
        dataIndex: "rank",
        key: "rank",
        width: 120,
        align: "center" as const,
        render: (r: number) => (
          <Tag color="cyan" style={{ fontWeight: 600 }}>
            Rank #{r}
          </Tag>
        ),
      },
      {
        title: "Attached Project Types",
        key: "attachedNatures",
        render: (_: any, record: any) => (
          <div>
            <Tag color={record.naturesCount > 0 ? "blue" : "default"} style={{ marginBottom: 2 }}>
              {record.naturesCount} {record.naturesCount === 1 ? "Type" : "Types"}
            </Tag>
            {record.naturesCount > 0 && (
              <Tooltip title={record.naturesList}>
                <div style={{ fontSize: 11, color: "#475569" }} className="truncate max-w-[260px]">
                  {record.naturesList}
                </div>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        title: "Created Date",
        dataIndex: "createdAtStr",
        key: "createdAt",
        width: 140,
        render: (d: string) => <span style={{ fontSize: 12, color: "#64748b" }}>{d}</span>,
      },
    ];
  }, []);

  return (
    <div className="pb-16 sm:pb-0 px-2 sm:px-0">
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Space size={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="large">
            Back to Project Settings
          </Button>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
              Nature of Work & Groups Export Helper
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
              Download project work categories, nature groups, and hierarchical mappings in structured Excel sheets
            </div>
          </div>
        </Space>
      </div>

      {/* 2-Column Main Section */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Scope, Mode & Filters */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Card 1: Export Scope & Mode */}
            <Card
              title={
                <Space>
                  <AppstoreOutlined className="text-blue-600" />
                  <span style={{ fontWeight: 600 }}>1. Choose Export Scope & Target</span>
                </Space>
              }
              size="small"
              style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            >
              {/* Export Mode Segmented */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Target Workbook Output:
                </div>
                <Segmented
                  options={[
                    { label: "📦 Combined (Work + Groups + Mapping)", value: "all" },
                    { label: "🏷️ Nature of Work", value: "nature" },
                    { label: "📁 Nature Groups", value: "groups" },
                  ]}
                  value={exportMode}
                  onChange={(val) => {
                    const m = val as ExportMode;
                    setExportMode(m);
                    if (m === "groups") setActivePreviewTab("groups");
                    else if (m === "nature") setActivePreviewTab("nature");
                  }}
                  block
                  style={{ marginBottom: 12 }}
                />
              </div>

              {/* Status and Group Filters */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                <Row gutter={[16, 12]}>
                  {/* Status Filter */}
                  <Col span={12}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                      Status Filter:
                    </div>
                    <Segmented
                      options={[
                        { label: "All", value: "all" },
                        { label: "Active", value: "active" },
                        { label: "Inactive", value: "inactive" },
                      ]}
                      value={statusFilter}
                      onChange={(val) => setStatusFilter(val as any)}
                      block
                      size="small"
                    />
                  </Col>

                  {/* Filter by Group */}
                  <Col span={12}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                      Filter by Nature Group:
                    </div>
                    <Select
                      mode="multiple"
                      placeholder="All Groups"
                      value={selectedGroupIds}
                      onChange={setSelectedGroupIds}
                      options={groupSelectOptions}
                      allowClear
                      style={{ width: "100%" }}
                      maxTagCount="responsive"
                      size="middle"
                    />
                  </Col>
                </Row>
              </div>
            </Card>
          </Space>
        </Col>

        {/* Right Column: Live Summary & Select Columns */}
        <Col xs={24} lg={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* Live Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm" size="small">
              <Row gutter={16} align="middle">
                <Col span={14}>
                  <Statistic
                    title="Records Ready for Export"
                    value={
                      exportMode === "groups"
                        ? filteredGroups.length
                        : exportMode === "nature"
                        ? filteredNatures.length
                        : `${filteredNatures.length} Natures + ${filteredGroups.length} Groups`
                    }
                    prefix={<CheckCircleOutlined style={{ color: "#1677ff" }} />}
                    valueStyle={{ color: "#1e3a8a", fontWeight: 700, fontSize: "20px" }}
                  />
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: 4 }}>
                    Natures: {filteredNatures.length} ({filteredNatures.filter((n) => n.isActiveBool).length} active) | Groups: {filteredGroups.length}
                  </div>
                </Col>
                <Col span={10} style={{ textAlign: "right" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    disabled={filteredNatures.length === 0 && filteredGroups.length === 0}
                    style={{
                      borderRadius: "6px",
                      backgroundColor: "#21a366",
                      borderColor: "#21a366",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(33, 163, 102, 0.35)",
                    }}
                  >
                    Export to Excel
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Select Columns Card */}
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <Space>
                    <TableOutlined className="text-indigo-600" />
                    <span style={{ fontWeight: 600 }}>
                      2. Select Columns ({exportMode === "groups" ? selectedGroupFields.length : selectedNatureFields.length})
                    </span>
                  </Space>
                  <Space size={4}>
                    <Button
                      size="small"
                      type="link"
                      onClick={exportMode === "groups" ? handleSelectAllGroupFields : handleSelectAllNatureFields}
                      style={{ padding: 0 }}
                    >
                      Select All
                    </Button>
                    <span style={{ color: "#cbd5e1" }}>|</span>
                    <Button
                      size="small"
                      type="link"
                      onClick={exportMode === "groups" ? handleResetGroupFields : handleResetNatureFields}
                      style={{ padding: 0 }}
                    >
                      Reset
                    </Button>
                  </Space>
                </div>
              }
              size="small"
              style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            >
              {exportMode !== "groups" ? (
                <>
                  <Segmented
                    options={["All", "General", "Group Info", "Audit"]}
                    value={activeNatureCategory}
                    onChange={(val) => setActiveNatureCategory(val as string)}
                    block
                    size="small"
                    style={{ marginBottom: 12 }}
                  />
                  <Row gutter={[8, 8]} style={{ maxHeight: "200px", overflowY: "auto", paddingRight: 4 }}>
                    {visibleNatureColumnPills.map((col) => {
                      const isChecked = selectedNatureFields.includes(col.key);
                      return (
                        <Col span={12} key={col.key}>
                          <div
                            style={{
                              padding: "7px 10px",
                              borderRadius: 6,
                              border: "1px solid",
                              borderColor: isChecked ? "#93c5fd" : "#f1f5f9",
                              backgroundColor: isChecked ? "#eff6ff" : "#f8fafc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                            }}
                            onClick={() => handleToggleNatureField(col.key, !isChecked)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => handleToggleNatureField(col.key, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={col.required}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: isChecked ? "#1e40af" : "#475569",
                                  fontWeight: isChecked ? 600 : 400,
                                }}
                              >
                                {col.title}
                              </span>
                            </Checkbox>
                            {col.required && (
                              <Tag color="blue" style={{ fontSize: "10px", margin: 0, padding: "0 4px" }}>
                                Required
                              </Tag>
                            )}
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </>
              ) : (
                <>
                  <Segmented
                    options={["All", "General", "Group Info", "Audit"]}
                    value={activeGroupCategory}
                    onChange={(val) => setActiveGroupCategory(val as string)}
                    block
                    size="small"
                    style={{ marginBottom: 12 }}
                  />
                  <Row gutter={[8, 8]} style={{ maxHeight: "200px", overflowY: "auto", paddingRight: 4 }}>
                    {visibleGroupColumnPills.map((col) => {
                      const isChecked = selectedGroupFields.includes(col.key);
                      return (
                        <Col span={12} key={col.key}>
                          <div
                            style={{
                              padding: "7px 10px",
                              borderRadius: 6,
                              border: "1px solid",
                              borderColor: isChecked ? "#93c5fd" : "#f1f5f9",
                              backgroundColor: isChecked ? "#eff6ff" : "#f8fafc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                            }}
                            onClick={() => handleToggleGroupField(col.key, !isChecked)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => handleToggleGroupField(col.key, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={col.required}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: isChecked ? "#1e40af" : "#475569",
                                  fontWeight: isChecked ? 600 : 400,
                                }}
                              >
                                {col.title}
                              </span>
                            </Checkbox>
                            {col.required && (
                              <Tag color="blue" style={{ fontSize: "10px", margin: 0, padding: "0 4px" }}>
                                Required
                              </Tag>
                            )}
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </>
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* 3. Clean, Human-Readable Live Data Preview (NO Junkies!) */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Space>
              <TableOutlined style={{ color: "#1677ff" }} />
              <span style={{ fontWeight: 600 }}>
                3. Live Data Preview (
                {activePreviewTab === "nature"
                  ? `${previewNatureItems.length} Project Types`
                  : `${previewGroupItems.length} Groups`}
                )
              </span>
              <Segmented
                options={[
                  { label: "🏷️ Nature of Work", value: "nature" },
                  { label: "📁 Nature Groups", value: "groups" },
                ]}
                value={activePreviewTab}
                onChange={(val) => setActivePreviewTab(val as any)}
                size="small"
              />
            </Space>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search preview by name, code, group..."
              value={previewSearch}
              onChange={(e) => setPreviewSearch(e.target.value)}
              allowClear
              style={{ width: 280 }}
              size="small"
            />
          </div>
        }
        size="small"
        style={{ borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: 20 }}
      >
        {activePreviewTab === "nature" ? (
          <Table
            dataSource={previewNatureItems}
            columns={naturePreviewColumns}
            rowKey={(r) => r.rawId}
            size="small"
            loading={isLoading}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["8", "15", "30", "50"],
              onShowSizeChange: (_curr, size) => {
                setPageSize(size);
                saveNaturePagination(size);
              },
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} project types`,
            }}
          />
        ) : (
          <Table
            dataSource={previewGroupItems}
            columns={groupPreviewColumns}
            rowKey={(r) => r.rawId}
            size="small"
            loading={isLoading}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["8", "15", "30", "50"],
              onShowSizeChange: (_curr, size) => {
                setPageSize(size);
                saveNaturePagination(size);
              },
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} groups`,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default NatureExportPage;

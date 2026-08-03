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
  Divider,
  Alert,
  Statistic,
  Tooltip,
  Select,
  message
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FilterOutlined,
  TableOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  UsergroupAddOutlined,
  KeyOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

interface ClientExportPageProps {
  onBack: () => void;
  selectedClients: any[];
  allClients: any[];
  activeTabKey: string;
}

const CLIENT_COLUMNS = [
  { key: "name", title: "Client Name", defaultVisible: true },
  { key: "shortName", title: "Short Name", defaultVisible: true },
  { key: "panNo", title: "PAN Number", defaultVisible: true },
  { key: "status", title: "Status", defaultVisible: true },
  { key: "legalStatus", title: "Legal Status", defaultVisible: true },
  { key: "businessSize", title: "Business Size", defaultVisible: true },
  { key: "industryNature", title: "Industry / Business Nature", defaultVisible: true },
  { key: "registeredDate", title: "Registered Date", defaultVisible: true },
  { key: "contactPhone", title: "Phone Number", defaultVisible: true },
  { key: "contactEmail", title: "Email Address", defaultVisible: true },
  { key: "country", title: "Country", defaultVisible: false },
  { key: "state", title: "State / Province", defaultVisible: false },
  { key: "district", title: "District", defaultVisible: false },
  { key: "localJurisdiction", title: "Local Jurisdiction", defaultVisible: false },
  { key: "wardNo", title: "Ward No.", defaultVisible: false },
  { key: "locality", title: "Locality / Street", defaultVisible: false },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "blue" },
  { value: "suspended", label: "Suspended", color: "orange" },
  { value: "archive", label: "Archived", color: "volcano" },
];

const ClientExportPage: React.FC<ClientExportPageProps> = ({
  onBack,
  selectedClients,
  allClients,
  activeTabKey,
}) => {
  const hasSelected = selectedClients.length > 0;

  // 1. Export Scope State: 'selected' | 'filtered'
  const [exportScope, setExportScope] = useState<"selected" | "filtered">(
    hasSelected ? "selected" : "filtered"
  );

  // 2. Status Scope Selection
  const initialStatus = activeTabKey || "active";
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([initialStatus]);

  // 3. Filters for Legal Status and Industry Nature
  const [selectedLegalStatuses, setSelectedLegalStatuses] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Pre-select fields
  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    CLIENT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
  );

  // Derive unique legal statuses and industry natures from clients data
  const legalStatusOptions = useMemo(() => {
    const set = new Set<string>();
    allClients?.forEach((c: any) => {
      const val = c.legalStatus?.name || c.legalStatusEnum;
      if (val) set.add(val);
    });
    return Array.from(set).map((val) => ({
      value: val,
      label: val.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  }, [allClients]);

  const industryNatureOptions = useMemo(() => {
    const set = new Set<string>();
    allClients?.forEach((c: any) => {
      const val = c.industryNature?.name || c.industryNatureEnum;
      if (val) set.add(val);
    });
    return Array.from(set).map((val) => ({
      value: val,
      label: val.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  }, [allClients]);

  // Status handlers
  const handleSelectAllStatuses = () => {
    setSelectedStatuses(STATUS_OPTIONS.map((s) => s.value));
  };

  const handleClearStatuses = () => {
    setSelectedStatuses([]);
  };

  // Field Selection Handlers
  const handleSelectAllFields = () => {
    setSelectedFields(CLIENT_COLUMNS.map((c) => c.key));
  };

  const handleResetFields = () => {
    setSelectedFields(CLIENT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
  };

  const handleToggleField = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedFields((prev) => [...prev, key]);
    } else {
      setSelectedFields((prev) => prev.filter((k) => k !== key));
    }
  };

  // 4. Calculate Final Filtered Clients List to Export
  const finalExportClients = useMemo(() => {
    if (!allClients) return [];

    let list = exportScope === "selected" ? [...selectedClients] : [...allClients];

    if (exportScope === "filtered") {
      if (selectedStatuses.length > 0) {
        list = list.filter((c: any) => selectedStatuses.includes(c.status));
      }
    }

    // Apply Legal Status filter
    if (selectedLegalStatuses.length > 0) {
      list = list.filter((c: any) => {
        const val = c.legalStatus?.name || c.legalStatusEnum;
        return val && selectedLegalStatuses.includes(val);
      });
    }

    // Apply Industry Nature filter
    if (selectedIndustries.length > 0) {
      list = list.filter((c: any) => {
        const val = c.industryNature?.name || c.industryNatureEnum;
        return val && selectedIndustries.includes(val);
      });
    }

    return list;
  }, [allClients, selectedClients, exportScope, selectedStatuses, selectedLegalStatuses, selectedIndustries]);

  // Format Helper for Legal Status / Industry
  const formatEnumText = (val?: string) => {
    if (!val) return "-";
    return val.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Execute Excel Export
  const handleExportExcel = () => {
    if (finalExportClients.length === 0) {
      message.warning("No clients match the selected criteria to export.");
      return;
    }

    if (selectedFields.length === 0) {
      message.warning("Please select at least one field/column to export.");
      return;
    }

    const orderedSelectedFields = CLIENT_COLUMNS
      .filter((c) => selectedFields.includes(c.key))
      .map((c) => c.key);

    const formattedRows = finalExportClients.map((c: any) => {
      const row: Record<string, any> = {};

      orderedSelectedFields.forEach((fieldKey) => {
        const colDef = CLIENT_COLUMNS.find((col) => col.key === fieldKey);
        const title = colDef ? colDef.title : fieldKey;

        switch (fieldKey) {
          case "name":
            row[title] = c.name || "-";
            break;
          case "shortName":
            row[title] = c.shortName || "-";
            break;
          case "panNo":
            row[title] = c.panNo || "-";
            break;
          case "status":
            row[title] = c.status ? c.status.toUpperCase() : "-";
            break;
          case "legalStatus":
            row[title] = c.legalStatus?.name || formatEnumText(c.legalStatusEnum);
            break;
          case "businessSize":
            row[title] = c.businessSize?.name || formatEnumText(c.businessSizeEnum);
            break;
          case "industryNature":
            row[title] = c.industryNature?.name || formatEnumText(c.industryNatureEnum);
            break;
          case "registeredDate":
            row[title] = c.registeredDate ? dayjs(c.registeredDate).format("YYYY-MM-DD") : "-";
            break;
          case "contactPhone":
            row[title] = c.mobileNo || c.telephoneNo || c.phone || "-";
            break;
          case "contactEmail":
            row[title] = c.email || "-";
            break;
          case "country":
            row[title] = c.country || "-";
            break;
          case "state":
            row[title] = c.state || "-";
            break;
          case "district":
            row[title] = c.district || "-";
            break;
          case "localJurisdiction":
            row[title] = c.localJurisdiction || "-";
            break;
          case "wardNo":
            row[title] = c.wardNo || "-";
            break;
          case "locality":
            row[title] = c.locality || "-";
            break;
          default:
            row[title] = c[fieldKey] !== undefined && c[fieldKey] !== null ? String(c[fieldKey]) : "-";
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

      const scopeName = exportScope === "selected" ? "Selected" : "Custom_Scope";
      const filename = `Artha_Clients_${scopeName}_${dayjs().format("YYYY-MM-DD")}.xlsx`;

      XLSX.writeFile(workbook, filename);
      message.success(`Successfully exported ${finalExportClients.length} client(s) to Excel!`);
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
              Client Export & Download Helper
            </h1>
            <p className="text-xs text-slate-500 m-0">
              Configure target clients, legal status, industry filters, and columns to export as Excel
            </p>
          </div>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        {/* Left Column: Scope, Status, and Filter Controls */}
        <Col span={12}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {/* 1. Scope & Status Selection */}
            <Card
              title={
                <Space>
                  <AppstoreOutlined className="text-blue-600" />
                  <span>1. Choose Client Scope & Status Filters</span>
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
                          Selected Clients ({selectedClients.length})
                        </span>
                        {!hasSelected && (
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>
                            (Check checkbox in main table to select)
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
                          All Clients in Scope ({allClients?.length || 0})
                        </span>
                      </Radio>
                    </Card>
                  </Col>
                </Row>
              </Radio.Group>

              {/* Status Selector Checkboxes */}
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

              {/* Selected Clients Preview Table */}
              {exportScope === "selected" && (
                <div style={{ marginTop: 12 }}>
                  <Table
                    dataSource={selectedClients}
                    rowKey={(r: any) => r.id?.toString() || Math.random().toString()}
                    pagination={false}
                    size="small"
                    scroll={{ y: 150 }}
                    columns={[
                      {
                        title: "Client Name",
                        dataIndex: "name",
                        key: "name",
                        render: (name: string) => <strong style={{ color: "#1e293b" }}>{name}</strong>,
                      },
                      {
                        title: "PAN No.",
                        dataIndex: "panNo",
                        key: "panNo",
                        render: (pan: string) => pan || "-",
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

            {/* 2. Legal Status & Industry Nature Filters */}
            <Card
              title={
                <Space>
                  <FilterOutlined className="text-emerald-600" />
                  <span>2. Filter by Legal Status & Industry Nature</span>
                </Space>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    Filter by Legal Status:
                  </div>
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="All Legal Statuses"
                    value={selectedLegalStatuses}
                    onChange={setSelectedLegalStatuses}
                    options={legalStatusOptions}
                    allowClear
                    maxTagCount="responsive"
                  />
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    Filter by Industry Nature:
                  </div>
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="All Industry Natures"
                    value={selectedIndustries}
                    onChange={setSelectedIndustries}
                    options={industryNatureOptions}
                    allowClear
                    maxTagCount="responsive"
                  />
                </Col>
              </Row>
            </Card>

            {/* Explanatory Info Card: Client Users vs Portal/IRD Credentials */}
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message="Client Data & Credential Distinction"
              description={
                <div style={{ fontSize: "12px" }}>
                  <div>
                    <UsergroupAddOutlined style={{ marginRight: 6, color: "#1677ff" }} />
                    <strong>Client Contact Users:</strong> Contact persons / staff associated with client companies (managed in <i>Client Users</i>).
                  </div>
                </div>
              }
            />
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
                    title="Clients Matching Export Criteria"
                    value={finalExportClients.length}
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
                    disabled={finalExportClients.length === 0}
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
                    <Button size="small" type="link" icon={<ReloadOutlined />} onClick={handleResetFields} style={{ padding: 0 }}>
                      Reset
                    </Button>
                  </Space>
                </div>
              }
              size="small"
              className="shadow-sm border-slate-200"
            >
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: 12 }}>
                Default pre-selected from standard client list columns
              </div>

              {/* 2-Column Grid Layout with NO scrollbars */}
              <Row gutter={[12, 10]}>
                {CLIENT_COLUMNS.map((col) => {
                  const isChecked = selectedFields.includes(col.key);

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

export default ClientExportPage;

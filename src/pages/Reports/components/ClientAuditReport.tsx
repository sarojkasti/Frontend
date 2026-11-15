import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Avatar,
  Space,
  Badge,
  Input,
  Tooltip,
  Empty,
  Spin,
  Tabs,
  Modal,
  Select,
  Progress,
  message,
  Table,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  SearchOutlined,
  ApartmentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  DiffOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useDuplicationAuditReport } from "@/hooks/client/useClientSimilarity";
import { useClientGroups, useAssignClientsToGroup, useCreateClientGroup } from "@/hooks/clientGroup/useClientGroups";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Title, Text, Paragraph } = Typography;

interface ClientAuditReportProps {
  onBack?: () => void;
}

export const ClientAuditReport: React.FC<ClientAuditReportProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();

  const [activeTab, setActiveTab] = useState<string>("duplicates");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Grouping modal state for 1-click grouping
  const [groupingModalVisible, setGroupingModalVisible] = useState(false);
  const [pairToGroup, setPairToGroup] = useState<any | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState<boolean>(false);

  // Queries & Mutations
  const { data: reportData, isLoading, refetch, isFetching } = useDuplicationAuditReport();
  const { data: clientGroups = [] } = useClientGroups();
  const assignClientsMutation = useAssignClientsToGroup();
  const createGroupMutation = useCreateClientGroup();

  // Summary Metrics
  const summary = reportData?.summary || {
    totalClients: 0,
    clientsInGroups: 0,
    standaloneClients: 0,
    potentialDuplicatePairs: 0,
  };

  // Filter duplicate pairs by search query
  const filteredPairs = useMemo(() => {
    const pairs: any[] = reportData?.duplicatePairs || [];
    if (!searchQuery.trim()) return pairs;
    const q = searchQuery.toLowerCase();
    return pairs.filter(
      (p) =>
        p.clientA?.name?.toLowerCase().includes(q) ||
        p.clientB?.name?.toLowerCase().includes(q) ||
        p.clientA?.panNo?.includes(q) ||
        p.clientB?.panNo?.includes(q) ||
        p.reason?.toLowerCase().includes(q)
    );
  }, [reportData?.duplicatePairs, searchQuery]);

  // Filter audit list
  const filteredAuditList = useMemo(() => {
    const list: any[] = reportData?.auditList || [];
    return list.filter((item) => {
      // Group filter
      if (groupFilter === "grouped" && !item.clientGroup) return false;
      if (groupFilter === "standalone" && item.clientGroup) return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.shortName?.toLowerCase().includes(q) ||
        item.panNo?.includes(q) ||
        item.creator?.name?.toLowerCase().includes(q) ||
        item.updater?.name?.toLowerCase().includes(q) ||
        item.lastEditReason?.toLowerCase().includes(q) ||
        item.clientGroup?.name?.toLowerCase().includes(q)
      );
    });
  }, [reportData?.auditList, searchQuery, groupFilter]);

  // Open 1-click Grouping Modal for a duplicate pair
  const handleOpenGroupModal = (pair: any) => {
    setPairToGroup(pair);
    // If one of the clients is already in a group, pre-select that group!
    const existingGroupId = pair.clientA?.clientGroup?.id || pair.clientB?.clientGroup?.id;
    if (existingGroupId) {
      setSelectedGroupId(existingGroupId);
      setIsCreatingNewGroup(false);
    } else {
      setSelectedGroupId(undefined);
      // Auto-suggest group name from common prefix
      const nameA = pair.clientA?.name || "";
      const commonPrefix = nameA.split(" ")[0] || "";
      setNewGroupName(commonPrefix ? `${commonPrefix} Group` : "");
      setIsCreatingNewGroup(false);
    }
    setGroupingModalVisible(true);
  };

  // Submit 1-click grouping
  const handleConfirmGrouping = async () => {
    if (!pairToGroup) return;
    const clientIds = [pairToGroup.clientA.id, pairToGroup.clientB.id];

    try {
      let targetGroupId = selectedGroupId;

      if (isCreatingNewGroup) {
        if (!newGroupName.trim()) {
          message.warning("Please enter a name for the new Client Group");
          return;
        }
        const createdGroup = await createGroupMutation.mutateAsync({
          name: newGroupName.trim(),
          description: `Auto-created from duplication & sibling audit linking "${pairToGroup.clientA.name}" and "${pairToGroup.clientB.name}"`,
        });
        targetGroupId = createdGroup.id;
      }

      if (!targetGroupId) {
        message.warning("Please select or create a Client Group");
        return;
      }

      await assignClientsMutation.mutateAsync({
        groupId: targetGroupId,
        clientIds,
      });

      setGroupingModalVisible(false);
      setPairToGroup(null);
      setSelectedGroupId(undefined);
      setNewGroupName("");
      setIsCreatingNewGroup(false);
      refetch();
    } catch (err: any) {
      // Error handled by mutation
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Duplicate Pairs
    const duplicateRows = (reportData.duplicatePairs || []).map((p: any, idx: number) => ({
      "S.N.": idx + 1,
      "Match Score": `${p.score}%`,
      "Match Reason": p.reason,
      "Client 1 Name": p.clientA?.name || "-",
      "Client 1 PAN": p.clientA?.panNo || "-",
      "Client 1 Group": p.clientA?.clientGroup?.name || "Standalone",
      "Client 1 Created By": p.clientA?.creator?.name || "-",
      "Client 2 Name": p.clientB?.name || "-",
      "Client 2 PAN": p.clientB?.panNo || "-",
      "Client 2 Group": p.clientB?.clientGroup?.name || "Standalone",
      "Client 2 Created By": p.clientB?.creator?.name || "-",
    }));
    const dupSheet = XLSX.utils.json_to_sheet(duplicateRows);
    XLSX.utils.book_append_sheet(workbook, dupSheet, "Potential Duplicates");

    // Sheet 2: Audit Trail
    const auditRows = (reportData.auditList || []).map((c: any, idx: number) => ({
      "S.N.": idx + 1,
      "Client Name": c.name,
      "Short Name": c.shortName || "-",
      "PAN": c.panNo || "-",
      "Corporate Group": c.clientGroup?.name || "Standalone",
      "Partner in Charge": c.partnerInCharge?.name || "-",
      "Status": c.status || "Active",
      "Created By": c.creator?.name || "-",
      "Created Date": c.createdAt ? dayjs(c.createdAt).format("YYYY-MM-DD HH:mm") : "-",
      "Updated By": c.updater?.name || "-",
      "Updated Date": c.updatedAt ? dayjs(c.updatedAt).format("YYYY-MM-DD HH:mm") : "-",
      "Last Edit Reason": c.lastEditReason || "-",
    }));
    const auditSheet = XLSX.utils.json_to_sheet(auditRows);
    XLSX.utils.book_append_sheet(workbook, auditSheet, "Client Audit Trail");

    const fileName = `Client_Duplication_Audit_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    message.success("Audit report exported to Excel successfully");
  };

  const auditColumns = [
    {
      title: "Client Entity",
      key: "name",
      width: 250,
      render: (_: any, record: any) => (
        <div>
          <Link
            to={`/clients/${record.id}`}
            className="font-medium text-blue-600 hover:underline flex items-center gap-1.5"
          >
            {record.name}
            {record.shortName && (
              <Tag color="blue" className="text-xs font-mono font-normal">
                {record.shortName}
              </Tag>
            )}
          </Link>
          <div className="text-xs text-slate-500 mt-0.5">
            PAN: <span className="font-mono">{record.panNo || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Corporate Group",
      key: "clientGroup",
      width: 180,
      render: (_: any, record: any) =>
        record.clientGroup ? (
          <Link to={`/client-groups/${record.clientGroup.id}`}>
            <Tag color="geekblue" className="flex items-center gap-1 w-fit cursor-pointer">
              <ApartmentOutlined />
              {record.clientGroup.name}
            </Tag>
          </Link>
        ) : (
          <Tag color="default" className="text-slate-400">
            Standalone
          </Tag>
        ),
    },
    {
      title: "Partner in Charge",
      key: "partnerInCharge",
      width: 160,
      render: (_: any, record: any) =>
        record.partnerInCharge ? (
          <span className="text-sm font-medium text-slate-700">
            {record.partnerInCharge.name}
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        ),
    },
    {
      title: "Created By",
      key: "creator",
      width: 190,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar
            size="small"
            icon={<UserOutlined />}
            src={record.creator?.avatar}
            className="bg-blue-500 shrink-0"
          >
            {record.creator?.name?.[0]?.toUpperCase()}
          </Avatar>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-800 truncate">
              {record.creator?.name || "System"}
            </div>
            <div className="text-[11px] text-slate-400">
              {record.createdAt ? dayjs(record.createdAt).format("YYYY-MM-DD HH:mm") : "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Updated By",
      key: "updater",
      width: 190,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          {record.updater ? (
            <>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={record.updater?.avatar}
                className="bg-emerald-500 shrink-0"
              >
                {record.updater?.name?.[0]?.toUpperCase()}
              </Avatar>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-800 truncate">
                  {record.updater.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {record.updatedAt ? dayjs(record.updatedAt).format("YYYY-MM-DD HH:mm") : "-"}
                </div>
              </div>
            </>
          ) : (
            <span className="text-xs text-slate-400">Not modified</span>
          )}
        </div>
      ),
    },
    {
      title: "Last Edit Reason",
      dataIndex: "lastEditReason",
      key: "lastEditReason",
      width: 220,
      render: (reason: string) =>
        reason ? (
          <Tooltip title={reason}>
            <span className="text-xs text-slate-600 italic bg-amber-50 border border-amber-200 px-2 py-0.5 rounded truncate max-w-[200px] inline-block">
              "{reason}"
            </span>
          </Tooltip>
        ) : (
          <span className="text-xs text-slate-300">-</span>
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: "center" as const,
      render: (_: any, record: any) => (
        <Tooltip title="View Client">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/clients/${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              className="border-slate-300 text-slate-600 hover:text-slate-900"
            >
              Catalog
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Title level={4} style={{ margin: 0 }} className="text-slate-800">
                Client Duplication & Audit Report
              </Title>
              <Tag color="orange" className="font-semibold">
                Fuzzy Engine
              </Tag>
            </div>
            <Text type="secondary" className="text-xs">
              Detect duplicate PANs, match similar legal names across JVs, group siblings with 1 click, and audit modifications.
            </Text>
          </div>
        </div>

        <Space wrap>
          <Button
            icon={<ApartmentOutlined />}
            onClick={() => navigate("/client-groups")}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Manage Client Groups
          </Button>
          <Button
            icon={<ReloadOutlined spin={isFetching} />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Re-scan
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 border-none"
          >
            Export to Excel
          </Button>
        </Space>
      </div>

      {/* High-Level Overview Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-slate-200" bodyStyle={{ padding: "16px 20px" }}>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
              Total Clients
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {summary.totalClients.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Across all legal structures</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            className={`shadow-sm border-slate-200 ${
              summary.potentialDuplicatePairs > 0 ? "bg-amber-50/50 border-amber-200" : ""
            }`}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-amber-700 font-medium uppercase tracking-wider">
                Potential Duplicates / Siblings
              </span>
              <WarningOutlined className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {summary.potentialDuplicatePairs.toLocaleString()}
            </div>
            <div className="text-xs text-amber-700/80 mt-1">
              {summary.potentialDuplicatePairs > 0
                ? "Flagged pairs needing review / grouping"
                : "Clean database - no collisions"}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-slate-200" bodyStyle={{ padding: "16px 20px" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-indigo-600 font-medium uppercase tracking-wider">
                In Corporate Groups
              </span>
              <ApartmentOutlined className="text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {summary.clientsInGroups.toLocaleString()}
            </div>
            <div className="text-xs text-indigo-500/80 mt-1">
              {summary.totalClients > 0
                ? `${Math.round((summary.clientsInGroups / summary.totalClients) * 100)}% of total clients grouped`
                : "0%"}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="shadow-sm border-slate-200" bodyStyle={{ padding: "16px 20px" }}>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
              Standalone Entities
            </div>
            <div className="text-2xl font-bold text-slate-700">
              {summary.standaloneClients.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Not assigned to any client group</div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Area: Tabs */}
      <Card className="shadow-sm border-slate-200">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <div className="flex items-center gap-2 pb-2">
              <Input
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder={
                  activeTab === "duplicates"
                    ? "Search pair by name or PAN..."
                    : "Search by client, PAN, or user..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                className="w-64"
                size="small"
              />

              {activeTab === "audit" && (
                <Select
                  value={groupFilter}
                  onChange={setGroupFilter}
                  size="small"
                  className="w-36"
                  options={[
                    { value: "all", label: "All Clients" },
                    { value: "grouped", label: "Grouped Only" },
                    { value: "standalone", label: "Standalone Only" },
                  ]}
                />
              )}
            </div>
          }
          items={[
            {
              key: "duplicates",
              label: (
                <span className="flex items-center gap-2">
                  <WarningOutlined />
                  Duplicate & Sibling Pairs
                  {summary.potentialDuplicatePairs > 0 && (
                    <Badge
                      count={summary.potentialDuplicatePairs}
                      overflowCount={999}
                      className="ml-1"
                      style={{ backgroundColor: "#fa8c16" }}
                    />
                  )}
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  {isLoading ? (
                    <div className="py-16 text-center">
                      <Spin size="large" tip="Scanning entire client database with fuzzy logic..." />
                    </div>
                  ) : filteredPairs.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        searchQuery
                          ? "No matching duplicate pairs found for your search query."
                          : "Great news! No duplicate PANs or high-similarity client names detected."
                      }
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-500 flex items-center justify-between">
                        <span>Showing {filteredPairs.length} potential duplicate or sibling entity pairs</span>
                        <span>Tip: Click "Group Together" to consolidate related entities under a single Corporate Group.</span>
                      </div>

                      {filteredPairs.map((pair) => {
                        const isPanMatch = pair.score === 100 || pair.reason?.includes("PAN");
                        const scoreColor = isPanMatch ? "#ef4444" : pair.score >= 80 ? "#f97316" : "#3b82f6";

                        return (
                          <div
                            key={pair.id}
                            className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all shadow-sm"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-3">
                                <Tag
                                  color={isPanMatch ? "error" : pair.score >= 80 ? "warning" : "blue"}
                                  className="font-mono text-sm px-2.5 py-0.5 rounded font-bold"
                                >
                                  {pair.score}% Match
                                </Tag>
                                <div>
                                  <span className="font-semibold text-slate-800 text-sm">
                                    {pair.reason}
                                  </span>
                                  <span className="text-xs text-slate-400 ml-2">
                                    {isPanMatch
                                      ? "Critical: Identical tax registration number"
                                      : "High similarity: likely sibling JV, branch, or typographical duplicate"}
                                  </span>
                                </div>
                              </div>

                              <Space wrap>
                                <Button
                                  type="primary"
                                  icon={<ApartmentOutlined />}
                                  onClick={() => handleOpenGroupModal(pair)}
                                  className="bg-indigo-600 hover:bg-indigo-500 border-none font-medium"
                                  size="small"
                                >
                                  Group Together
                                </Button>
                              </Space>
                            </div>

                            {/* Side by side comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                              {/* Client A */}
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <Link
                                        to={`/clients/${pair.clientA.id}`}
                                        className="font-semibold text-slate-800 hover:text-blue-600 text-sm"
                                      >
                                        {pair.clientA.name}
                                      </Link>
                                      {pair.clientA.shortName && (
                                        <Tag color="blue" className="ml-2 text-xs font-mono">
                                          {pair.clientA.shortName}
                                        </Tag>
                                      )}
                                    </div>
                                    <Tag color={pair.clientA.status === "active" ? "success" : "default"}>
                                      {pair.clientA.status || "active"}
                                    </Tag>
                                  </div>

                                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-400">PAN:</span>
                                      <span className={`font-mono font-medium ${isPanMatch ? "text-red-600 font-bold" : ""}`}>
                                        {pair.clientA.panNo || "None"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-400">Current Group:</span>
                                      {pair.clientA.clientGroup ? (
                                        <Tag color="geekblue" className="text-xs">
                                          {pair.clientA.clientGroup.name}
                                        </Tag>
                                      ) : (
                                        <span className="text-slate-400 italic">None (Standalone)</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                                  <span>
                                    Created: {dayjs(pair.clientA.createdAt).format("YYYY-MM-DD")}
                                  </span>
                                  <span>
                                    By: {pair.clientA.creator?.name || "System"}
                                  </span>
                                </div>
                              </div>

                              {/* Client B */}
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <Link
                                        to={`/clients/${pair.clientB.id}`}
                                        className="font-semibold text-slate-800 hover:text-blue-600 text-sm"
                                      >
                                        {pair.clientB.name}
                                      </Link>
                                      {pair.clientB.shortName && (
                                        <Tag color="blue" className="ml-2 text-xs font-mono">
                                          {pair.clientB.shortName}
                                        </Tag>
                                      )}
                                    </div>
                                    <Tag color={pair.clientB.status === "active" ? "success" : "default"}>
                                      {pair.clientB.status || "active"}
                                    </Tag>
                                  </div>

                                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-400">PAN:</span>
                                      <span className={`font-mono font-medium ${isPanMatch ? "text-red-600 font-bold" : ""}`}>
                                        {pair.clientB.panNo || "None"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-400">Current Group:</span>
                                      {pair.clientB.clientGroup ? (
                                        <Tag color="geekblue" className="text-xs">
                                          {pair.clientB.clientGroup.name}
                                        </Tag>
                                      ) : (
                                        <span className="text-slate-400 italic">None (Standalone)</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                                  <span>
                                    Created: {dayjs(pair.clientB.createdAt).format("YYYY-MM-DD")}
                                  </span>
                                  <span>
                                    By: {pair.clientB.creator?.name || "System"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "audit",
              label: (
                <span className="flex items-center gap-2">
                  <SafetyCertificateOutlined />
                  Client Creation & Updation Audit
                </span>
              ),
              children: (
                <div className="pt-2">
                  <Table
                    columns={auditColumns}
                    dataSource={filteredAuditList}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                      pageSize: 15,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "15", "25", "50"],
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} clients`,
                    }}
                    scroll={{ x: 1000 }}
                    size="middle"
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 1-Click Grouping Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ApartmentOutlined className="text-indigo-600 text-lg" />
            <span>Group Sibling Entities Together</span>
          </div>
        }
        open={groupingModalVisible}
        onCancel={() => setGroupingModalVisible(false)}
        onOk={handleConfirmGrouping}
        confirmLoading={assignClientsMutation.isPending || createGroupMutation.isPending}
        okText="Confirm & Group"
        width={560}
      >
        {pairToGroup && (
          <div className="space-y-4 py-2">
            <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
              Consolidating these two clients into a common <strong>Client Group</strong> enables unified corporate oversight, group-level contacts, and a <strong>Group-wise Client Ledger</strong>.
            </div>

            <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
              <div className="font-semibold text-slate-700">Entities to be linked:</div>
              <div className="flex items-center justify-between text-slate-800">
                <span>1. {pairToGroup.clientA.name}</span>
                <span className="font-mono text-slate-500">PAN: {pairToGroup.clientA.panNo || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-slate-800">
                <span>2. {pairToGroup.clientB.name}</span>
                <span className="font-mono text-slate-500">PAN: {pairToGroup.clientB.panNo || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Target Client Group:
                </label>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setIsCreatingNewGroup(!isCreatingNewGroup)}
                  className="text-xs p-0"
                >
                  {isCreatingNewGroup ? "Select Existing Group" : "+ Create New Group"}
                </Button>
              </div>

              {!isCreatingNewGroup ? (
                <Select
                  className="w-full"
                  placeholder="Select an existing Client Group..."
                  value={selectedGroupId}
                  onChange={setSelectedGroupId}
                  options={clientGroups.map((g) => ({
                    value: g.id,
                    label: `${g.name} (${g.clientsCount || 0} members)`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              ) : (
                <Input
                  placeholder="e.g. Hanuman Group, Guys Enterprise..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  prefix={<ApartmentOutlined className="text-slate-400" />}
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientAuditReport;

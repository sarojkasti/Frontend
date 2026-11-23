import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
  Select,
  Radio,
  DatePicker,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  SearchOutlined,
  HistoryOutlined,
  ProjectOutlined,
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  UserSwitchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  FilterOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useRecentChanges } from "@/hooks/dashboard/useRecentChanges";
import { RecentChangeItem, TimelineFeedItem } from "@/service/dashboard.service";
import { useIsMobile } from "@/hooks/useIsMobile";
import ResponsiveTable from "@/components/ui/MobileCardList";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface RecentChangesReportProps {
  onBack?: () => void;
  initialTab?: string;
}

type TabKey = "all" | "projects" | "clients" | "users" | "client_reports" | "client_users";

export const RecentChangesReport: React.FC<RecentChangesReportProps> = ({
  onBack,
  initialTab,
}) => {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state synced with URL search params
  const tabParam = (searchParams.get("tab") as TabKey) || initialTab || "all";
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam);

  useEffect(() => {
    if (tabParam && ["all", "projects", "clients", "users", "client_reports", "client_users"].includes(tabParam)) {
      setActiveTab(tabParam as TabKey);
    }
  }, [tabParam]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", key);
    setSearchParams(newParams);
  };

  // Filter states
  const [daysFilter, setDaysFilter] = useState<string>("30");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [actionFilter, setActionFilter] = useState<"all" | "created" | "updated">("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Query Backend
  const queryParams = useMemo(() => {
    const params: any = {
      action: actionFilter,
      search: searchKeyword.trim() || undefined,
      limit: 150,
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format("YYYY-MM-DD");
      params.endDate = dateRange[1].format("YYYY-MM-DD");
    } else {
      params.days = daysFilter;
    }

    return params;
  }, [daysFilter, dateRange, actionFilter, searchKeyword]);

  const { data: changesData, isLoading, refetch, isFetching } = useRecentChanges(queryParams);

  const summary = changesData?.summary || {
    totalRecords: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    counts: {
      projects: 0,
      clients: 0,
      users: 0,
      clientReports: 0,
      clientUsers: 0,
    },
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = dayjs(dateStr);
    if (!d.isValid()) return "-";
    const now = dayjs();
    const diffHours = now.diff(d, "hour");
    const diffDays = now.diff(d, "day");
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.format("YYYY-MM-DD");
  };

  // Excel Exporter
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const createSheetWithColWidths = (data: any[], fallbackHeaders?: string[]) => {
      let ws: XLSX.WorkSheet;
      if (!data || data.length === 0) {
        ws = XLSX.utils.json_to_sheet(
          fallbackHeaders ? [fallbackHeaders.reduce((acc, h) => ({ ...acc, [h]: "" }), {})] : []
        );
      } else {
        ws = XLSX.utils.json_to_sheet(data);
        const colWidths = Object.keys(data[0]).map((key) => {
          const maxLen = data.reduce(
            (max, row) => Math.max(max, String(row[key] ?? "").length),
            key.length
          );
          return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
        });
        ws["!cols"] = colWidths;
      }
      return ws;
    };

    // 1. All Timeline Sheet
    const timelineData = (changesData?.allTimeline || []).map((item, idx) => ({
      "S.N.": idx + 1,
      "Module": item.entityLabel,
      "Title / Item Name": item.title,
      "Description / Context": item.subtitle,
      "Action Type": item.action.toUpperCase(),
      "Status": item.status || "-",
      "Actor / User": item.actor?.name || "System",
      "Actor Email": item.actor?.email || "-",
      "Date": dayjs(item.primaryDate).format("YYYY-MM-DD hh:mm A"),
      "Created At": dayjs(item.createdAt).format("YYYY-MM-DD"),
      "Last Updated At": dayjs(item.updatedAt).format("YYYY-MM-DD"),
    }));
    XLSX.utils.book_append_sheet(workbook, createSheetWithColWidths(timelineData), "All Changes Timeline");

    // 2. Projects Sheet
    const projectsData = (changesData?.projects || []).map((p, idx) => ({
      "S.N.": idx + 1,
      "Project Name": p.name,
      "Client Name": p.clientName,
      "Working Year": p.workingYear || "-",
      "Manager": p.managerName || "-",
      "Lead": p.leadName || "-",
      "Status": (p.status || "").toUpperCase(),
      "Action": p.action.toUpperCase(),
      "Created By": p.creator?.name || "System",
      "Created At": dayjs(p.createdAt).format("YYYY-MM-DD hh:mm A"),
      "Updated By": p.updater?.name || p.creator?.name || "System",
      "Last Updated At": dayjs(p.updatedAt).format("YYYY-MM-DD hh:mm A"),
    }));
    XLSX.utils.book_append_sheet(workbook, createSheetWithColWidths(projectsData), "Projects Changes");

    // 3. Clients Sheet
    const clientsData = (changesData?.clients || []).map((c, idx) => ({
      "S.N.": idx + 1,
      "Client Name": c.name,
      "PAN Number": c.panNo || "-",
      "Client Group": c.groupName || "Standalone",
      "State": c.state || "-",
      "District": c.district || "-",
      "Status": (c.status || "").toUpperCase(),
      "Action": c.action.toUpperCase(),
      "Created By": c.creator?.name || "System",
      "Created At": dayjs(c.createdAt).format("YYYY-MM-DD hh:mm A"),
      "Updated By": c.updater?.name || c.creator?.name || "System",
      "Last Updated At": dayjs(c.updatedAt).format("YYYY-MM-DD hh:mm A"),
    }));
    XLSX.utils.book_append_sheet(workbook, createSheetWithColWidths(clientsData), "Clients Changes");

    // 4. Users Sheet
    const usersData = (changesData?.users || []).map((u, idx) => ({
      "S.N.": idx + 1,
      "Full Name": u.name,
      "Email Address": u.email,
      "Username": u.username,
      "Role": u.role || "-",
      "Status": (u.status || "").toUpperCase(),
      "Action": u.action.toUpperCase(),
      "Created By": u.creator?.name || "System",
      "Created At": dayjs(u.createdAt).format("YYYY-MM-DD hh:mm A"),
      "Updated By": u.updater?.name || u.creator?.name || "System",
      "Last Updated At": dayjs(u.updatedAt).format("YYYY-MM-DD hh:mm A"),
    }));
    XLSX.utils.book_append_sheet(workbook, createSheetWithColWidths(usersData), "Team Users Changes");

    // 5. Client Reports Sheet
    const reportsData = (changesData?.clientReports || []).map((r, idx) => ({
      "S.N.": idx + 1,
      "Report Title": r.title,
      "Client Company": r.clientName,
      "Document Type": r.documentType,
      "File Name": r.fileName,
      "Access Status": (r.accessStatus || "").toUpperCase(),
      "Action": r.action.toUpperCase(),
      "Uploaded By": r.creator?.name || "System",
      "Created At": dayjs(r.createdAt).format("YYYY-MM-DD hh:mm A"),
      "Updated By": r.updater?.name || r.creator?.name || "System",
      "Last Updated At": dayjs(r.updatedAt).format("YYYY-MM-DD hh:mm A"),
    }));
    XLSX.utils.book_append_sheet(workbook, createSheetWithColWidths(reportsData), "Client Reports Changes");

    // 6. Client Users Sheet
    const clientUsersData = (changesData?.clientUsers || []).map((cu, idx) => ({
      "S.N.": idx + 1,
      "Contact Name": cu.name,
      "Email Address": cu.email,
      "Phone Number": cu.phoneNumber || "-",
      "Associated Clients": cu.clientNames || "-",
      "Status": (cu.status || "").toUpperCase(),
      "Action": cu.action.toUpperCase(),
      "Last Login": cu.lastLoginAt ? dayjs(cu.lastLoginAt).format("YYYY-MM-DD hh:mm A") : "Never",
      "Created By": cu.creator?.name || "System",
      "Created At": dayjs(cu.createdAt).format("YYYY-MM-DD hh:mm A"),
      "Updated By": cu.updater?.name || cu.creator?.name || "System",
      "Last Updated At": dayjs(cu.updatedAt).format("YYYY-MM-DD hh:mm A"),
    }));
    XLSX.utils.book_append_sheet(workbook, createSheetWithColWidths(clientUsersData), "Client Users Changes");

    XLSX.writeFile(workbook, `Recent_Changes_Audit_Report_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
  };

  // Render Mobile Card for Unified Timeline Feed
  const renderTimelineMobileCard = (record: TimelineFeedItem) => {
    return (
      <div key={record.id + record.primaryDate} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Space size={6}>
            <Tag color={record.badgeColor} className="font-semibold text-xs m-0 rounded-full">
              {record.entityLabel}
            </Tag>
            <Tag color={record.action === "created" ? "success" : "processing"} className="text-[11px] m-0">
              {record.action === "created" ? "Created" : "Updated"}
            </Tag>
          </Space>
          <span className="text-xs text-slate-400 font-medium">{formatRelativeTime(record.primaryDate)}</span>
        </div>

        <h4 className="font-semibold text-slate-800 text-sm mb-1">{record.title}</h4>
        <p className="text-xs text-slate-500 mb-2.5">{record.subtitle}</p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Avatar
              size={18}
              className="bg-slate-400 shrink-0"
              src={
                record.actor?.avatar
                  ? `${import.meta.env.VITE_BACKEND_URI}/document/${record.actor?.avatar}`
                  : undefined
              }
            >
              {record.actor?.name?.[0] || "U"}
            </Avatar>
            <span>by {record.actor?.name || "System"}</span>
          </div>
          <Link to={record.link} className="text-blue-600 font-medium inline-flex items-center gap-1">
            View <ArrowRightOutlined style={{ fontSize: 9 }} />
          </Link>
        </div>
      </div>
    );
  };

  // Helper Actor Cell
  const renderActorCell = (actor?: any, dateStr?: string) => {
    return (
      <div>
        <div className="flex items-center gap-1.5">
          <Avatar
            size={18}
            className="bg-slate-400 shrink-0 text-[10px]"
            src={
              actor?.avatar
                ? `${import.meta.env.VITE_BACKEND_URI}/document/${actor?.avatar}`
                : undefined
            }
          >
            {actor?.name?.[0] || "U"}
          </Avatar>
          <span className="text-xs font-medium text-slate-700 truncate max-w-[130px]">
            {actor?.name || "System"}
          </span>
        </div>
        {dateStr && (
          <div className="text-[11px] text-slate-400 mt-0.5" title={dayjs(dateStr).format("YYYY-MM-DD hh:mm A")}>
            {formatRelativeTime(dateStr)} • {dayjs(dateStr).format("MMM D")}
          </div>
        )}
      </div>
    );
  };

  // Tab Badge Helper
  const getTabLabel = (label: string, count: number, icon: React.ReactNode, color: string) => {
    return (
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
        <span
          className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full min-w-[20px] h-[18px] ml-1 ${
            count > 0 ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"
          }`}
        >
          {count}
        </span>
      </span>
    );
  };

  return (
    <div className="pb-16 sm:pb-6 px-2 sm:px-0">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (onBack) onBack();
              else navigate("/reports");
            }}
            className="flex items-center justify-center font-medium"
          >
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 m-0 tracking-tight flex items-center gap-2">
              <HistoryOutlined className="text-blue-600" /> Recent Changes & Activity Audit
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">
              Live audit logs and recency tracker for Projects, Clients, Team Users, Client Reports, and Client Users
            </p>
          </div>
        </div>

        <Space size="small">
          <Button
            icon={<ReloadOutlined spin={isFetching} />}
            onClick={() => refetch()}
            className="flex items-center justify-center"
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined style={{ color: "#ffffff" }} />}
            onClick={handleExportExcel}
            style={{
              backgroundColor: "#21a366",
              borderColor: "#21a366",
              borderRadius: "6px",
            }}
          >
            Export All to Excel
          </Button>
        </Space>
      </div>

      {/* Filter Toolbar */}
      <Card
        size="small"
        className="mb-4 rounded-xl border border-slate-200 shadow-2xs"
        bodyStyle={{ padding: "14px 16px" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Quick Timeframe Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <CalendarOutlined /> Timeframe:
            </span>
            <Radio.Group
              value={dateRange ? "custom" : daysFilter}
              onChange={(e) => {
                if (e.target.value !== "custom") {
                  setDateRange(null);
                  setDaysFilter(e.target.value);
                }
              }}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="1">Today</Radio.Button>
              <Radio.Button value="7">7 Days</Radio.Button>
              <Radio.Button value="30">30 Days</Radio.Button>
              <Radio.Button value="90">90 Days</Radio.Button>
              <Radio.Button value="all">All Time</Radio.Button>
            </Radio.Group>

            <RangePicker
              size="small"
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as any);
              }}
              className="rounded"
              style={{ width: 220 }}
              placeholder={["Start date", "End date"]}
            />
          </div>

          {/* Right: Action Type Filter and Search Input */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={actionFilter}
              onChange={setActionFilter}
              size="small"
              style={{ width: 130 }}
            >
              <Select.Option value="all">All Actions</Select.Option>
              <Select.Option value="created">Newly Created</Select.Option>
              <Select.Option value="updated">Recently Updated</Select.Option>
            </Select>

            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search by name, PAN, email, actor..."
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              size="small"
              className="rounded"
              style={{ width: 240 }}
            />
          </div>
        </div>
      </Card>

      {/* Main Tabbed Report Content */}
      <Card
        className="rounded-xl border border-slate-200 shadow-2xs"
        bodyStyle={{ padding: "16px" }}
      >
        <Spin spinning={isLoading}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type="line"
            size="middle"
            items={[
              // Tab 1: All Changes (Unified Timeline)
              {
                key: "all",
                label: getTabLabel(
                  "All Changes Feed",
                  changesData?.allTimeline?.length || 0,
                  <HistoryOutlined />,
                  "blue"
                ),
                children: (
                  <div className="pt-2">
                    <ResponsiveTable
                      tableProps={{
                        dataSource: changesData?.allTimeline || [],
                        rowKey: (rec) => rec.id + rec.primaryDate,
                        size: "small",
                        pagination: { pageSize: 15 },
                        columns: [
                          {
                            title: "Module",
                            dataIndex: "entityLabel",
                            key: "entityLabel",
                            width: 130,
                            render: (val: string, record: TimelineFeedItem) => (
                              <Tag color={record.badgeColor} className="font-semibold text-xs rounded-full">
                                {val}
                              </Tag>
                            ),
                          },
                          {
                            title: "Item / Title",
                            dataIndex: "title",
                            key: "title",
                            render: (text: string, record: TimelineFeedItem) => (
                              <div>
                                <Link
                                  to={record.link}
                                  className="font-semibold text-slate-800 hover:text-blue-600 text-sm block truncate max-w-md"
                                  title={text}
                                >
                                  {text}
                                </Link>
                                <span className="text-xs text-slate-500 block truncate max-w-md mt-0.5">
                                  {record.subtitle}
                                </span>
                              </div>
                            ),
                          },
                          {
                            title: "Action Type",
                            dataIndex: "action",
                            key: "action",
                            width: 120,
                            render: (val: string) => (
                              <Tag color={val === "created" ? "success" : "processing"} className="text-xs font-medium">
                                {val === "created" ? "Newly Created" : "Updated"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Actor / Modified By",
                            key: "actor",
                            width: 180,
                            render: (_: any, record: TimelineFeedItem) =>
                              renderActorCell(record.actor, record.primaryDate),
                          },
                          {
                            title: "Status",
                            dataIndex: "status",
                            key: "status",
                            width: 100,
                            render: (val: string) =>
                              val ? (
                                <Tag color={val === "active" ? "blue" : val === "completed" ? "green" : "default"} className="text-xs">
                                  {val.toUpperCase()}
                                </Tag>
                              ) : (
                                "-"
                              ),
                          },
                          {
                            title: "Quick Action",
                            key: "actionBtn",
                            width: 90,
                            align: "center",
                            render: (_: any, record: TimelineFeedItem) => (
                              <Link
                                to={record.link}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                View <EyeOutlined style={{ fontSize: 11 }} />
                              </Link>
                            ),
                          },
                        ],
                      }}
                      renderMobileCard={renderTimelineMobileCard}
                    />
                  </div>
                ),
              },

              // Tab 2: Projects
              {
                key: "projects",
                label: getTabLabel(
                  "Projects",
                  changesData?.projects?.length || 0,
                  <ProjectOutlined />,
                  "blue"
                ),
                children: (
                  <div className="pt-2">
                    <ResponsiveTable
                      tableProps={{
                        dataSource: changesData?.projects || [],
                        rowKey: "id",
                        size: "small",
                        pagination: { pageSize: 12 },
                        columns: [
                          {
                            title: "Project Name",
                            dataIndex: "name",
                            key: "name",
                            render: (text: string, record: RecentChangeItem) => (
                              <div>
                                <Link
                                  to={`/projects/${record.id}`}
                                  className="font-semibold text-slate-800 hover:text-blue-600 text-sm block truncate max-w-sm"
                                  title={text}
                                >
                                  {text}
                                </Link>
                                <span className="text-xs text-slate-500 block truncate mt-0.5">
                                  Client: <strong className="text-slate-700">{record.clientName}</strong>
                                  {record.workingYear && ` • FY: ${record.workingYear}`}
                                </span>
                              </div>
                            ),
                          },
                          {
                            title: "Project Lead & Manager",
                            key: "leads",
                            width: 180,
                            render: (_: any, record: RecentChangeItem) => (
                              <div className="text-xs text-slate-600">
                                <div>Manager: <span className="font-medium">{record.managerName || "-"}</span></div>
                                <div>Lead: <span className="font-medium">{record.leadName || "-"}</span></div>
                              </div>
                            ),
                          },
                          {
                            title: "Status",
                            dataIndex: "status",
                            key: "status",
                            width: 100,
                            render: (val: string) => (
                              <Tag color={val === "active" ? "blue" : val === "completed" ? "green" : "default"}>
                                {(val || "active").toUpperCase()}
                              </Tag>
                            ),
                          },
                          {
                            title: "Change Type",
                            dataIndex: "action",
                            key: "action",
                            width: 110,
                            render: (val: string) => (
                              <Tag color={val === "created" ? "success" : "processing"}>
                                {val === "created" ? "Created" : "Updated"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Created By",
                            key: "creator",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.creator, record.createdAt),
                          },
                          {
                            title: "Last Updated",
                            key: "updater",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.updater || record.creator, record.updatedAt),
                          },
                          {
                            title: "Action",
                            key: "view",
                            width: 80,
                            align: "center",
                            render: (_: any, record: RecentChangeItem) => (
                              <Link
                                to={`/projects/${record.id}`}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                View →
                              </Link>
                            ),
                          },
                        ],
                      }}
                      renderMobileCard={(record: RecentChangeItem) => (
                        <div key={record.id} className="bg-white rounded-lg border border-slate-200 p-3 mb-2.5">
                          <div className="flex justify-between items-start mb-1">
                            <Link to={`/projects/${record.id}`} className="font-semibold text-slate-800 text-sm">
                              {record.name}
                            </Link>
                            <Tag color={record.action === "created" ? "success" : "processing"}>
                              {record.action}
                            </Tag>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">Client: {record.clientName}</div>
                          <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-100">
                            <span>by {record.creator?.name || "System"}</span>
                            <span>{formatRelativeTime(record.primaryDate)}</span>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                ),
              },

              // Tab 3: Clients
              {
                key: "clients",
                label: getTabLabel(
                  "Clients",
                  changesData?.clients?.length || 0,
                  <BankOutlined />,
                  "green"
                ),
                children: (
                  <div className="pt-2">
                    <ResponsiveTable
                      tableProps={{
                        dataSource: changesData?.clients || [],
                        rowKey: "id",
                        size: "small",
                        pagination: { pageSize: 12 },
                        columns: [
                          {
                            title: "Client Name",
                            dataIndex: "name",
                            key: "name",
                            render: (text: string, record: RecentChangeItem) => (
                              <div>
                                <Link
                                  to={`/client/view/${record.id}`}
                                  className="font-semibold text-slate-800 hover:text-blue-600 text-sm block truncate max-w-sm"
                                  title={text}
                                >
                                  {text}
                                </Link>
                                <span className="text-xs text-slate-500 block truncate mt-0.5">
                                  PAN: <strong className="text-slate-700">{record.panNo}</strong>
                                  {record.groupName && ` • Group: ${record.groupName}`}
                                </span>
                              </div>
                            ),
                          },
                          {
                            title: "Location",
                            key: "location",
                            width: 140,
                            render: (_: any, record: RecentChangeItem) => (
                              <span className="text-xs text-slate-600">
                                {record.district || record.state || "-"}
                              </span>
                            ),
                          },
                          {
                            title: "Status",
                            dataIndex: "status",
                            key: "status",
                            width: 90,
                            render: (val: string) => (
                              <Tag color={val === "active" ? "green" : "default"}>
                                {(val || "active").toUpperCase()}
                              </Tag>
                            ),
                          },
                          {
                            title: "Change Type",
                            dataIndex: "action",
                            key: "action",
                            width: 110,
                            render: (val: string) => (
                              <Tag color={val === "created" ? "success" : "processing"}>
                                {val === "created" ? "Created" : "Updated"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Created By",
                            key: "creator",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.creator, record.createdAt),
                          },
                          {
                            title: "Last Updated",
                            key: "updater",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.updater || record.creator, record.updatedAt),
                          },
                          {
                            title: "Action",
                            key: "view",
                            width: 80,
                            align: "center",
                            render: (_: any, record: RecentChangeItem) => (
                              <Link
                                to={`/client/view/${record.id}`}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                View →
                              </Link>
                            ),
                          },
                        ],
                      }}
                      renderMobileCard={(record: RecentChangeItem) => (
                        <div key={record.id} className="bg-white rounded-lg border border-slate-200 p-3 mb-2.5">
                          <div className="flex justify-between items-start mb-1">
                            <Link to={`/client/view/${record.id}`} className="font-semibold text-slate-800 text-sm">
                              {record.name}
                            </Link>
                            <Tag color={record.action === "created" ? "success" : "processing"}>
                              {record.action}
                            </Tag>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">PAN: {record.panNo}</div>
                          <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-100">
                            <span>by {record.creator?.name || "System"}</span>
                            <span>{formatRelativeTime(record.primaryDate)}</span>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                ),
              },

              // Tab 4: Team Users
              {
                key: "users",
                label: getTabLabel(
                  "Team Users",
                  changesData?.users?.length || 0,
                  <TeamOutlined />,
                  "purple"
                ),
                children: (
                  <div className="pt-2">
                    <ResponsiveTable
                      tableProps={{
                        dataSource: changesData?.users || [],
                        rowKey: "id",
                        size: "small",
                        pagination: { pageSize: 12 },
                        columns: [
                          {
                            title: "User / Employee",
                            dataIndex: "name",
                            key: "name",
                            render: (text: string, record: RecentChangeItem) => (
                              <div className="flex items-center gap-2">
                                <Avatar
                                  size={24}
                                  className="bg-purple-600 shrink-0 text-xs"
                                  src={
                                    record.avatar
                                      ? `${import.meta.env.VITE_BACKEND_URI}/document/${record.avatar}`
                                      : undefined
                                  }
                                >
                                  {text?.[0] || "U"}
                                </Avatar>
                                <div>
                                  <span className="font-semibold text-slate-800 text-sm block">
                                    {text}
                                  </span>
                                  <span className="text-xs text-slate-500 block">
                                    {record.email} • @{record.username}
                                  </span>
                                </div>
                              </div>
                            ),
                          },
                          {
                            title: "Role",
                            dataIndex: "role",
                            key: "role",
                            width: 140,
                            render: (val: string) => (
                              <Tag color="purple" className="text-xs font-medium">
                                {val || "Member"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Status",
                            dataIndex: "status",
                            key: "status",
                            width: 90,
                            render: (val: string) => (
                              <Tag color={val === "active" ? "green" : "default"}>
                                {(val || "active").toUpperCase()}
                              </Tag>
                            ),
                          },
                          {
                            title: "Change Type",
                            dataIndex: "action",
                            key: "action",
                            width: 110,
                            render: (val: string) => (
                              <Tag color={val === "created" ? "success" : "processing"}>
                                {val === "created" ? "Created" : "Updated"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Created By",
                            key: "creator",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.creator, record.createdAt),
                          },
                          {
                            title: "Last Updated",
                            key: "updater",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.updater || record.creator, record.updatedAt),
                          },
                          {
                            title: "Action",
                            key: "view",
                            width: 80,
                            align: "center",
                            render: (_: any, record: RecentChangeItem) => (
                              <Link
                                to={`/users`}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                View →
                              </Link>
                            ),
                          },
                        ],
                      }}
                      renderMobileCard={(record: RecentChangeItem) => (
                        <div key={record.id} className="bg-white rounded-lg border border-slate-200 p-3 mb-2.5">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-slate-800 text-sm">
                              {record.name}
                            </span>
                            <Tag color="purple">{record.role}</Tag>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">{record.email}</div>
                          <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-100">
                            <span>by {record.creator?.name || "System"}</span>
                            <span>{formatRelativeTime(record.primaryDate)}</span>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                ),
              },

              // Tab 5: Client Reports
              {
                key: "client_reports",
                label: getTabLabel(
                  "Client Reports",
                  changesData?.clientReports?.length || 0,
                  <FileTextOutlined />,
                  "cyan"
                ),
                children: (
                  <div className="pt-2">
                    <ResponsiveTable
                      tableProps={{
                        dataSource: changesData?.clientReports || [],
                        rowKey: "id",
                        size: "small",
                        pagination: { pageSize: 12 },
                        columns: [
                          {
                            title: "Report Title & File",
                            dataIndex: "title",
                            key: "title",
                            render: (text: string, record: RecentChangeItem) => (
                              <div>
                                <Link
                                  to="/client-reports"
                                  className="font-semibold text-slate-800 hover:text-blue-600 text-sm block truncate max-w-sm"
                                  title={text}
                                >
                                  {text}
                                </Link>
                                <span className="text-xs text-slate-500 block truncate mt-0.5">
                                  File: <strong className="text-slate-600">{record.fileName || "Document"}</strong>
                                  {record.fileSize ? ` (${Math.round(record.fileSize / 1024)} KB)` : ""}
                                </span>
                              </div>
                            ),
                          },
                          {
                            title: "Client Company",
                            dataIndex: "clientName",
                            key: "clientName",
                            render: (val: string) => (
                              <span className="font-medium text-xs text-slate-700">
                                {val || "-"}
                              </span>
                            ),
                          },
                          {
                            title: "Document Type",
                            dataIndex: "documentType",
                            key: "documentType",
                            width: 140,
                            render: (val: string) => (
                              <Tag color="cyan" className="text-xs">
                                {val || "Report"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Change Type",
                            dataIndex: "action",
                            key: "action",
                            width: 110,
                            render: (val: string) => (
                              <Tag color={val === "created" ? "success" : "processing"}>
                                {val === "created" ? "Uploaded" : "Updated"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Uploaded By",
                            key: "creator",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.creator, record.createdAt),
                          },
                          {
                            title: "Last Updated",
                            key: "updater",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.updater || record.creator, record.updatedAt),
                          },
                          {
                            title: "Action",
                            key: "view",
                            width: 90,
                            align: "center",
                            render: () => (
                              <Link
                                to="/client-reports"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                View Hub →
                              </Link>
                            ),
                          },
                        ],
                      }}
                      renderMobileCard={(record: RecentChangeItem) => (
                        <div key={record.id} className="bg-white rounded-lg border border-slate-200 p-3 mb-2.5">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-slate-800 text-sm">
                              {record.title}
                            </span>
                            <Tag color="cyan">{record.documentType}</Tag>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">Client: {record.clientName}</div>
                          <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-100">
                            <span>Uploaded by {record.creator?.name || "System"}</span>
                            <span>{formatRelativeTime(record.primaryDate)}</span>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                ),
              },

              // Tab 6: Client Users
              {
                key: "client_users",
                label: getTabLabel(
                  "Client Users",
                  changesData?.clientUsers?.length || 0,
                  <UserSwitchOutlined />,
                  "magenta"
                ),
                children: (
                  <div className="pt-2">
                    <ResponsiveTable
                      tableProps={{
                        dataSource: changesData?.clientUsers || [],
                        rowKey: "id",
                        size: "small",
                        pagination: { pageSize: 12 },
                        columns: [
                          {
                            title: "Contact Person",
                            dataIndex: "name",
                            key: "name",
                            render: (text: string, record: RecentChangeItem) => (
                              <div>
                                <span className="font-semibold text-slate-800 text-sm block">
                                  {text}
                                </span>
                                <span className="text-xs text-slate-500 block">
                                  {record.email} • {record.phoneNumber || "No phone"}
                                </span>
                              </div>
                            ),
                          },
                          {
                            title: "Associated Clients",
                            dataIndex: "clientNames",
                            key: "clientNames",
                            render: (val: string) => (
                              <span className="text-xs text-slate-700 font-medium">
                                {val || "-"}
                              </span>
                            ),
                          },
                          {
                            title: "Status",
                            dataIndex: "status",
                            key: "status",
                            width: 90,
                            render: (val: string) => (
                              <Tag color={val === "active" ? "green" : "default"}>
                                {(val || "active").toUpperCase()}
                              </Tag>
                            ),
                          },
                          {
                            title: "Change Type",
                            dataIndex: "action",
                            key: "action",
                            width: 110,
                            render: (val: string) => (
                              <Tag color={val === "created" ? "success" : "processing"}>
                                {val === "created" ? "Created" : "Updated"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Created By",
                            key: "creator",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.creator, record.createdAt),
                          },
                          {
                            title: "Last Updated",
                            key: "updater",
                            width: 160,
                            render: (_: any, record: RecentChangeItem) =>
                              renderActorCell(record.updater || record.creator, record.updatedAt),
                          },
                          {
                            title: "Action",
                            key: "view",
                            width: 90,
                            align: "center",
                            render: () => (
                              <Link
                                to="/client-users"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                View Hub →
                              </Link>
                            ),
                          },
                        ],
                      }}
                      renderMobileCard={(record: RecentChangeItem) => (
                        <div key={record.id} className="bg-white rounded-lg border border-slate-200 p-3 mb-2.5">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-slate-800 text-sm">
                              {record.name}
                            </span>
                            <Tag color="magenta">Client User</Tag>
                          </div>
                          <div className="text-xs text-slate-500 mb-2">
                            Clients: {record.clientNames}
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-100">
                            <span>by {record.creator?.name || "System"}</span>
                            <span>{formatRelativeTime(record.primaryDate)}</span>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default RecentChangesReport;

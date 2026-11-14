import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Button,
  Tag,
  Progress,
  Avatar,
  Space,
  Badge,
  Input,
  Tooltip,
  Empty,
  Spin,
  Radio,
} from "antd";
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  SearchOutlined,
  ReloadOutlined,
  RiseOutlined,
  EyeOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import { fetchProjects } from "@/service/project.service";
import { useWorkingYearContext } from "@/context/WorkingYearContext";
import { exportReportToExcel } from "../utils/reportExportUtils";
import { ReportColumnConfig } from "../types/reportTypes";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PowerTable, getGlobalPaginationConfig } from "@/components/Table";
import type { PowerTableColumn } from "@/components/Table";
import { DualDateConverter } from "@/utils/dateConverter";

const { Title, Text } = Typography;

interface ProjectInsightsReportProps {
  onBack: () => void;
}

type ActiveFilterPreset =
  | "all"
  | "open"
  | "active"
  | "today"
  | "week"
  | "month"
  | "longest"
  | "stalled"
  | "carried_over"
  | "completed";

const CHART_PIE_COLORS = ["#13c2c2", "#1677ff", "#52c41a", "#722ed1", "#f5222d", "#8c8c8c"];

export const ProjectInsightsReport: React.FC<ProjectInsightsReportProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const { workingYears, selectedWorkingYear, selectedWorkingYearId, setSelectedWorkingYearById } =
    useWorkingYearContext();

  const [activePreset, setActivePreset] = useState<ActiveFilterPreset>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showCharts, setShowCharts] = useState(true);
  const [chartMode, setChartMode] = useState<"yearly" | "monthly">("yearly");

  // 1. Fetch projects for the selected working year (with full carried over and completed items)
  const {
    data: rawProjects = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["project-insights-data", selectedWorkingYearId],
    queryFn: async () => {
      const res = await fetchProjects({
        status: "all",
        workingYearId: selectedWorkingYearId || undefined,
      });
      return Array.isArray(res) ? res : res?.results || [];
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch all global projects across all years for global Yearly Breakdown analysis
  const { data: allGlobalProjects = [] } = useQuery({
    queryKey: ["project-insights-global-all"],
    queryFn: async () => {
      const res = await fetchProjects({ status: "all" });
      return Array.isArray(res) ? res : res?.results || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const now = dayjs();

  // 3. Compute Metrics with clean Open vs Active Separation
  const metrics = useMemo(() => {
    const list = rawProjects || [];

    // Distinct separation:
    // OPEN: Active status, BUT no worklogs yet recorded
    const openProjects = list.filter((p: any) => p.status === "active" && !p.firstWorklogAt);

    // ACTIVE: Active status, AND worklogs have commenced
    const activeProjects = list.filter((p: any) => p.status === "active" && Boolean(p.firstWorklogAt));

    const createdToday = list.filter((p: any) => {
      const d = p.createdAt || p.startingDate;
      return d && dayjs(d).isValid() && dayjs(d).isSame(now, "day");
    });

    const createdThisWeek = list.filter((p: any) => {
      const d = p.createdAt || p.startingDate;
      return d && dayjs(d).isValid() && dayjs(d).isAfter(now.subtract(7, "day"));
    });

    const createdThisMonth = list.filter((p: any) => {
      const d = p.createdAt || p.startingDate;
      return d && dayjs(d).isValid() && dayjs(d).isAfter(now.subtract(30, "day"));
    });

    // Longest running: active running projects sorted by dayCounter descending
    const longestRunning = [...activeProjects]
      .filter((p: any) => (p.dayCounter || 0) > 0)
      .sort((a: any, b: any) => (b.dayCounter || 0) - (a.dayCounter || 0));

    // Stalled / Attention Needed:
    // Open projects without worklogs > 30 days OR active projects running > 45 days with low task progress
    const stalled = list.filter((p: any) => {
      if (p.status !== "active") return false;
      const isUnstarted = !p.firstWorklogAt;
      const stats = p.taskCompletionStats;
      const progress = stats && stats.total > 0 ? stats.completed / stats.total : 0;
      const isAgingLowProgress = (p.dayCounter || 0) > 45 && progress < 0.25;
      return isUnstarted || isAgingLowProgress;
    });

    const carriedOver = list.filter((p: any) => p.isCarriedOver);

    const completed = list.filter((p: any) => p.status === "completed" || p.status === "signed_off");

    const completedWithDuration = completed.filter((p: any) => (p.dayCounter || 0) > 0);
    const avgCompletionDays =
      completedWithDuration.length > 0
        ? Math.round(
            completedWithDuration.reduce((acc: number, p: any) => acc + (p.dayCounter || 0), 0) /
              completedWithDuration.length
          )
        : 0;

    return {
      total: list.length,
      openProjects,
      activeProjects,
      createdToday,
      createdThisWeek,
      createdThisMonth,
      longestRunning,
      stalled,
      carriedOver,
      completed,
      avgCompletionDays,
    };
  }, [rawProjects, now]);

  // 4. Yearly Breakdown across Fiscal Years
  const yearlyBreakdownData = useMemo(() => {
    if (!workingYears || workingYears.length === 0) return [];

    // Order working years chronologically
    const sortedWYs = [...workingYears].sort((a, b) =>
      (a.startDateAD || "").localeCompare(b.startDateAD || "")
    );

    return sortedWYs.map((wy) => {
      const yearProjects = (allGlobalProjects || []).filter((p: any) => p.workingYearId === wy.id);

      const openCount = yearProjects.filter((p: any) => p.status === "active" && !p.firstWorklogAt).length;
      const activeCount = yearProjects.filter((p: any) => p.status === "active" && Boolean(p.firstWorklogAt)).length;
      const completedCount = yearProjects.filter((p: any) => p.status === "completed").length;
      const signedOffCount = yearProjects.filter((p: any) => p.status === "signed_off").length;
      const otherCount = yearProjects.filter((p: any) => p.status === "suspended" || p.status === "archived").length;

      return {
        id: wy.id,
        name: wy.name,
        isCurrent: wy.isCurrent,
        total: yearProjects.length,
        open: openCount,
        active: activeCount,
        completed: completedCount,
        signedOff: signedOffCount,
        other: otherCount,
      };
    });
  }, [workingYears, allGlobalProjects]);

  // 5. Unique Managers & Leads for Filtering
  const { managerOptions, leadOptions } = useMemo(() => {
    const managers = new Map<string, string>();
    const leads = new Map<string, string>();

    rawProjects.forEach((p: any) => {
      if (p.projectManager && p.projectManager.id) {
        managers.set(p.projectManager.id, p.projectManager.name || "Unknown Manager");
      }
      if (p.projectLead && p.projectLead.id) {
        leads.set(p.projectLead.id, p.projectLead.name || "Unknown Lead");
      }
    });

    return {
      managerOptions: Array.from(managers.entries()).map(([id, name]) => ({ value: id, label: name })),
      leadOptions: Array.from(leads.entries()).map(([id, name]) => ({ value: id, label: name })),
    };
  }, [rawProjects]);

  // 6. Filter Projects based on preset & controls
  const filteredProjects = useMemo(() => {
    let result = [...rawProjects];

    // Apply active preset filter
    if (activePreset === "open") {
      result = metrics.openProjects;
    } else if (activePreset === "active") {
      result = metrics.activeProjects;
    } else if (activePreset === "today") {
      result = metrics.createdToday;
    } else if (activePreset === "week") {
      result = metrics.createdThisWeek;
    } else if (activePreset === "month") {
      result = metrics.createdThisMonth;
    } else if (activePreset === "longest") {
      result = metrics.longestRunning;
    } else if (activePreset === "stalled") {
      result = metrics.stalled;
    } else if (activePreset === "carried_over") {
      result = metrics.carriedOver;
    } else if (activePreset === "completed") {
      result = metrics.completed;
    }

    // Apply manager filter
    if (selectedManager !== "all") {
      result = result.filter((p: any) => p.projectManager?.id === selectedManager);
    }

    // Apply lead filter
    if (selectedLead !== "all") {
      result = result.filter((p: any) => p.projectLead?.id === selectedLead);
    }

    // Apply status filter with distinct Open vs Active support
    if (selectedStatus === "open") {
      result = result.filter((p: any) => p.status === "active" && !p.firstWorklogAt);
    } else if (selectedStatus === "active") {
      result = result.filter((p: any) => p.status === "active" && Boolean(p.firstWorklogAt));
    } else if (selectedStatus !== "all") {
      result = result.filter((p: any) => p.status === selectedStatus);
    }

    // Apply search keyword
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter((p: any) => {
        const name = (p.name || "").toLowerCase();
        const client = (p.customer?.name || p.client?.name || "").toLowerCase();
        const manager = (p.projectManager?.name || "").toLowerCase();
        const lead = (p.projectLead?.name || "").toLowerCase();
        const nature = (p.natureOfWork?.name || "").toLowerCase();
        return (
          name.includes(q) ||
          client.includes(q) ||
          manager.includes(q) ||
          lead.includes(q) ||
          nature.includes(q)
        );
      });
    }

    // Default sorting for longest running
    if (activePreset === "longest") {
      return [...result].sort((a: any, b: any) => (b.dayCounter || 0) - (a.dayCounter || 0));
    }

    return result;
  }, [rawProjects, activePreset, metrics, selectedManager, selectedLead, selectedStatus, searchKeyword]);

  // 7. Visual Chart Data
  const chartData = useMemo(() => {
    // Status distribution: cleanly showing Open, Active, Completed, Signed Off, Other
    const openCount = rawProjects.filter((p: any) => p.status === "active" && !p.firstWorklogAt).length;
    const activeCount = rawProjects.filter((p: any) => p.status === "active" && Boolean(p.firstWorklogAt)).length;
    const completedCount = rawProjects.filter((p: any) => p.status === "completed").length;
    const signedOffCount = rawProjects.filter((p: any) => p.status === "signed_off").length;
    const otherCount = rawProjects.filter((p: any) => p.status === "suspended" || p.status === "archived").length;

    const pieData = [
      { name: "OPEN (NOT STARTED)", value: openCount, color: "#13c2c2" },
      { name: "ACTIVE (RUNNING)", value: activeCount, color: "#1677ff" },
      { name: "COMPLETED", value: completedCount, color: "#52c41a" },
      { name: "SIGNED OFF", value: signedOffCount, color: "#722ed1" },
      { name: "SUSPENDED/ARCHIVED", value: otherCount, color: "#fa8c16" },
    ].filter((item) => item.value > 0);

    // Monthly velocity over 12 months
    const monthMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const m = now.subtract(i, "month").format("MMM YYYY");
      monthMap.set(m, 0);
    }
    allGlobalProjects.forEach((p: any) => {
      const d = p.createdAt || p.startingDate;
      if (d && dayjs(d).isValid()) {
        const m = dayjs(d).format("MMM YYYY");
        if (monthMap.has(m)) {
          monthMap.set(m, (monthMap.get(m) || 0) + 1);
        }
      }
    });
    const monthlyVelocity = Array.from(monthMap.entries()).map(([month, created]) => ({
      month,
      created,
    }));

    // Top 5 Longest Running Projects
    const topLongest = [...metrics.longestRunning].slice(0, 5).map((p: any) => ({
      name: p.name.length > 22 ? p.name.slice(0, 20) + "..." : p.name,
      days: p.dayCounter || 0,
      lead: p.projectLead?.name || "Unassigned",
    }));

    return { pieData, monthlyVelocity, topLongest };
  }, [rawProjects, allGlobalProjects, metrics.longestRunning, now]);

  // 8. Excel Export Handler
  const handleExportExcel = () => {
    const exportColumns: ReportColumnConfig[] = [
      { key: "sn", title: "S.N.", defaultVisible: true },
      { key: "name", title: "Project Name", defaultVisible: true },
      { key: "clientName", title: "Client", defaultVisible: true },
      { key: "managerName", title: "Project Manager", defaultVisible: true },
      { key: "leadName", title: "Project Lead", defaultVisible: true },
      { key: "status", title: "Status", defaultVisible: true },
      { key: "workingYearName", title: "Working Year", defaultVisible: true },
      { key: "isCarriedOverText", title: "Carried Over", defaultVisible: true },
      { key: "dayCounterText", title: "Day Counter (Elapsed)", defaultVisible: true },
      { key: "creatorName", title: "Created By", defaultVisible: true },
      { key: "createdDateText", title: "Created Date (AD)", defaultVisible: true },
      { key: "createdDateBs", title: "Created Date (BS)", defaultVisible: true },
      { key: "startedDateText", title: "First Worklog Date", defaultVisible: true },
      { key: "progressText", title: "Task Completion %", defaultVisible: true },
    ];

    const exportRows = filteredProjects.map((p: any) => {
      const stats = p.taskCompletionStats;
      const progress = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      const wyName = p.workingYear?.name || (p.fiscalYear ? `FY ${p.fiscalYear}` : "-");

      const isOpen = p.status === "active" && !p.firstWorklogAt;
      const statusText = isOpen ? "OPEN (NOT STARTED)" : (p.status || "").toUpperCase();

      const rawDate = p.createdAt || p.startingDate;
      const validD = rawDate && dayjs(rawDate).isValid() ? dayjs(rawDate) : null;
      const adStr = validD ? validD.format("YYYY-MM-DD") : "-";

      let bsStr = "-";
      if (validD) {
        try {
          const np = DualDateConverter.gregorianToNepali(validD);
          if (np) {
            bsStr = `${np.getYear()}-${String(np.getMonth() + 1).padStart(2, "0")}-${String(np.getDate()).padStart(2, "0")}`;
          }
        } catch (e) {}
      }

      return {
        name: p.name || "-",
        clientName: p.customer?.name || p.client?.name || "-",
        managerName: p.projectManager?.name || "-",
        leadName: p.projectLead?.name || "-",
        status: statusText,
        workingYearName: wyName,
        isCarriedOverText: p.isCarriedOver ? "Yes (Carried Over)" : "No",
        dayCounterText: p.dayCounter !== null && p.dayCounter !== undefined ? `${p.dayCounter} days` : "Not started",
        creatorName: p.creator?.name || "System",
        createdDateText: adStr,
        createdDateBs: bsStr,
        startedDateText: p.firstWorklogAt && dayjs(p.firstWorklogAt).isValid() ? dayjs(p.firstWorklogAt).format("YYYY-MM-DD") : "No worklogs",
        progressText: `${progress}% (${stats?.completed || 0}/${stats?.total || 0} tasks)`,
      };
    });

    const activeFilterLabel =
      activePreset === "all"
        ? "All Projects"
        : activePreset === "open"
        ? "Open Projects"
        : activePreset === "active"
        ? "Active In-Progress Projects"
        : activePreset === "today"
        ? "Created Today"
        : activePreset === "week"
        ? "Created This Week"
        : activePreset === "month"
        ? "Created This Month"
        : activePreset === "longest"
        ? "Longest Running"
        : activePreset === "stalled"
        ? "Attention Needed / Stalled"
        : activePreset === "carried_over"
        ? "Carried Over"
        : "Completed";

    exportReportToExcel(
      {
        reportTitle: `Project Insights & Health Report - ${activeFilterLabel}`,
        dateRangeText: selectedWorkingYear ? selectedWorkingYear.name : "All Working Years",
        filterSummaryText: `Preset: ${activeFilterLabel} | Total Listed: ${exportRows.length}`,
      },
      exportColumns,
      exportRows
    );
  };

  // 9. PowerTable Columns Definition (Conforming to PowerTable Rules)
  const tableColumns: PowerTableColumn<any>[] = [
    {
      title: "S.N.",
      key: "index",
      defaultWidth: 60,
      width: 60,
      align: "center",
      render: (_: any, __: any, idx: number) => (
        <span className="text-slate-400 font-mono text-xs">{idx + 1}</span>
      ),
    },
    {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
      defaultWidth: 240,
      width: 240,
      sorter: (a: any, b: any) => (a.name || "").localeCompare(b.name || ""),
      render: (_: any, record: any) => (
        <div>
          <Link
            to={`/projects/${record.id}`}
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline block"
          >
            {record.name}
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-500">
              {record.natureOfWork?.name || "General"}
            </span>
            {record.isCarriedOver && (
              <Tooltip title={`Unfinished project carried over from FY ${record.workingYear?.name || record.fiscalYear}`}>
                <Tag color="orange" style={{ fontSize: "10px", padding: "0 4px", lineHeight: "16px", margin: 0 }}>
                  Carried Over
                </Tag>
              </Tooltip>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Client",
      key: "client",
      defaultWidth: 160,
      width: 160,
      render: (_: any, record: any) => {
        const clientName = record.customer?.name || record.client?.name || "-";
        return (
          <span className="text-slate-700 font-medium text-xs truncate block max-w-[150px]" title={clientName}>
            {clientName}
          </span>
        );
      },
    },
    {
      title: "Manager & Lead",
      key: "team",
      defaultWidth: 180,
      width: 180,
      render: (_: any, record: any) => (
        <div className="space-y-1">
          {record.projectManager && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Avatar size={18} style={{ backgroundColor: "#1677ff", fontSize: 10 }}>
                {record.projectManager.name?.[0]?.toUpperCase() || "M"}
              </Avatar>
              <span className="truncate max-w-[130px]" title={record.projectManager.name}>
                {record.projectManager.name}
              </span>
            </div>
          )}
          {record.projectLead && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Avatar size={18} style={{ backgroundColor: "#52c41a", fontSize: 10 }}>
                {record.projectLead.name?.[0]?.toUpperCase() || "L"}
              </Avatar>
              <span className="truncate max-w-[130px]" title={record.projectLead.name}>
                {record.projectLead.name}
              </span>
            </div>
          )}
          {!record.projectManager && !record.projectLead && (
            <span className="text-xs text-slate-400 italic">-</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      defaultWidth: 120,
      width: 120,
      sorter: (a: any, b: any) => {
        const aStatus = a.status === "active" && !a.firstWorklogAt ? "open" : a.status || "";
        const bStatus = b.status === "active" && !b.firstWorklogAt ? "open" : b.status || "";
        return aStatus.localeCompare(bStatus);
      },
      render: (_: any, record: any) => {
        const isOpen = record.status === "active" && !record.firstWorklogAt;
        if (isOpen) {
          return (
            <Tooltip title="Open project — Created but no worklog has been recorded yet">
              <Tag color="cyan" style={{ fontWeight: 600, margin: 0 }}>
                OPEN
              </Tag>
            </Tooltip>
          );
        }
        if (record.status === "active") {
          return (
            <Tooltip title={`Work in progress — Active since ${record.firstWorklogAt ? dayjs(record.firstWorklogAt).format('YYYY-MM-DD') : 'start'}`}>
              <Tag color="blue" style={{ fontWeight: 600, margin: 0 }}>
                ACTIVE
              </Tag>
            </Tooltip>
          );
        }
        if (record.status === "completed") {
          return <Tag color="green" style={{ fontWeight: 600, margin: 0 }}>COMPLETED</Tag>;
        }
        if (record.status === "signed_off") {
          return <Tag color="purple" style={{ fontWeight: 600, margin: 0 }}>SIGNED OFF</Tag>;
        }
        if (record.status === "suspended") {
          return <Tag color="red" style={{ fontWeight: 600, margin: 0 }}>SUSPENDED</Tag>;
        }
        return <Tag color="default" style={{ fontWeight: 600, margin: 0 }}>{record.status?.toUpperCase() || "-"}</Tag>;
      },
    },
    {
      title: "Duration (Day Counter)",
      dataIndex: "dayCounter",
      key: "dayCounter",
      defaultWidth: 150,
      width: 150,
      sorter: (a: any, b: any) => (a.dayCounter || 0) - (b.dayCounter || 0),
      render: (_: any, record: any) => {
        const days = record.dayCounter;
        const isCompleted = record.status === "completed" || record.status === "signed_off";
        const isOpen = record.status === "active" && !record.firstWorklogAt;

        if (isOpen) {
          return (
            <Tag color="default" style={{ fontStyle: "italic", fontSize: "11px", margin: 0 }}>
              Not started
            </Tag>
          );
        }

        if (days === null || days === undefined) {
          return (
            <Tag color="default" style={{ fontStyle: "italic", fontSize: "11px", margin: 0 }}>
              {isCompleted ? "No worklogs" : "Not started"}
            </Tag>
          );
        }

        if (isCompleted) {
          return (
            <Tooltip title={`Project ran for ${days} days from start to completion`}>
              <Tag color="green" style={{ fontWeight: 500, margin: 0 }}>
                <CheckCircleOutlined className="mr-1" />
                {days} days
              </Tag>
            </Tooltip>
          );
        }

        // Active project duration highlighting
        let color = "blue";
        let isAlert = false;
        if (days > 90) {
          color = "red";
          isAlert = true;
        } else if (days > 60) {
          color = "orange";
        } else if (days > 30) {
          color = "gold";
        }

        return (
          <Tooltip title={`Active for ${days} days since first worklog`}>
            <Tag color={color} style={{ fontWeight: 600, margin: 0 }}>
              {isAlert && <WarningOutlined className="mr-1" />}
              Day {days}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      defaultWidth: 140,
      width: 140,
      sorter: (a: any, b: any) =>
        new Date(a.createdAt || a.startingDate || 0).getTime() -
        new Date(b.createdAt || b.startingDate || 0).getTime(),
      render: (_: any, record: any) => {
        const rawDate = record.createdAt || record.startingDate;
        if (!rawDate) return <span className="text-slate-400">-</span>;

        const d = dayjs(rawDate);
        if (!d.isValid()) return <span className="text-slate-400">-</span>;

        const adStr = d.format("YYYY-MM-DD");
        let bsStr = "";
        try {
          const np = DualDateConverter.gregorianToNepali(d);
          if (np) {
            bsStr = `${np.getYear()}-${String(np.getMonth() + 1).padStart(2, "0")}-${String(np.getDate()).padStart(2, "0")}`;
          }
        } catch (e) {}

        const isToday = d.isSame(now, "day");
        const isWithinWeek = d.isAfter(now.subtract(7, "day"));

        return (
          <div>
            <div className="text-xs font-semibold text-slate-700">
              {bsStr || adStr}
            </div>
            {bsStr && (
              <div className="text-[10px] text-slate-400">
                {adStr}
              </div>
            )}
            {isToday && (
              <span className="text-[10px] text-blue-600 font-bold">Today</span>
            )}
            {!isToday && isWithinWeek && (
              <span className="text-[10px] text-emerald-600 font-medium">This Week</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Created By",
      dataIndex: ["creator", "name"],
      key: "creator",
      defaultWidth: 150,
      width: 150,
      sorter: (a: any, b: any) =>
        (a.creator?.name || "").localeCompare(b.creator?.name || ""),
      render: (_: any, record: any) =>
        record?.creator?.name ? (
          <Space size={6}>
            <Avatar
              size="small"
              className="bg-indigo-600 shrink-0"
              src={
                record?.creator?.avatar
                  ? `${import.meta.env.VITE_BACKEND_URI}/document/${record?.creator?.avatar}`
                  : undefined
              }
            >
              {record?.creator?.name?.[0]}
            </Avatar>
            <span className="font-medium text-slate-700 text-xs truncate max-w-[100px]" title={record?.creator?.name}>
              {record?.creator?.name}
            </span>
          </Space>
        ) : (
          <span className="text-slate-400 italic text-xs">System</span>
        ),
    },
    {
      title: "Task Completion",
      key: "completion",
      defaultWidth: 140,
      width: 140,
      render: (_: any, record: any) => {
        const stats = record.taskCompletionStats;
        const total = stats?.total || 0;
        const completed = stats?.completed || 0;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <div style={{ width: 120 }}>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="font-semibold text-slate-700">{percent}%</span>
              <span className="text-slate-400">
                {completed}/{total}
              </span>
            </div>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor={percent === 100 ? "#52c41a" : "#1677ff"}
            />
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      defaultWidth: 70,
      width: 70,
      align: "center",
      render: (_: any, record: any) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/projects/${record.id}`)}
          className="text-slate-500 hover:text-blue-600"
          title="View Project"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="flex items-center justify-center font-medium"
          >
            Back to Reports
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 m-0">
                Project Insights & Health Report
              </h1>
              <Tag color="blue" className="font-medium">
                {selectedWorkingYear ? `FY ${selectedWorkingYear.name}` : "All Fiscal Years"}
              </Tag>
              <Tag color="green" className="font-semibold">
                {metrics.total} Projects
              </Tag>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Open vs. active breakdown, yearly intake comparison, and project health indicators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Fiscal Year Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Fiscal Year:</span>
            <Select
              size="small"
              value={selectedWorkingYearId || "all"}
              onChange={(val) => setSelectedWorkingYearById(val === "all" ? null : val)}
              style={{ width: 140 }}
              options={[
                { value: "all", label: "All Years" },
                ...(workingYears || []).map((wy) => ({
                  value: wy.id,
                  label: wy.isCurrent ? `${wy.name} (Current)` : wy.name,
                })),
              ]}
            />
          </div>

          <Button
            icon={<ReloadOutlined spin={isRefetching} />}
            onClick={() => refetch()}
            title="Refresh Data"
          >
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 border-none"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Interactive Metric Cards (Clickable KPI Drilldown with Open vs Active Separation) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Key Indicators (Click any card to filter the PowerTable)
          </div>
          {activePreset !== "all" && (
            <Button
              type="link"
              size="small"
              onClick={() => setActivePreset("all")}
              className="text-xs p-0 font-medium text-blue-600"
            >
              Clear Filter (Show All {metrics.total})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Card 1: OPEN (Not Started) */}
          <div
            onClick={() => setActivePreset(activePreset === "open" ? "all" : "open")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "open"
                ? "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-cyan-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-cyan-600 mb-1">
              <span className="text-xs font-bold">Open</span>
              <FolderOpenOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.openProjects.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">No worklogs yet</div>
          </div>

          {/* Card 2: ACTIVE (Running) */}
          <div
            onClick={() => setActivePreset(activePreset === "active" ? "all" : "active")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "active"
                ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-xs font-bold">Active</span>
              <PlayCircleOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.activeProjects.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Work in progress</div>
          </div>

          {/* Card 3: Longest Running */}
          <div
            onClick={() => setActivePreset(activePreset === "longest" ? "all" : "longest")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "longest"
                ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-bold">Longest</span>
              <ClockCircleOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.longestRunning.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">By elapsed days</div>
          </div>

          {/* Card 4: Stalled / Attention Needed */}
          <div
            onClick={() => setActivePreset(activePreset === "stalled" ? "all" : "stalled")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "stalled"
                ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-xs font-bold">Attention</span>
              <WarningOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.stalled.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Unstarted / lagging</div>
          </div>

          {/* Card 5: Carried Over */}
          <div
            onClick={() => setActivePreset(activePreset === "carried_over" ? "all" : "carried_over")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "carried_over"
                ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-purple-600 mb-1">
              <span className="text-xs font-bold">Carried Over</span>
              <HistoryOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.carriedOver.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">From prior FYs</div>
          </div>

          {/* Card 6: Completed */}
          <div
            onClick={() => setActivePreset(activePreset === "completed" ? "all" : "completed")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "completed"
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-xs font-bold">Completed</span>
              <CheckCircleOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.completed.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {metrics.avgCompletionDays > 0 ? `Avg ${metrics.avgCompletionDays}d` : "Completed"}
            </div>
          </div>

          {/* Card 7: This Month Intake */}
          <div
            onClick={() => setActivePreset(activePreset === "month" ? "all" : "month")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "month"
                ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-bold">This Month</span>
              <AppstoreOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.createdThisMonth.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Past 30 days intake</div>
          </div>

          {/* Card 8: This Week Intake */}
          <div
            onClick={() => setActivePreset(activePreset === "week" ? "all" : "week")}
            className={`cursor-pointer p-3 rounded-xl border transition-all ${
              activePreset === "week"
                ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between text-indigo-600 mb-1">
              <span className="text-xs font-bold">This Week</span>
              <CalendarOutlined className="text-base" />
            </div>
            <div className="text-xl font-bold text-slate-800">
              {metrics.createdThisWeek.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Past 7 days intake</div>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Yearly Breakdown Strip */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-600 text-base" />
            <span className="font-bold text-sm text-slate-800">
              Visual Analytics & Yearly Intake Breakdown
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Radio.Group
              size="small"
              value={chartMode}
              onChange={(e) => setChartMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="yearly">📊 Yearly Breakdown</Radio.Button>
              <Radio.Button value="monthly">📅 Monthly Velocity</Radio.Button>
            </Radio.Group>

            <Button
              type="text"
              size="small"
              onClick={() => setShowCharts(!showCharts)}
              className="text-xs text-slate-500"
            >
              {showCharts ? "Hide Visuals" : "Show Visuals"}
            </Button>
          </div>
        </div>

        {showCharts && (
          <Row gutter={[16, 16]}>
            {/* Chart 1: Yearly Breakdown (or Monthly Velocity based on toggle) */}
            <Col xs={24} lg={11}>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 h-full flex flex-col">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>
                    {chartMode === "yearly"
                      ? "Yearly Fiscal Year Breakdown (Open vs Active vs Completed)"
                      : "Project Creation Velocity (Past 12 Months)"}
                  </span>
                  {chartMode === "yearly" && (
                    <span className="text-[11px] text-slate-400">All Fiscal Years</span>
                  )}
                </div>

                <div style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === "yearly" ? (
                      <BarChart data={yearlyBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                        <Bar dataKey="open" name="Open" fill="#13c2c2" stackId="a" />
                        <Bar dataKey="active" name="Active" fill="#1677ff" stackId="a" />
                        <Bar dataKey="completed" name="Completed" fill="#52c41a" stackId="a" />
                        <Bar dataKey="signedOff" name="Signed Off" fill="#722ed1" stackId="a" />
                      </BarChart>
                    ) : (
                      <BarChart data={chartData.monthlyVelocity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                        <RechartsTooltip />
                        <Bar dataKey="created" fill="#1677ff" radius={[4, 4, 0, 0]} name="New Projects" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </Col>

            {/* Chart 2: Top 5 Longest Running Leaderboard */}
            <Col xs={24} md={12} lg={7}>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 h-full flex flex-col">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <TrophyOutlined className="text-amber-500" />
                    Top Longest Running Active Projects
                  </span>
                  <Tag color="orange" style={{ margin: 0, fontSize: "10px" }}>
                    Leaderboard
                  </Tag>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {chartData.topLongest.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-8 text-center">
                      No active running projects
                    </div>
                  ) : (
                    chartData.topLongest.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-white border border-slate-200/80 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              idx === 0
                                ? "bg-amber-100 text-amber-800"
                                : idx === 1
                                ? "bg-slate-200 text-slate-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-700 truncate" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                        <Tag color={p.days > 90 ? "red" : "orange"} style={{ margin: 0, fontWeight: 600 }}>
                          Day {p.days}
                        </Tag>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Col>

            {/* Chart 3: Lifecycle Breakdown (Open vs Active vs Completed) */}
            <Col xs={24} md={12} lg={6}>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 h-full flex flex-col">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Current Lifecycle Breakdown
                </div>
                <div style={{ height: 210 }} className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.pieData.map((item, index) => (
                          <Cell key={`cell-${index}`} fill={item.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="w-full md:w-80">
            <Input
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search by project, client, manager, lead..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </div>

          {/* Filter Dropdowns with separate Open vs Active */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <Select
              size="middle"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 175 }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "open", label: "📂 Open (Not Started)" },
                { value: "active", label: "⚡ Active (In Progress)" },
                { value: "completed", label: "✅ Completed" },
                { value: "signed_off", label: "📝 Signed Off" },
                { value: "suspended", label: "⏸️ Suspended" },
              ]}
              placeholder="Filter Status"
            />

            {/* Manager Filter */}
            <Select
              size="middle"
              value={selectedManager}
              onChange={setSelectedManager}
              style={{ width: 160 }}
              options={[{ value: "all", label: "All Managers" }, ...managerOptions]}
              placeholder="Filter Manager"
            />

            {/* Lead Filter */}
            <Select
              size="middle"
              value={selectedLead}
              onChange={setSelectedLead}
              style={{ width: 160 }}
              options={[{ value: "all", label: "All Leads" }, ...leadOptions]}
              placeholder="Filter Lead"
            />

            {/* Clear All Filters */}
            {(activePreset !== "all" ||
              selectedManager !== "all" ||
              selectedLead !== "all" ||
              selectedStatus !== "all" ||
              searchKeyword.trim() !== "") && (
              <Button
                size="middle"
                onClick={() => {
                  setActivePreset("all");
                  setSelectedManager("all");
                  setSelectedLead("all");
                  setSelectedStatus("all");
                  setSearchKeyword("");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Indicator Tag */}
        {activePreset !== "all" && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
            <span className="text-xs text-slate-500">Active View:</span>
            <Tag
              color="blue"
              closable
              onClose={() => setActivePreset("all")}
              className="font-medium"
            >
              {activePreset === "open" && "📂 Open Projects (Not Started)"}
              {activePreset === "active" && "⚡ Active Projects (In Progress)"}
              {activePreset === "today" && "🆕 Created Today"}
              {activePreset === "week" && "📅 Created This Week"}
              {activePreset === "month" && "🗓️ Created This Month"}
              {activePreset === "longest" && "⏱️ Longest Running Active Projects"}
              {activePreset === "stalled" && "⚠️ Attention Needed / Stalled"}
              {activePreset === "carried_over" && "🔁 Carried Over Active Projects"}
              {activePreset === "completed" && "✅ Completed Projects"}
            </Tag>
            <span className="text-xs text-slate-400">
              Showing {filteredProjects.length} of {rawProjects.length} projects
            </span>
          </div>
        )}
      </div>

      {/* Main Insights Project Table (Conforming to PowerTable Rule) */}
      <Card
        styles={{ body: { padding: isMobile ? 0 : 12 } }}
        bordered={!isMobile}
        className={isMobile ? "bg-transparent border-0 shadow-none" : "rounded-xl shadow-sm"}
      >
        <PowerTable
          loading={isLoading}
          dataSource={filteredProjects}
          columns={tableColumns}
          rowKey="id"
          size="small"
          enableResize
          enableSearch={false}
          showToolbar={false}
          enableColumnCustomizer={false}
          pagination={getGlobalPaginationConfig(undefined, {
            pageSize: 15,
            total: filteredProjects.length,
            dataSourceLength: filteredProjects.length,
            isMobile,
          })}
          scroll={{ x: "max-content" }}
          rowClassName={(record: any) =>
            record?.isCarriedOver ? "bg-amber-50/40 hover:bg-amber-100/40" : ""
          }
        />
      </Card>
    </div>
  );
};

export default ProjectInsightsReport;

import { useSession } from "@/context/SessionContext";
import { useDeleteProject } from "@/hooks/project/useDeleteProject";
import { useProject } from "@/hooks/project/useProject";
import { ProjectType } from "@/types/project";
import { TaskType } from "@/types/task";
import { UserType } from "@/types/user";
import { checkPermissionForComponent } from "@/utils/permission";
import { DualDateConverter } from "@/utils/dateConverter";
import { fetchProject } from "@/service/project.service";
import {
  DownloadOutlined,
  EditOutlined,
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Space,
  Table,
  TableProps,
  Tooltip,
  Input,
  Modal,
  message,
  Tag,
  Progress,
  Spin,
  Statistic,
  Row,
  Col
} from "antd";
import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import moment from "moment";
import dayjs from "dayjs";
import {
  ALL_PROJECT_COLUMNS,
  getSavedColumnWidths,
  saveColumnWidths,
  getSavedPageSize,
  savePageSize
} from "./projectColumnsConfig";

// Header cell component supporting mouse drag column width resizing
const ResizableTitle = (props: any) => {
  const { onResize, width, children, columnKey, ...restProps } = props;

  if (!width || columnKey === "action") {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <th
      {...restProps}
      style={{
        ...restProps.style,
        position: "relative",
        userSelect: "none",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 10,
          cursor: "col-resize",
          zIndex: 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startWidth = width;

          const onMouseMove = (moveEvent: MouseEvent) => {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            const newWidth = Math.max(60, startWidth + moveEvent.clientX - startX);
            onResize(newWidth);
          };

          const onMouseUp = (upEvent: MouseEvent) => {
            upEvent.preventDefault();
            upEvent.stopPropagation();
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }}
      />
    </th>
  );
};

interface ProjectTableProps {
  showModal: (project?: ProjectType) => void;
  status: string;
  advancedFilters: any;
  selectedProjects: ProjectType[];
  setSelectedProjects: (projects: ProjectType[]) => void;
  showFilters: boolean;
  visibleColumnKeys?: string[];
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  showModal,
  status,
  advancedFilters,
  selectedProjects,
  setSelectedProjects,
  showFilters,
  visibleColumnKeys = ALL_PROJECT_COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(getSavedPageSize());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(getSavedColumnWidths());

  // Member details modal state (lazy loading full project details on demand)
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberModalType, setMemberModalType] = useState<"all" | "active">("all");
  const [activeProjectForMemberModal, setActiveProjectForMemberModal] = useState<any>(null);
  const [loadingMemberDetail, setLoadingMemberDetail] = useState(false);

  // Fetch projects with dynamic fields parameter
  const queryStatus = showFilters ? "all" : status;
  const fieldsParam = useMemo(() => visibleColumnKeys.join(","), [visibleColumnKeys]);
  const { data: project, isPending } = useProject({ status: queryStatus, fields: fieldsParam });
  const { permissions, profile } = useSession();

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [sortedInfo, setSortedInfo] = useState<any>({});
  const searchInput = useRef<any>(null);

  const userRole = (profile as any)?.role?.name?.toLowerCase();

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setPage(pagination.current);
    if (pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      savePageSize(pagination.pageSize);
    }
    setSortedInfo(sorter);
  };

  const handleResize = (key: string) => (width: number) => {
    setColumnWidths((prev) => {
      const updated = { ...prev, [key]: width };
      saveColumnWidths(updated);
      return updated;
    });
  };

  // Open Team Member modal and fetch complete task/member data for that project
  const handleOpenMemberModal = async (record: ProjectType, type: "all" | "active" = "all") => {
    setMemberModalType(type);
    setActiveProjectForMemberModal(record);
    setMemberModalOpen(true);
    setLoadingMemberDetail(true);
    try {
      const fullProject = await fetchProject({ id: record.id.toString() });
      if (fullProject) {
        const mergedProject = {
          ...fullProject,
          activeUsers: fullProject.activeUsers || (record as any).activeUsers || [],
        };
        setActiveProjectForMemberModal(mergedProject);
      }
    } catch (e) {
      console.error("Failed to load project details for modal:", e);
    } finally {
      setLoadingMemberDetail(false);
    }
  };

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex: string, title: string): any => {
    const getUniqueValues = () => {
      const getValue = (obj: any, path: string): any => {
        if (Array.isArray(path)) {
          return path.reduce((acc, key) => acc?.[key], obj);
        }
        return path.split(".").reduce((acc, key) => acc?.[key], obj);
      };
      const values = new Set<string>();
      filteredProject?.forEach((record: any) => {
        const value = getValue(record, dataIndex);
        if (value) {
          values.add(value.toString());
        }
      });
      return Array.from(values).sort();
    };

    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
        const uniqueValues = getUniqueValues();
        const currentValue = selectedKeys[0] || "";
        const filteredOptions = currentValue
          ? uniqueValues
              .filter((val) => val.toLowerCase().includes(currentValue.toLowerCase()))
              .slice(0, 10)
          : [];
        return (
          <div style={{ padding: 8 }}>
            <Input
              ref={searchInput}
              placeholder={`Search ${title}`}
              value={currentValue}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedKeys(val ? [val] : []);
              }}
              onPressEnter={() => {
                handleSearch(selectedKeys, confirm, dataIndex);
              }}
              style={{ marginBottom: 8, display: "block" }}
            />
            {filteredOptions.length > 0 && currentValue && (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  marginBottom: 8,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                }}
              >
                {filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "4px 8px",
                      cursor: "pointer",
                      backgroundColor: "white",
                      borderBottom: idx < filteredOptions.length - 1 ? "1px solid #f0f0f0" : "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                    onClick={() => {
                      setSelectedKeys([option]);
                      handleSearch([option], confirm, dataIndex);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            <Space>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  clearFilters();
                  setSelectedKeys([]);
                  setSearchText("");
                  setSearchedColumn("");
                  confirm({ closeDropdown: false });
                }}
                size="small"
                style={{ width: 90 }}
              >
                Reset
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value: string, record: any) => {
        const getValue = (obj: any, path: string): any => {
          if (Array.isArray(path)) {
            return path.reduce((acc, key) => acc?.[key], obj);
          }
          return path.split(".").reduce((acc, key) => acc?.[key], obj);
        };
        const fieldValue = getValue(record, dataIndex);
        return fieldValue
          ? fieldValue.toString().toLowerCase().includes(value.toLowerCase())
          : false;
      },
      onFilterDropdownVisibleChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
      render: (text: string) =>
        searchedColumn === dataIndex ? (
          <Highlighter
            highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text ? text.toString() : ""}
          />
        ) : (
          text
        ),
    };
  };

  // Filter data based on advanced filters with deterministic sorting
  const filteredProject = useMemo(() => {
    if (!project) return [];
    let filtered = [...project];
    if (advancedFilters.dateRange && advancedFilters.dateRange.length === 2) {
      filtered = filtered.filter((p: any) => {
        const startDate = moment(p.startingDate);
        const endDate = moment(p.endingDate);
        const [filterStart, filterEnd] = advancedFilters.dateRange;
        return (
          startDate.isSameOrAfter(filterStart, "day") &&
          endDate.isSameOrBefore(filterEnd, "day")
        );
      });
    }
    if (advancedFilters.clientId) {
      filtered = filtered.filter((p: any) => p.customer?.id === advancedFilters.clientId);
    }
    if (advancedFilters.projectLeadId) {
      filtered = filtered.filter((p: any) => p.projectLead?.id === advancedFilters.projectLeadId);
    }
    if (advancedFilters.projectManagerId) {
      filtered = filtered.filter(
        (p: any) => p.projectManager?.id === advancedFilters.projectManagerId
      );
    }
    if (advancedFilters.natureOfWork) {
      filtered = filtered.filter((p: any) => {
        const natureId =
          typeof p.natureOfWork === "object" ? p.natureOfWork?.id : p.natureOfWork;
        return natureId === advancedFilters.natureOfWork;
      });
    }
    if (advancedFilters.status) {
      filtered = filtered.filter((p: any) => p.status === advancedFilters.status);
    }
    return filtered.sort((a: any, b: any) => {
      const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aCreatedAt !== bCreatedAt) {
        return bCreatedAt - aCreatedAt;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [project, advancedFilters]);

  // Helper to calculate project completion details (fixes 0/0 tasks bug)
  const getProjectCompletionData = (record: any) => {
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
          t.status === "first_verified" ||
          t.status === "second_verified"
      ).length;
    }

    let percent = 0;
    if (total > 0) {
      percent = Math.round((completed / total) * 100);
    } else {
      percent = 0;
    }

    return { total, completed, percent };
  };

  // Build full set of available column definitions
  const allColumnsMap: Record<string, any> = {
    name: {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
      width: columnWidths["name"] || 200,
      onHeaderCell: () => ({
        width: columnWidths["name"] || 200,
        onResize: handleResize("name"),
        columnKey: "name",
      }),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
      ...getColumnSearchProps("name", "Project Name"),
      render: (_: any, record: any) => (
        <Link to={`/projects/${record.id}`} className="text-blue-600 font-medium">
          {record.name}
        </Link>
      ),
    },
    natureOfWork: {
      title: "Nature Of Project",
      dataIndex: ["natureOfWork", "name"],
      key: "natureOfWork",
      width: columnWidths["natureOfWork"] || 160,
      onHeaderCell: () => ({
        width: columnWidths["natureOfWork"] || 160,
        onResize: handleResize("natureOfWork"),
        columnKey: "natureOfWork",
      }),
      sorter: (a: any, b: any) => {
        const aName =
          typeof a.natureOfWork === "object"
            ? a.natureOfWork?.name || ""
            : a.natureOfWork || "";
        const bName =
          typeof b.natureOfWork === "object"
            ? b.natureOfWork?.name || ""
            : b.natureOfWork || "";
        return aName.localeCompare(bName);
      },
      sortOrder: sortedInfo.columnKey === "natureOfWork" && sortedInfo.order,
      ...getColumnSearchProps("natureOfWork.name", "Nature Of Project"),
      render: (_: any, record: any) =>
        typeof record.natureOfWork === "object"
          ? record.natureOfWork?.name
          : record.natureOfWork || "-",
    },
    client: {
      title: "Client",
      dataIndex: ["customer", "name"],
      key: "client",
      width: columnWidths["client"] || 160,
      onHeaderCell: () => ({
        width: columnWidths["client"] || 160,
        onResize: handleResize("client"),
        columnKey: "client",
      }),
      sorter: (a: any, b: any) =>
        (a.customer?.name || "").localeCompare(b.customer?.name || ""),
      sortOrder: sortedInfo.columnKey === "client" && sortedInfo.order,
      ...getColumnSearchProps("customer.name", "Client"),
      render: (_: any, record: any) => record?.customer?.name || "-",
    },
    projectManager: {
      title: "Manager",
      dataIndex: ["projectManager", "name"],
      key: "projectManager",
      width: columnWidths["projectManager"] || 150,
      onHeaderCell: () => ({
        width: columnWidths["projectManager"] || 150,
        onResize: handleResize("projectManager"),
        columnKey: "projectManager",
      }),
      sorter: (a: any, b: any) =>
        (a.projectManager?.name || "").localeCompare(b.projectManager?.name || ""),
      sortOrder: sortedInfo.columnKey === "projectManager" && sortedInfo.order,
      ...getColumnSearchProps("projectManager.name", "Manager"),
      render: (_: any, record: any) =>
        record?.projectManager ? (
          <Space size={6}>
            <Avatar
              size="small"
              className="bg-blue-600"
              src={
                record?.projectManager?.avatar
                  ? `${import.meta.env.VITE_BACKEND_URI}/document/${record?.projectManager?.avatar}`
                  : undefined
              }
            >
              {record?.projectManager?.name?.[0]}
            </Avatar>
            <span>{record?.projectManager?.name}</span>
          </Space>
        ) : (
          "-"
        ),
    },
    projectLead: {
      title: "Lead",
      dataIndex: ["projectLead", "name"],
      key: "projectLead",
      width: columnWidths["projectLead"] || 150,
      onHeaderCell: () => ({
        width: columnWidths["projectLead"] || 150,
        onResize: handleResize("projectLead"),
        columnKey: "projectLead",
      }),
      sorter: (a: any, b: any) =>
        (a.projectLead?.name || "").localeCompare(b.projectLead?.name || ""),
      sortOrder: sortedInfo.columnKey === "projectLead" && sortedInfo.order,
      ...getColumnSearchProps("projectLead.name", "Lead"),
      render: (_: any, record: any) =>
        record?.projectLead ? (
          <Space size={6}>
            <Avatar
              size="small"
              className="bg-emerald-600"
              src={
                record?.projectLead?.avatar
                  ? `${import.meta.env.VITE_BACKEND_URI}/document/${record?.projectLead?.avatar}`
                  : undefined
              }
            >
              {record?.projectLead?.name?.[0]}
            </Avatar>
            <span>{record?.projectLead?.name}</span>
          </Space>
        ) : (
          "-"
        ),
    },
    startingDate: {
      title: "Start Date",
      dataIndex: "startingDate",
      key: "startingDate",
      width: columnWidths["startingDate"] || 130,
      onHeaderCell: () => ({
        width: columnWidths["startingDate"] || 130,
        onResize: handleResize("startingDate"),
        columnKey: "startingDate",
      }),
      sorter: (a: any, b: any) => moment(a.startingDate).unix() - moment(b.startingDate).unix(),
      sortOrder: sortedInfo.columnKey === "startingDate" && sortedInfo.order,
      ...getColumnSearchProps("startingDate", "Start Date"),
      render: (_: any, record: any) => {
        if (record.startingDate) {
          try {
            const date = dayjs(record.startingDate);
            const dualDate = DualDateConverter.createDualDate(date);
            const nepaliStr = dualDate.nepali.format("YYYY-MM-DD", "np");
            const englishStr = date.format("MMM D, YYYY");
            return (
              <Tooltip title={`English: ${englishStr}`}>
                <span style={{ cursor: "pointer", whiteSpace: "nowrap" }}>{nepaliStr}</span>
              </Tooltip>
            );
          } catch (e) {
            return record.startingDate;
          }
        }
        return "-";
      },
    },
    endingDate: {
      title: "End Date",
      dataIndex: "endingDate",
      key: "endingDate",
      width: columnWidths["endingDate"] || 130,
      onHeaderCell: () => ({
        width: columnWidths["endingDate"] || 130,
        onResize: handleResize("endingDate"),
        columnKey: "endingDate",
      }),
      sorter: (a: any, b: any) => moment(a.endingDate).unix() - moment(b.endingDate).unix(),
      sortOrder: sortedInfo.columnKey === "endingDate" && sortedInfo.order,
      ...getColumnSearchProps("endingDate", "End Date"),
      render: (_: any, record: any) => {
        if (record.endingDate) {
          try {
            const date = dayjs(record.endingDate);
            const dualDate = DualDateConverter.createDualDate(date);
            const nepaliStr = dualDate.nepali.format("YYYY-MM-DD", "np");
            const englishStr = date.format("MMM D, YYYY");
            return (
              <Tooltip title={`English: ${englishStr}`}>
                <span style={{ cursor: "pointer", whiteSpace: "nowrap" }}>{nepaliStr}</span>
              </Tooltip>
            );
          } catch (e) {
            return record.endingDate;
          }
        }
        return "-";
      },
    },
    fiscalYear: {
      title: "Fiscal Year",
      dataIndex: "fiscalYear",
      key: "fiscalYear",
      width: columnWidths["fiscalYear"] || 110,
      onHeaderCell: () => ({
        width: columnWidths["fiscalYear"] || 110,
        onResize: handleResize("fiscalYear"),
        columnKey: "fiscalYear",
      }),
      sorter: (a: any, b: any) => (a.fiscalYear || 0) - (b.fiscalYear || 0),
      sortOrder: sortedInfo.columnKey === "fiscalYear" && sortedInfo.order,
      render: (fiscalYear: number) => {
        if (!fiscalYear) return "-";
        const endYear = (fiscalYear + 1).toString().slice(-2);
        return `${fiscalYear}/${endYear}`;
      },
    },
    completion: {
      title: "Completion",
      key: "completion",
      width: columnWidths["completion"] || 160,
      onHeaderCell: () => ({
        width: columnWidths["completion"] || 160,
        onResize: handleResize("completion"),
        columnKey: "completion",
      }),
      sorter: (a: any, b: any) =>
        getProjectCompletionData(a).percent - getProjectCompletionData(b).percent,
      sortOrder: sortedInfo.columnKey === "completion" && sortedInfo.order,
      render: (_: any, record: any) => {
        const { total, completed, percent } = getProjectCompletionData(record);
        if (total === 0) {
          return (
            <Tooltip title="No tasks created for this project yet">
              <Tag color="default" style={{ color: "#888" }}>
                No Tasks (0/0)
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={`${completed} of ${total} main tasks completed`}>
            <div style={{ minWidth: 120 }}>
              <Progress
                percent={percent}
                size="small"
                status={percent === 100 ? "success" : "active"}
                strokeColor={percent === 100 ? "#52c41a" : "#1890ff"}
              />
              <div style={{ fontSize: "11px", color: "#888", textAlign: "right" }}>
                {completed}/{total} tasks
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    description: {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: columnWidths["description"] || 220,
      onHeaderCell: () => ({
        width: columnWidths["description"] || 220,
        onResize: handleResize("description"),
        columnKey: "description",
      }),
      render: (text: string) => {
        if (!text) return "-";
        const short = text.length > 35 ? text.slice(0, 35) + "..." : text;
        return (
          <Tooltip title={text}>
            <span>{short}</span>
          </Tooltip>
        );
      },
    },
    isPaymentDone: {
      title: "Payment Status",
      dataIndex: "isPaymentDone",
      key: "isPaymentDone",
      width: columnWidths["isPaymentDone"] || 130,
      onHeaderCell: () => ({
        width: columnWidths["isPaymentDone"] || 130,
        onResize: handleResize("isPaymentDone"),
        columnKey: "isPaymentDone",
      }),
      render: (isPaid: boolean) =>
        isPaid ? <Tag color="success">Paid</Tag> : <Tag color="warning">Unpaid</Tag>,
    },
    countsForAvailability: {
      title: "Counts Availability",
      dataIndex: "countsForAvailability",
      key: "countsForAvailability",
      width: columnWidths["countsForAvailability"] || 140,
      onHeaderCell: () => ({
        width: columnWidths["countsForAvailability"] || 140,
        onResize: handleResize("countsForAvailability"),
        columnKey: "countsForAvailability",
      }),
      render: (val: boolean) =>
        val ? <Tag color="cyan">Yes</Tag> : <Tag color="default">No</Tag>,
    },
    allowSubtaskWorklog: {
      title: "Subtask Worklog",
      dataIndex: "allowSubtaskWorklog",
      key: "allowSubtaskWorklog",
      width: columnWidths["allowSubtaskWorklog"] || 130,
      onHeaderCell: () => ({
        width: columnWidths["allowSubtaskWorklog"] || 130,
        onResize: handleResize("allowSubtaskWorklog"),
        columnKey: "allowSubtaskWorklog",
      }),
      render: (val: boolean) =>
        val ? <Tag color="blue">Yes</Tag> : <Tag color="default">No</Tag>,
    },
    users: {
      title: "Team Members",
      key: "users",
      width: columnWidths["users"] || 150,
      onHeaderCell: () => ({
        width: columnWidths["users"] || 150,
        onResize: handleResize("users"),
        columnKey: "users",
      }),
      render: (_: any, record: any) => {
        const memberCount = record.users?.length || 0;
        return (
          <Space size={6} align="center">
            <Tag icon={<TeamOutlined />} color="blue">
              {memberCount} Member{memberCount === 1 ? "" : "s"}
            </Tag>
            <Tooltip title="View Team Member Progress & Budget">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: "#1890ff", fontSize: "16px" }} />}
                onClick={() => handleOpenMemberModal(record, "all")}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    activeUsers: {
      title: "Active Members",
      key: "activeUsers",
      width: columnWidths["activeUsers"] || 150,
      onHeaderCell: () => ({
        width: columnWidths["activeUsers"] || 150,
        onResize: handleResize("activeUsers"),
        columnKey: "activeUsers",
      }),
      render: (_: any, record: any) => {
        const activeList = record.activeUsers || [];
        const count = activeList.length;
        return (
          <Space size={6} align="center">
            <Tag icon={<UserOutlined />} color="green">
              {count} Active
            </Tag>
            <Tooltip title="View Active Member Details & Budget">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: "#52c41a", fontSize: "16px" }} />}
                onClick={() => handleOpenMemberModal(record, "active")}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    action: {
      title: "Action",
      key: "action",
      fixed: "right",
      width: columnWidths["action"] || 90,
      onHeaderCell: () => ({
        width: columnWidths["action"] || 90,
        onResize: handleResize("action"),
        columnKey: "action",
      }),
      hidden: checkPermissionForComponent(
        permissions,
        "projects",
        "patch",
        "/projects/:id"
      )
        ? false
        : true,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => showModal(record)}
        />
      ),
    },
  };

  // Filter & order dynamic columns based on visibleColumnKeys (ALWAYS placing Action at the very end!)
  const columns = useMemo(() => {
    const filteredKeys = visibleColumnKeys.filter((k) => k !== "action");
    const activeCols = filteredKeys
      .map((key) => allColumnsMap[key])
      .filter((col) => col && !col.hidden);

    if (allColumnsMap["action"] && !allColumnsMap["action"].hidden) {
      activeCols.push(allColumnsMap["action"]);
    }
    return activeCols;
  }, [visibleColumnKeys, columnWidths, sortedInfo, searchedColumn, searchText]);

  const paginationOptions = {
    current: page,
    pageSize: limit,
    total: filteredProject?.length,
    showSizeChanger: true,
    showQuickJumper: true,
    hideOnSinglePage: false,
    pageSizeOptions: [5, 10, 20, 30, 50, 100],
    showTotal: (total: number, range: number[]) =>
      `${range[0]}-${range[1]} of ${total}`,
  };

  const rowSelection: TableProps<ProjectType>["rowSelection"] = {
    type: "checkbox",
    selectedRowKeys: selectedProjects.map((p) => p.id),
    onChange: (_selectedRowKeys: React.Key[], selectedRows: ProjectType[]) => {
      setSelectedProjects(selectedRows);
    },
    getCheckboxProps: (record: ProjectType) => ({
      name: record.name,
    }),
  };

  // Calculate detailed stats per member for the member detail modal
  const memberModalStats = useMemo(() => {
    if (!activeProjectForMemberModal) return [];

    const projectUsers: UserType[] =
      memberModalType === "active"
        ? activeProjectForMemberModal.activeUsers || []
        : activeProjectForMemberModal.users || [];
    const tasks: TaskType[] = activeProjectForMemberModal.tasks || [];

    return projectUsers.map((user) => {
      const userId = user.id?.toString();

      const memberTasks = tasks.filter((task) => {
        if (!task.assignees || !Array.isArray(task.assignees)) return false;
        return task.assignees.some((a: any) => a.id?.toString() === userId);
      });

      const totalAssignedTasks = memberTasks.length;
      const completedTasks = memberTasks.filter(
        (t) =>
          t.status === "done" ||
          (t.status as any) === "first_verified" ||
          (t.status as any) === "second_verified"
      ).length;

      const completionPercent =
        totalAssignedTasks > 0 ? Math.round((completedTasks / totalAssignedTasks) * 100) : 0;

      const totalBudgetedHours = memberTasks.reduce(
        (acc, t) => acc + (t.budgetedHours || 0),
        0
      );

      return {
        user,
        totalAssignedTasks,
        completedTasks,
        completionPercent,
        totalBudgetedHours,
      };
    });
  }, [activeProjectForMemberModal, memberModalType]);

  return (
    <>
      <Card bodyStyle={{ padding: 12 }}>
        <Table
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
          loading={isPending}
          pagination={paginationOptions}
          rowSelection={rowSelection}
          showSorterTooltip={true}
          dataSource={filteredProject}
          columns={columns}
          onChange={handleTableChange}
          rowKey={"id"}
          size="small"
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Member Details Breakdown Modal */}
      <Modal
        title={
          <Space>
            {memberModalType === "active" ? (
              <UserOutlined style={{ color: "#52c41a" }} />
            ) : (
              <TeamOutlined style={{ color: "#1890ff" }} />
            )}
            <span>
              {memberModalType === "active" ? "Active Members" : "Team Members"} & Progress -{" "}
              {activeProjectForMemberModal?.name || "Project"}
            </span>
          </Space>
        }
        open={memberModalOpen}
        onCancel={() => {
          setMemberModalOpen(false);
          setActiveProjectForMemberModal(null);
        }}
        footer={[
          <Button key="close" type="primary" onClick={() => setMemberModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={750}
        bodyStyle={{ paddingTop: 16 }}
      >
        {loadingMemberDetail ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: "#666" }}>
              Loading member project task budget and progress...
            </div>
          </div>
        ) : (
          <div>
            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <Card
                  size="small"
                  className={memberModalType === "active" ? "bg-emerald-50/50" : "bg-blue-50/50"}
                >
                  <Statistic
                    title={
                      memberModalType === "active"
                        ? "Total Active Members"
                        : "Total Assigned Members"
                    }
                    value={
                      memberModalType === "active"
                        ? activeProjectForMemberModal?.activeUsers?.length || 0
                        : activeProjectForMemberModal?.users?.length || 0
                    }
                    prefix={
                      memberModalType === "active" ? (
                        <UserOutlined style={{ color: "#52c41a" }} />
                      ) : (
                        <TeamOutlined />
                      )
                    }
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="bg-emerald-50/50">
                  <Statistic
                    title="Total Project Tasks"
                    value={activeProjectForMemberModal?.tasks?.length || 0}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="bg-indigo-50/50">
                  <Statistic
                    title="Total Budgeted Hours"
                    value={
                      activeProjectForMemberModal?.tasks?.reduce(
                        (sum: number, t: any) => sum + (t.budgetedHours || 0),
                        0
                      ) || 0
                    }
                    precision={1}
                    prefix={<ClockCircleOutlined />}
                    suffix="hrs"
                  />
                </Card>
              </Col>
            </Row>

            <Table
              dataSource={memberModalStats}
              rowKey={(record) => record.user.id?.toString() || Math.random().toString()}
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Team Member",
                  key: "user",
                  render: (_: any, record: any) => (
                    <Space>
                      <Avatar
                        size="small"
                        className="bg-blue-600"
                        src={
                          record.user?.avatar
                            ? `${import.meta.env.VITE_BACKEND_URI}/document/${record.user?.avatar}`
                            : undefined
                        }
                      >
                        {record.user?.name?.[0]}
                      </Avatar>
                      <div>
                        <div className="font-medium">{record.user?.name}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>
                          {record.user?.role?.name || "Member"}
                        </div>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: "Tasks",
                  key: "tasks",
                  align: "center",
                  render: (_: any, record: any) => (
                    <Tag color="blue">
                      {record.completedTasks} / {record.totalAssignedTasks}
                    </Tag>
                  ),
                },
                {
                  title: "Task Budget",
                  key: "budget",
                  align: "center",
                  render: (_: any, record: any) => (
                    <span className="font-medium text-slate-700">
                      {record.totalBudgetedHours.toFixed(1)} hrs
                    </span>
                  ),
                },
                {
                  title: "Completion",
                  key: "completion",
                  width: 180,
                  render: (_: any, record: any) => (
                    <Progress
                      percent={record.completionPercent}
                      size="small"
                      status={record.completionPercent === 100 ? "success" : "active"}
                      strokeColor={record.completionPercent === 100 ? "#52c41a" : "#1890ff"}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProjectTable;
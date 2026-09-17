import { useEditWorklog } from "@/hooks/worklog/useEditWorklog";
import { Button, Card, Table, Popconfirm, Input, Space, DatePicker, Select, Modal, Form, Tooltip, Tag, message } from "antd";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import TableToolbar from "../Table/TableToolbar";
import { useDeleteWorklog } from "@/hooks/worklog/useDeleteWorklog";
import { useState, useRef, useEffect, useMemo, type Key } from "react";
import { SearchOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, FilterOutlined, ClearOutlined, QuestionCircleOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { useAllWorklog, WorklogFilters } from "@/hooks/worklog/useAllWorklog";
import { useUser } from "@/hooks/user/useUser";
import { useProject } from "@/hooks/project/useProject";
import { getProfile } from "@/service/auth.service";
import { useActiveWorkhour } from "@/hooks/workhour/useActiveWorkhour";
import { useSession } from "@/context/SessionContext";
import { useBulkApproveWorklogs } from "@/hooks/worklog/useBulkApproveWorklogs";
import { useBulkRejectWorklogs } from "@/hooks/worklog/useBulkRejectWorklogs";
import { getWorklogType, getWorklogTypeColor, getWorklogTypeDescription, WorklogStatus } from "@/utils/worklogUtils";
import ResponsiveTable from "@/components/ui/MobileCardList";
import { useIsMobile } from "@/hooks/useIsMobile";

const { TextArea } = Input;

const AdminWorklogTable = ({ headerControls }: { headerControls?: React.ReactNode }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile } = useSession();
  const [filters, setFilters] = useState<WorklogFilters>({});
  const { data: worklogs, isPending, refetch } = useAllWorklog(filters);
  const { mutate: editWorklog, isPending: isEditPending } = useEditWorklog();
  const { mutate: deleteWorklog } = useDeleteWorklog();
  const { mutateAsync: bulkApproveWorklogs, isPending: isBulkApprovePending } = useBulkApproveWorklogs();
  const { mutateAsync: bulkRejectWorklogs, isPending: isBulkRejectPending } = useBulkRejectWorklogs();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [rejectedRemark, setRejectedRemark] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [isBulkRejectModalVisible, setIsBulkRejectModalVisible] = useState(false);
  const [bulkRejectedRemark, setBulkRejectedRemark] = useState("");
  const [worklogTypeFilter, setWorklogTypeFilter] = useState<string | undefined>(undefined);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  const toggleExpandCard = (id: string | number) => {
    const strId = String(id);
    setExpandedCardIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };
  
  // For search functionality
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<any>(null);
  
  // For sorting
  const [sortedInfo, setSortedInfo] = useState<any>({});

  const profilePermissions = (profile as any)?.role?.permission;
  const canBulkApproveWorklogs = Array.isArray(profilePermissions) && profilePermissions.some(
    (perm: any) => perm.path === '/worklogs/bulk-approve' && perm.method?.toLowerCase?.() === 'patch'
  );
  const canBulkRejectWorklogs = Array.isArray(profilePermissions) && profilePermissions.some(
    (perm: any) => perm.path === '/worklogs/bulk-reject' && perm.method?.toLowerCase?.() === 'patch'
  );
  
  // For user and project filter dropdowns using proper hooks
  const { data: userData } = useUser({ status: "active", limit: 100, page: 1, keywords: "" });
  const { data: projectData } = useProject({ status: "active" });
  
  // Extract users and projects from the response
  const users = userData?.results || [];
  const projects = projectData || [];
  
  // Fetch active workhour for the current user's role
  const { data: activeWorkhour } = useActiveWorkhour(
    (profile as any)?.roleId || (profile as any)?.role?.id
  );
  
  // Filter worklogs by worklog type
  const filteredWorklogs = useMemo(() => {
    if (!worklogs) return [];
    
    if (!worklogTypeFilter) return worklogs;
    
    return worklogs.filter((worklog: any) => {
      const worklogType = getWorklogType(worklog, activeWorkhour);
      return worklogType === worklogTypeFilter;
    });
  }, [worklogs, worklogTypeFilter, activeWorkhour]);

  const hasRequestedRows = useMemo(
    () => (filteredWorklogs || []).some((record: any) => record?.status === "requested"),
    [filteredWorklogs]
  );

  useEffect(() => {
    setSelectedRowKeys((prev) =>
      prev.filter((key) =>
        (filteredWorklogs || []).some(
          (record: any) => String(record?.id) === String(key) && record?.status === "requested"
        )
      )
    );
  }, [filteredWorklogs]);
  
  const toggleDescription = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const customExpandIcon = ({ expanded, onExpand, record }: any) => {
    return (
      <span
        onClick={e => {
          toggleDescription(record.id);
          onExpand(record, e);
        }}
        style={{ cursor: "pointer", marginRight: 2, fontSize: '9px' }}
      >
        {expanded ? "−" : "+"}
      </span>
    );
  };
  
  const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  
  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };
  
  // Helper function to get value from nested path
  const getValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper function to get unique values for autocomplete
  const getUniqueValues = (dataIndex: string, inputValue: string = '') => {
    if (!worklogs) return [];
    
    const values = new Set<string>();
    worklogs.forEach((record: any) => {
      const value = getValue(record, dataIndex);
      if (value) {
        const strValue = value.toString();
        if (strValue.toLowerCase().includes(inputValue.toLowerCase())) {
          values.add(strValue);
        }
      }
    });
    
    return Array.from(values).slice(0, 10);
  };
  
  const getColumnSearchProps = (dataIndex: string, title: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
      const inputValue = selectedKeys[0] || '';
      const suggestions = getUniqueValues(dataIndex, inputValue);
      
      return (
        <div style={{ padding: 8 }}>
          <Input
            ref={searchInput}
            placeholder={`Search ${title}`}
            value={inputValue}
            onChange={e => {
              const value = e.target.value;
              setSelectedKeys(value ? [value] : []);
            }}
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ marginBottom: 8, display: 'block' }}
          />
          {inputValue && suggestions.length > 0 && (
            <div style={{ 
              maxHeight: 200, 
              overflowY: 'auto', 
              marginBottom: 8,
              border: '1px solid #d9d9d9',
              borderRadius: 4
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    padding: '4px 8px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                  onClick={() => {
                    setSelectedKeys([suggestion]);
                    handleSearch([suggestion], confirm, dataIndex);
                  }}
                >
                  {suggestion}
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
                setSearchText('');
                setSearchedColumn('');
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
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: any) => {
      const recordValue = getValue(record, dataIndex);
      return recordValue
        ? recordValue.toString().toLowerCase().includes(value.toLowerCase())
        : false;
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const expandedRowRender = (record: any) => {
    const description = record?.description || "No description available";
    return (
      <div
        className="p-2 bg-gray-50 text-xs"
        style={{ fontSize: '10px' }}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  };

  const showRejectModal = (id: string) => {
    setCurrentRecordId(id);
    setRejectedRemark("");
    setIsModalVisible(true);
  };

  const handleReject = () => {
    if (currentRecordId && profile) {
      editWorklog({ 
        id: currentRecordId, 
        status: "rejected",
        rejectedRemark: rejectedRemark,
        rejectBy: (profile as any).id
      }, { onSuccess: refetch });
    }
    setIsModalVisible(false);
    setCurrentRecordId(null);
    setRejectedRemark("");
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentRecordId(null);
    setRejectedRemark("");
  };

  const handleBulkApprove = async () => {
    const ids = selectedRowKeys.map((key) => String(key));
    if (!ids.length) {
      message.warning("Select at least one requested worklog to approve.");
      return;
    }

    try {
      await bulkApproveWorklogs({ worklogIds: ids });
      message.success("Selected worklogs approved successfully.");
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to approve selected worklogs.");
    }
  };

  const showBulkRejectModal = () => {
    if (!selectedRowKeys.length) {
      message.warning("Select at least one requested worklog to reject.");
      return;
    }
    setBulkRejectedRemark("");
    setIsBulkRejectModalVisible(true);
  };

  const handleBulkReject = async () => {
    const ids = selectedRowKeys.map((key) => String(key));
    if (!ids.length) {
      setIsBulkRejectModalVisible(false);
      return;
    }

    try {
      await bulkRejectWorklogs({ worklogIds: ids, rejectedRemark: bulkRejectedRemark });
      message.success("Selected worklogs rejected successfully.");
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to reject selected worklogs.");
    }

    setIsBulkRejectModalVisible(false);
    setBulkRejectedRemark("");
  };

  const handleBulkRejectCancel = () => {
    setIsBulkRejectModalVisible(false);
    setBulkRejectedRemark("");
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<WorklogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setWorklogTypeFilter(undefined);
  };

  const rowSelection = !isMobile && hasRequestedRows && (canBulkApproveWorklogs || canBulkRejectWorklogs)
    ? {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: Key[]) => setSelectedRowKeys(newSelectedRowKeys),
        getCheckboxProps: (record: any) => ({
          disabled: record?.status !== "requested",
        }),
      }
    : undefined;

  // Dynamically determine which columns to show based on worklog status
  // This function returns a different set of columns depending on the worklogs in the table:
  // - Base columns are always shown (Date, User, Project, Task, Duration, Status, Request To, Action)
  // - "Approved By" column is shown only if at least one worklog has "approved" status
  // - "Rejected By" column is shown only if at least one worklog has "rejected" status
  const getColumns = () => {
    const baseColumns = [
      {
        title: "Date",
        dataIndex: "startTime",
        key: "date",
        width: 75,
        ...getColumnSearchProps('startTime', 'Date'),
        sorter: (a: any, b: any) => moment(a.startTime).unix() - moment(b.startTime).unix(),
        sortOrder: sortedInfo.columnKey === 'date' && sortedInfo.order,
        render: (_: any, record: any) => {
          return new Date(record?.startTime).toLocaleDateString(undefined, {year: '2-digit', month: '2-digit', day: '2-digit'});
        }
      },
      {
        title: "User",
        dataIndex: "user",
        key: "user",
        width: 90,
        ...getColumnSearchProps('user.name', 'User'),
        sorter: (a: any, b: any) => (a.user?.name || '').localeCompare(b.user?.name || ''),
        sortOrder: sortedInfo.columnKey === 'user' && sortedInfo.order,
        render: (_: any, record: any) => {
          return <Link to={`/profile/${record?.user?.id}`} className="text-blue-600">{record?.user?.name}</Link>
        }
      },
      {
        title: "Project",
        dataIndex: "project",
        key: "project",
        width: 90,
        ...getColumnSearchProps('task.project.name', 'Project'),
        sorter: (a: any, b: any) => (a.task?.project?.name || '').localeCompare(b.task?.project?.name || ''),
        sortOrder: sortedInfo.columnKey === 'project' && sortedInfo.order,
        render: (_: any, record: any) => {
          return <Link to={`/projects/${record?.task?.project?.id}`} className="text-blue-600">{record?.task?.project?.name}</Link>
        }
      },
      {
        title: "Task",
        dataIndex: "task",
        key: "task",
        width: 90,
        ...getColumnSearchProps('task.name', 'Task'),
        sorter: (a: any, b: any) => (a.task?.name || '').localeCompare(b.task?.name || ''),
        sortOrder: sortedInfo.columnKey === 'task' && sortedInfo.order,
        render: (_: any, record: any) => {
          const tooltipContent = (
            <div
              className="p-2 text-xs"
              style={{ fontSize: '12px', maxWidth: '400px', maxHeight: '300px', overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: record?.description || "No description available" }}
            />
          );
          return (
            <Tooltip title={tooltipContent} overlayInnerStyle={{ padding: 0 }} mouseEnterDelay={0.5}>
              <Link to={`/projects/${record?.task?.project?.id}/tasks/${record?.task?.id}`} className="text-blue-600">
                {record?.task?.name || 'View Task'}
              </Link>
            </Tooltip>
          );
        }
      },
      {
        title: "Duration",
        dataIndex: "duration",
        key: "duration",
        width: 90,
        sorter: (a: any, b: any) => moment.duration(moment(a.endTime).diff(moment(a.startTime))).asMinutes() - 
                                   moment.duration(moment(b.endTime).diff(moment(b.startTime))).asMinutes(),
        sortOrder: sortedInfo.columnKey === 'duration' && sortedInfo.order,
        render: (_: any, record: any) => {
          // Determine worklog type and get color
          const worklogType = getWorklogType(record, activeWorkhour);
          const color = getWorklogTypeColor(worklogType);
          const typeDesc = getWorklogTypeDescription(worklogType);
          
          return (
            <Tooltip title={typeDesc}>
              <div className="text-xs" style={{ lineHeight: 1, fontSize: '10px', color: color, fontWeight: worklogType !== WorklogStatus.NORMAL ? 'bold' : 'normal' }}>
                <div>{moment(record?.startTime).format("H:mm") + "-" + moment(record?.endTime).format("H:mm")}</div>
                <small style={{ fontSize: '9px' }}>{`(${moment.duration(moment(record?.endTime).diff(moment(record?.startTime))).asMinutes()}m)`}</small>
              </div>
            </Tooltip>
          );
        }
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 75,
        ...getColumnSearchProps('status', 'Status'),
        sorter: (a: any, b: any) => (a.status || '').localeCompare(b.status || ''),
        sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order,
        render: (_: any, record: any) => {
          const statusColors: any = {
            requested: "orange",
            approved: "green",
            rejected: "red",
            open: "blue",
            pending: "gold"
          };
          return (
            <span style={{ color: statusColors[record.status] || 'black', fontWeight: 'bold' }}>
              {record.status?.toUpperCase()}
            </span>
          );
        }
      },

      {
        title: "Request To",
        dataIndex: "requestTo",
        key: "requestTo",
        width: 80,
        render: (_: any, record: any) => {
          if (record.requestTo) {
            const requestToName = record.requestToUser?.name || record.requestTo;
            return (
              <Tooltip 
                title={
                  <div style={{ fontSize: '10px' }}>
                    <p><strong>Requested At:</strong> {record.requestedAt ? moment(record.requestedAt).format("YY-MM-DD HH:mm") : "Unknown"}</p>
                  </div>
                }
              >
                <span className="text-blue-600">{requestToName}</span>
              </Tooltip>
            );
          }
          return "-";
        }
      },
      {
        title: "Action",
        dataIndex: "action",
        key: "action",
        width: 115,
        fixed: 'right',
        render: (_: any, record: any) => {
          return (
            <div className="flex-nowrap" style={{ width: '115px', overflow: 'visible' }}>
              <Tooltip title="Edit">
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/worklogs/edit/${record?.id}`)}
                  style={{ padding: '0 2px', height: '20px', minWidth: '20px', marginRight: '2px' }}
                  className="action-btn"
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Popconfirm
                  title={<span style={{ fontSize: '10px' }}>Delete this worklog?</span>}
                  onConfirm={() => {
                    deleteWorklog({ id: record?.id }, { onSuccess: refetch });
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} style={{ padding: '0 2px', height: '20px', minWidth: '20px', marginRight: '2px' }} className="action-btn" />
                </Popconfirm>
              </Tooltip>
              {record.status === "requested" && (
                <>
                  <Tooltip title="Approve">
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => {
                        if (profile) {
                          editWorklog({ 
                            id: record?.id, 
                            status: "approved",
                            approvedBy: (profile as any).id 
                          }, { onSuccess: refetch });
                        }
                      }}
                      style={{ padding: '0 2px', height: '20px', minWidth: '20px', marginRight: '2px' }}
                      className="action-btn"
                    />
                  </Tooltip>
                  <Tooltip title="Reject">
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => showRejectModal(record?.id)}
                      style={{ padding: '0 2px', height: '20px', minWidth: '20px' }}
                      className="action-btn"
                    />
                  </Tooltip>
                </>
              )}
            </div>
          );
        }
      }
    ];

    // Conditionally add Approved By column
    if (worklogs?.some((record: any) => record.status === "approved")) {
      baseColumns.splice(7, 0, {
        title: "Approved By",
        dataIndex: "approvedBy",
        key: "approvedBy",
        width: 80,
        render: (_: any, record: any) => {
          if (record.status === "approved" && record.approvedBy) {
            const approverName = record.approvedByUser?.name || record.approvedBy;
            return (
              <Tooltip 
                title={
                  <div style={{ fontSize: '10px' }}>
                    <p><strong>Approved At:</strong> {record.approvedAt ? moment(record.approvedAt).format("YY-MM-DD HH:mm") : "Unknown"}</p>
                  </div>
                }
              >
                <span className="text-green-600">{approverName}</span>
              </Tooltip>
            );
          }
          return "-";
        }
      });
    }

    // Conditionally add Rejected By column
    if (worklogs?.some((record: any) => record.status === "rejected")) {
      baseColumns.splice(baseColumns.length - 1, 0, {
        title: "Rejected By",
        dataIndex: "rejectBy",
        key: "rejectBy",
        width: 80,
        render: (_: any, record: any) => {
          if (record.status === "rejected" && record.rejectBy) {
            const rejectorName = record.rejectByUser?.name || record.rejectBy;
            return (
              <Tooltip 
                title={
                  <div style={{ fontSize: '10px' }}>
                    <p><strong>Rejection Remark:</strong> {record.rejectedRemark || "No remark provided"}</p>
                    <p><strong>Rejected At:</strong> {record.rejectedAt ? moment(record.rejectedAt).format("YY-MM-DD HH:mm") : "Unknown"}</p>
                  </div>
                }
              >
                <span className="text-red-600">{rejectorName}</span>
              </Tooltip>
            );
          }
          return "-";
        }
      });
    }

    return baseColumns;
  };

  const renderAdminWorklogCard = (record: any) => {
    const isExpanded = expandedCardIds.includes(String(record.id));
    const dateStr = record?.startTime ? moment(record.startTime).format("YYYY-MM-DD") : "-";
    const userName = record?.user?.name || "-";
    const projectName = record?.task?.project?.name || "-";
    const taskName = record?.task?.name || "-";
    const duration = record?.time || "-";
    const status = record?.status || "requested";
    const worklogType = getWorklogType(record, activeWorkhour);

    return (
      <div className="flex flex-col gap-2">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-sm truncate">{userName}</div>
            <div className="text-xs text-gray-500 truncate">{projectName} &bull; {taskName}</div>
          </div>

          {/* Action Icons: Edit, Approve/Reject, Toggle Details */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/worklogs/edit/${record.id}`);
              }}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
              title="Edit Worklog"
              aria-label="Edit Worklog"
            />
            {status === "requested" && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined style={{ fontSize: "16px", color: "#52c41a" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    editWorklog({ id: record.id, status: "approved" });
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-green-50 text-green-600"
                  title="Approve"
                  aria-label="Approve"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseOutlined style={{ fontSize: "16px", color: "#ff4d4f" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    showRejectModal(record.id);
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-red-50 text-red-600"
                  title="Reject"
                  aria-label="Reject"
                />
              </>
            )}
            <Button
              type="text"
              size="small"
              icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandCard(record.id);
              }}
              className="text-gray-500 hover:text-blue-600 flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
              title="Toggle Details"
              aria-label="Toggle Details"
            />
          </div>
        </div>

        {/* Revealed Detail Card (when dropdown button clicked) */}
        {isExpanded && (
          <div className="mt-2 pt-2.5 border-t border-dashed border-gray-200 flex flex-col gap-2 bg-gray-50/80 rounded-lg p-3 text-xs text-gray-600">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Date:</span>
              <span className="font-semibold text-gray-800 text-right">{dateStr}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Duration:</span>
              <span className="font-semibold text-gray-800 text-right">{duration} hrs</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Type:</span>
              <Tag color={getWorklogTypeColor(worklogType)} className="m-0 text-[10px]">
                {worklogType.toUpperCase()}
              </Tag>
            </div>
            {record?.reason && (
              <div className="pt-1.5 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium block mb-1">Reason / Notes:</span>
                <div className="text-gray-700 bg-white p-2 rounded border border-gray-100 break-words">
                  {record.reason}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="text-xs" style={{ padding: '0' }} bodyStyle={{ padding: '8px' }}>
      <style>
        {`
          /* Scoped styles for admin worklog table only */
          .admin-worklog-table .ant-table-cell {
            padding: 2px 4px !important;
            line-height: 1 !important;
            font-size: 10px !important;
          }
          .admin-worklog-table .compact-row td {
            padding: 0px 4px !important;
            line-height: 1 !important;
            font-size: 10px !important;
          }
          .admin-worklog-table .ant-table-cell a {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            font-size: 10px;
          }
          .admin-worklog-table .ant-table-thead > tr > th {
            padding: 3px 4px !important;
            font-size: 10px !important;
          }
          .admin-worklog-table .ant-table-column-title {
            font-size: 10px !important;
          }
          .admin-worklog-table .ant-select-item {
            font-size: 10px !important;
            padding: 2px 8px !important;
          }
          .admin-worklog-table .ant-select-dropdown {
            font-size: 10px !important;
          }
          .admin-worklog-table .ant-form-item-label > label {
            font-size: 10px !important;
            height: 16px !important;
          }
          .admin-worklog-table .ant-form-item {
            margin-bottom: 2px !important;
          }
          .admin-worklog-table .ant-btn-sm {
            font-size: 10px !important;
          }
          .admin-worklog-table .ant-table-pagination.ant-pagination {
            margin: 8px 0 !important;
          }
          .admin-worklog-table .table-container {
            overflow-x: auto;
            width: 100%;
          }
          /* Force action buttons to stay on a single line */
          .admin-worklog-table .flex-nowrap {
            display: inline-flex !important;
            flex-wrap: nowrap !important;
            white-space: nowrap !important;
          }
          .admin-worklog-table .action-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 20px !important;
            max-width: 26px !important;
            overflow: hidden !important;
          }
          /* Make sure the action column doesn't wrap */
          .admin-worklog-table .ant-table-cell:last-child {
            white-space: nowrap !important;
            overflow: visible !important;
          }
          /* Style for legend tags */
          .admin-worklog-table .legend-tag {
            padding: 0 4px !important;
            margin-right: 4px !important;
          }
          /* Colored row styles */
          .admin-worklog-table .row-normal td {
            background-color: rgba(24, 144, 255, 0.2) !important;
            border-color: rgba(24, 144, 255, 0.3) !important;
          }
          .admin-worklog-table .row-early td {
            background-color: rgba(82, 196, 26, 0.2) !important;
            border-color: rgba(82, 196, 26, 0.3) !important;
          }
          .admin-worklog-table .row-late td {
            background-color: rgba(250, 173, 20, 0.2) !important;
            border-color: rgba(250, 173, 20, 0.3) !important;
          }
          .admin-worklog-table .row-late-approved td {
            background-color: rgba(114, 46, 209, 0.2) !important;
            border-color: rgba(114, 46, 209, 0.3) !important;
          }
          .admin-worklog-table .row-late-unapproved td {
            background-color: rgba(245, 34, 45, 0.2) !important;
            border-color: rgba(245, 34, 45, 0.3) !important;
          }
          .admin-worklog-table .row-rejected-approved td {
            background-color: rgba(235, 47, 150, 0.2) !important;
            border-color: rgba(235, 47, 150, 0.3) !important;
          }
          /* Override the hover effect */
          .admin-worklog-table .ant-table-tbody > tr.ant-table-row:hover > td {
            background: inherit !important;
            filter: brightness(0.9) !important;
          }
        `}
      </style>
      
      {/* Worklog type legend and header controls */}
      <div className="admin-worklog-table" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
          <Tag className="legend-tag" color={getWorklogTypeColor(WorklogStatus.NORMAL)}>NORMAL</Tag>
          <Tag className="legend-tag" color={getWorklogTypeColor(WorklogStatus.EARLY)}>EARLY</Tag>
          <Tag className="legend-tag" color={getWorklogTypeColor(WorklogStatus.LATE)}>LATE</Tag>
          <Tag className="legend-tag" color={getWorklogTypeColor(WorklogStatus.LATE_APPROVED)}>LATE APPROVED</Tag>
          <Tag className="legend-tag" color={getWorklogTypeColor(WorklogStatus.LATE_UNAPPROVED)}>LATE UNAPPROVED</Tag>
          <Tag className="legend-tag" color={getWorklogTypeColor(WorklogStatus.REJECTED_THEN_APPROVED)}>REJECTED THEN APPROVED</Tag>
          <Tooltip title={
            <div>
              <p><strong>Normal:</strong> Regular worklog within work hours</p>
              <p><strong>Early:</strong> Worklog that starts before set work hours</p>
              <p><strong>Late:</strong> Worklog that starts after set work hours</p>
              <p><strong>Late Approved:</strong> Worklog approved more than 12 hours after request</p>
              <p><strong>Late Unapproved:</strong> Worklog requested but waiting for approval for more than 12 hours</p>
              <p><strong>Rejected Then Approved:</strong> Worklog that was rejected and then approved</p>
            </div>
          }>
            <QuestionCircleOutlined style={{ cursor: 'pointer', marginLeft: '4px' }} />
          </Tooltip>
        </div>
        
        <div className="flex items-center">
          {headerControls}
        </div>
      </div>
      
      <Form layout="vertical" className="mb-1 text-xs admin-worklog-table">
        <div className="flex flex-wrap items-center justify-between gap-1 w-full">
          <div className="flex flex-wrap items-center gap-1">
            <div style={{ width: '120px' }}>
              <Form.Item style={{ marginBottom: '2px' }}>
                <Select
                  placeholder="Status"
                  allowClear
                  size="small"
                  style={{ width: '100%' }}
                  value={filters.status}
                  onChange={(value) => handleFilterChange({ status: value })}
                  dropdownStyle={{ minWidth: '110px' }}
                >
                  <Select.Option value="requested">Requested</Select.Option>
                  <Select.Option value="approved">Approved</Select.Option>
                  <Select.Option value="rejected">Rejected</Select.Option>
                </Select>
              </Form.Item>
            </div>
            
            <div style={{ width: '120px' }}>
              <Form.Item style={{ marginBottom: '2px' }}>
                <DatePicker 
                  placeholder="Select Date"
                  style={{ width: '100%' }}
                  size="small"
                  value={filters.date ? moment(filters.date) : null}
                  onChange={(date) => handleFilterChange({ date: date ? date.format('YYYY-MM-DD') : undefined })}
                  allowClear
                  inputReadOnly
                />
              </Form.Item>
            </div>
            
            <div style={{ width: '120px' }}>
              <Form.Item style={{ marginBottom: '2px' }}>
                <Select
                  placeholder="User"
                  allowClear
                  size="small"
                  style={{ width: '100%' }}
                  value={filters.userId}
                  onChange={(value) => handleFilterChange({ userId: value })}
                  showSearch
                  optionFilterProp="children"
                  loading={!userData}
                  dropdownStyle={{ minWidth: '110px' }}
                >
                  {users.map((user: any) => (
                    <Select.Option key={user.id} value={user.id}>{user.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <div style={{ width: '120px' }}>
              <Form.Item style={{ marginBottom: '2px' }}>
                <Select
                  placeholder="Project"
                  allowClear
                  size="small"
                  style={{ width: '100%' }}
                  value={filters.projectId}
                  onChange={(value) => handleFilterChange({ projectId: value })}
                  showSearch
                  optionFilterProp="children"
                  loading={!projectData}
                  dropdownStyle={{ minWidth: '110px' }}
                >
                  {projects.map((project: any) => (
                    <Select.Option key={project.id} value={project.id}>{project.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <div style={{ width: '150px' }}>
              <Form.Item style={{ marginBottom: '2px' }}>
                <Select
                  placeholder="Worklog Type"
                  allowClear
                  size="small"
                  style={{ width: '100%' }}
                  value={worklogTypeFilter}
                  onChange={(value) => setWorklogTypeFilter(value)}
                  dropdownStyle={{ minWidth: '110px' }}
                >
                  <Select.Option value={WorklogStatus.NORMAL}>Normal</Select.Option>
                  <Select.Option value={WorklogStatus.EARLY}>Early</Select.Option>
                  <Select.Option value={WorklogStatus.LATE}>Late</Select.Option>
                  <Select.Option value={WorklogStatus.LATE_APPROVED}>Late Approved</Select.Option>
                  <Select.Option value={WorklogStatus.LATE_UNAPPROVED}>Late Unapproved</Select.Option>
                  <Select.Option value={WorklogStatus.REJECTED_THEN_APPROVED}>Rejected Then Approved</Select.Option>
                </Select>
              </Form.Item>
            </div>
            
            <div className="flex gap-1 items-center" style={{ marginBottom: '2px' }}>
              <Tooltip title="Clear Filters">
                <Button type="default" size="small" icon={<ClearOutlined />} onClick={clearFilters} style={{ padding: '0 4px', height: '24px' }} className="action-btn" />
              </Tooltip>
              <Tooltip title="Apply Filters">
                <Button type="primary" size="small" icon={<FilterOutlined />} onClick={() => refetch()} style={{ padding: '0 4px', height: '24px' }} className="action-btn" />
              </Tooltip>
            </div>

            {!isMobile && (
              <Space size="small" style={{ marginLeft: '8px', marginBottom: '2px' }}>
                {canBulkApproveWorklogs && (
                  <Popconfirm
                    title="Approve selected worklogs?"
                    okText="Approve"
                    cancelText="Cancel"
                    onConfirm={handleBulkApprove}
                    disabled={!selectedRowKeys.length}
                  >
                    <Button
                      type="primary"
                      size="small"
                      loading={isBulkApprovePending}
                      disabled={!selectedRowKeys.length}
                      style={{ height: '24px' }}
                    >
                      Approve Selected ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
                {canBulkRejectWorklogs && (
                  <Popconfirm
                    title="Reject selected worklogs?"
                    okText="Continue"
                    cancelText="Cancel"
                    onConfirm={showBulkRejectModal}
                    disabled={!selectedRowKeys.length}
                  >
                    <Button
                      danger
                      size="small"
                      loading={isBulkRejectPending}
                      disabled={!selectedRowKeys.length}
                      style={{ height: '24px' }}
                    >
                      Reject Selected ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            )}
          </div>
        </div>
      </Form>

      <div className="table-container admin-worklog-table" style={{ overflowX: 'auto', width: '100%' }}>
        <ResponsiveTable
          tableProps={{
            loading: isPending || isEditPending,
            dataSource: filteredWorklogs || [],
            columns: getColumns() as any,
            rowSelection: rowSelection,
            size: "small",
            className: "text-xs compact-table admin-worklog-table",
            style: { 
              fontSize: '10px'
            },
            rowClassName: (record: any) => {
              const worklogType = getWorklogType(record, activeWorkhour);
              return `compact-row row-${worklogType}`;
            },
            onChange: handleTableChange,
            rowKey: "id",
            bordered: true,
            pagination: isMobile ? false : {
              showSizeChanger: true,
              showQuickJumper: true,
              defaultPageSize: 50,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total: number, range: [number, number]) => <span style={{ fontSize: '10px' }}>{`${range[0]}-${range[1]} of ${total} items`}</span>,
              size: 'small'
            },
            scroll: { x: 'max-content' },
            sticky: true,
          }}
          renderMobileCard={renderAdminWorklogCard}
        />
      </div>

      <Modal
        title={<span style={{ fontSize: '12px' }}>Reject Worklog</span>}
        visible={isModalVisible}
        onOk={handleReject}
        onCancel={handleCancel}
        okText="Reject"
        okButtonProps={{ danger: true }}
        width={300}
        bodyStyle={{ padding: '12px' }}
        wrapClassName="admin-worklog-table"
      >
        <TextArea
          rows={3}
          value={rejectedRemark}
          onChange={(e) => setRejectedRemark(e.target.value)}
          placeholder="Enter reason for rejection"
          style={{ fontSize: '10px' }}
        />
      </Modal>

      <Modal
        title={<span style={{ fontSize: '12px' }}>Reject Selected Worklogs</span>}
        visible={isBulkRejectModalVisible}
        onOk={handleBulkReject}
        onCancel={handleBulkRejectCancel}
        okText="Reject Selected"
        okButtonProps={{ danger: true }}
        confirmLoading={isBulkRejectPending}
        width={320}
        bodyStyle={{ padding: '12px' }}
        wrapClassName="admin-worklog-table"
      >
        <TextArea
          rows={3}
          value={bulkRejectedRemark}
          onChange={(e) => setBulkRejectedRemark(e.target.value)}
          placeholder="Enter reason for rejecting selected worklogs"
          style={{ fontSize: '10px' }}
        />
      </Modal>
    </Card>
  );
};

export default AdminWorklogTable;
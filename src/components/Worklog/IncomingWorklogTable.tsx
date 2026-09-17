import { useEditWorklog } from "@/hooks/worklog/useEditWorklog";
import { Tooltip, Button, Card, Modal, Input, Popconfirm, Space, Tag, message } from "antd";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import TableToolbar from "../Table/TableToolbar";
import { useDeleteWorklog } from "@/hooks/worklog/useDeleteWorklog";
import { useSession } from "@/context/SessionContext";
import { useState, useRef, useMemo, type Key } from "react";
import { useWorklogbyUser } from "@/hooks/worklog/useWorklogbyUser";
import { SearchOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { useBulkApproveWorklogs } from "@/hooks/worklog/useBulkApproveWorklogs";
import { useBulkRejectWorklogs } from "@/hooks/worklog/useBulkRejectWorklogs";
import ResponsiveTable from "@/components/ui/MobileCardList";
import { useIsMobile } from "@/hooks/useIsMobile";

const { TextArea } = Input;

const columns = (
  status: string,
  deleteWorklog: any,
  _editWorklog: any,
  navigate: any,
  getColumnSearchProps: any,
  sortedInfo: any,
  showRejectModal: (id: string) => void,
  editWorklog: any
) => {
  const getStatusTitle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "Approved By";
      case "rejected":
        return "Rejected By";
      case "requested":
        return "Requested By";
      default:
        return "Requestor";
    }
  };

  const baseColumns: any[] = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      ...getColumnSearchProps("startTime", "Date"),
      sorter: (a: any, b: any) => moment(a.startTime).unix() - moment(b.startTime).unix(),
      sortOrder: sortedInfo.columnKey === "date" && sortedInfo.order,
      render: (_: any, record: any) => {
        return new Date(record?.startTime).toLocaleDateString();
      },
    },
    {
      title: "Project Name",
      dataIndex: "project",
      key: "project",
      ...getColumnSearchProps("task.project.name", "Project"),
      sorter: (a: any, b: any) => (a.task?.project?.name || "").localeCompare(b.task?.project?.name || ""),
      sortOrder: sortedInfo.columnKey === "project" && sortedInfo.order,
      render: (_: any, record: any) => {
        return (
          <Link to={`/projects/${record?.task?.project?.id}`} className="text-blue-600">
            {record?.task?.project?.name}
          </Link>
        );
      },
    },
    {
      title: "Requested By",
      dataIndex: "requestedByUser",
      key: "requestedByUser",
      ...getColumnSearchProps("user.name", "Requested By"),
      sorter: (a: any, b: any) => (a.user?.name || "").localeCompare(b.user?.name || ""),
      sortOrder: sortedInfo.columnKey === "requestedByUser" && sortedInfo.order,
      render: (_: any, record: any) => {
        const user = record?.user || record?.createdByUser;
        return user ? (
          <Tooltip title={user.email || user.name}>
            <span>{user.name}</span>
          </Tooltip>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Task",
      dataIndex: "Task",
      key: "task",
      ...getColumnSearchProps("task.name", "Task"),
      sorter: (a: any, b: any) => (a.task?.name || "").localeCompare(b.task?.name || ""),
      sortOrder: sortedInfo.columnKey === "task" && sortedInfo.order,
      render: (_: any, record: any) => {
        return (
          <Link to={`/projects/${record?.task?.project?.id}/tasks/${record?.task?.id}`} className="text-blue-600">
            {record?.task?.name}
          </Link>
        );
      },
    },
    {
      title: "Duration",
      dataIndex: "startTime",
      key: "startTime",
      sorter: (a: any, b: any) =>
        moment.duration(moment(a.endTime).diff(moment(a.startTime))).asMinutes() -
        moment.duration(moment(b.endTime).diff(moment(b.startTime))).asMinutes(),
      sortOrder: sortedInfo.columnKey === "startTime" && sortedInfo.order,
      render: (_: any, record: any) => {
        return (
          <>
            <div>
              {moment(record?.startTime).format("hh:mm A") + " - " + moment(record?.endTime).format("hh:mm A")}
            </div>
            {` (${moment.duration(moment(record?.endTime).diff(moment(record?.startTime))).asMinutes()} minutes)`}
          </>
        );
      },
    },
    {
      title: "Requested To",
      dataIndex: "requestToUser",
      key: "requestToUser",
      ...getColumnSearchProps("requestToUser.name", "Requested To"),
      sorter: (a: any, b: any) => (a.requestToUser?.name || "").localeCompare(b.requestToUser?.name || ""),
      sortOrder: sortedInfo.columnKey === "requestToUser" && sortedInfo.order,
      render: (_: any, record: any) => {
        const user = record?.requestToUser;
        const requestedAt = record?.requestedAt ? new Date(record.requestedAt).toLocaleString() : null;
        return user ? (
          <Tooltip title={requestedAt ? <span>Requested At: {requestedAt}</span> : undefined}>
            <span>{user.name}</span>
          </Tooltip>
        ) : (
          "-"
        );
      },
    },
  ];

  if (status.toLowerCase() !== "requested") {
    baseColumns.push({
      title: getStatusTitle(status),
      dataIndex: "userId",
      key: "userId",
      ...getColumnSearchProps("user.name", "User"),
      sorter: (a: any, b: any) => (a.user?.name || "").localeCompare(b.user?.name || ""),
      sortOrder: sortedInfo.columnKey === "userId" && sortedInfo.order,
      render: (_: any, record: any) => {
        let user = null;
        let extra = null;
        if (status.toLowerCase() === "approved") {
          user = record?.approvedByUser;
          if (record?.approvedAt) {
            extra = <span>Approved At: {new Date(record.approvedAt).toLocaleString()}</span>;
          }
        } else if (status.toLowerCase() === "rejected") {
          user = record?.rejectByUser;
          const remark = record?.rejectedRemark;
          const rejectedAt = record?.rejectedAt ? new Date(record.rejectedAt).toLocaleString() : null;
          extra = (
            <span>
              {remark && (
                <>
                  <b>Remark:</b> {remark}
                  <br />
                </>
              )}
              {rejectedAt && <>Rejected At: {rejectedAt}</>}
            </span>
          );
        }
        return user ? (
          <Tooltip
            title={
              <span>
                {user.email || user.name}
                <br />
                {extra}
              </span>
            }
          >
            <span>{user.name}</span>
          </Tooltip>
        ) : (
          "-"
        );
      },
    });
  }

  baseColumns.push({
    title: "Action",
    dataIndex: "action",
    key: "action",
    width: 120,
    render: (_: any, record: any) => {
      return (
        <Space size="small" wrap>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/worklogs/edit/${record?.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this worklog?"
            onConfirm={() => deleteWorklog({ id: record?.id })}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
          {status === "requested" && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  onClick={() => editWorklog({ id: record?.id, status: "approved" })}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                  onClick={() => showRejectModal(record?.id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      );
    },
  });

  return baseColumns;
};

interface IncomingWorklogTableProps {
  status: string;
  searchQuery?: string;
}

const IncomingWorklogTable = ({ status, searchQuery }: IncomingWorklogTableProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile } = useSession();
  const currentUserId = (profile as any)?.id;
  const { data: worklogs, isPending } = useWorklogbyUser(status);
  const { mutate: editWorklog, isPending: isEditPending } = useEditWorklog();
  const { mutateAsync: bulkApproveWorklogs, isPending: isBulkApprovePending } = useBulkApproveWorklogs();
  const { mutateAsync: bulkRejectWorklogs, isPending: isBulkRejectPending } = useBulkRejectWorklogs();
  const { mutate: deleteWorklog } = useDeleteWorklog();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [currentRecordIds, setCurrentRecordIds] = useState<string[]>([]);
  const [remark, setRemark] = useState("");
  const [bulkRemark, setBulkRemark] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  // For search functionality
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<any>(null);

  // For sorting
  const [sortedInfo, setSortedInfo] = useState<any>({});
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  const toggleExpandCard = (id: string | number) => {
    const strId = String(id);
    setExpandedCardIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };

  const profilePermissions = (profile as any)?.role?.permission;
  const canApproveWorklogs =
    Array.isArray(profilePermissions) &&
    profilePermissions.some(
      (perm: any) => perm.path === "/worklogs/bulk-approve" && perm.method?.toLowerCase?.() === "patch"
    );
  const canRejectWorklogs =
    Array.isArray(profilePermissions) &&
    profilePermissions.some(
      (perm: any) => perm.path === "/worklogs/bulk-reject" && perm.method?.toLowerCase?.() === "patch"
    );

  const toggleDescription = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const customExpandIcon = ({ expanded, onExpand, record }: any) => {
    return (
      <span
        onClick={(e) => {
          toggleDescription(record.id);
          onExpand(record, e);
        }}
        style={{ cursor: "pointer", marginRight: 8 }}
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

  const getValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  const getUniqueValues = (dataIndex: string, inputValue: string = "") => {
    if (!filteredWorklogs) return [];
    const values = new Set<string>();
    filteredWorklogs.forEach((record: any) => {
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
      const inputValue = selectedKeys[0] || "";
      const suggestions = getUniqueValues(dataIndex, inputValue);
      return (
        <div style={{ padding: 8 }}>
          <Input
            ref={searchInput}
            placeholder={`Search ${title}`}
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedKeys(value ? [value] : []);
            }}
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ marginBottom: 8, display: "block" }}
          />
          {inputValue && suggestions.length > 0 && (
            <div
              style={{
                maxHeight: 200,
                overflowY: "auto",
                marginBottom: 8,
                border: "1px solid #d9d9d9",
                borderRadius: 4,
              }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    padding: "4px 8px",
                    cursor: "pointer",
                    borderBottom: index < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
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
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const expandedRowRender = (record: any) => {
    let description = record?.description || "No description available";
    if (record?.status === "rejected" && record?.rejectedRemark) {
      description += `<br/><b>Rejection Remark:</b> ${record.rejectedRemark}`;
    }
    return (
      <div
        className="p-4 bg-gray-50"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  };

  const showRejectModal = (id: string) => {
    setCurrentRecordId(id || null);
    setRemark("");
    setIsModalVisible(true);
  };

  const showBulkRejectModal = (ids: string[]) => {
    setCurrentRecordIds(ids.filter(Boolean));
    setBulkRemark("");
    setIsBulkModalVisible(true);
  };

  const handleBulkApprove = async () => {
    const ids = selectedRowKeys.map((key) => String(key));
    if (!ids.length) {
      message.warning("Select at least one worklog to approve.");
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

  const handleReject = () => {
    if (!currentRecordId) {
      setIsModalVisible(false);
      return;
    }
    editWorklog({ id: currentRecordId, status: "rejected", rejectedRemark: remark });
    setIsModalVisible(false);
    setCurrentRecordId(null);
    setRemark("");
  };

  const handleBulkReject = async () => {
    if (!currentRecordIds.length) {
      setIsBulkModalVisible(false);
      return;
    }
    try {
      await bulkRejectWorklogs({
        worklogIds: currentRecordIds,
        rejectedRemark: bulkRemark,
      });
      message.success("Selected worklogs rejected successfully.");
      setSelectedRowKeys((prev) => prev.filter((key) => !currentRecordIds.includes(String(key))));
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to reject selected worklogs.");
    }
    setIsBulkModalVisible(false);
    setCurrentRecordIds([]);
    setBulkRemark("");
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentRecordId(null);
    setRemark("");
  };

  const handleBulkCancel = () => {
    setIsBulkModalVisible(false);
    setCurrentRecordIds([]);
    setBulkRemark("");
  };

  // Only show worklogs where the current user is the approver
  const filteredWorklogs = useMemo(() => {
    const baseList = (worklogs || []).filter((w: any) => {
      const reqTo = w?.requestTo?.toString?.() === currentUserId?.toString();
      if (status.toLowerCase() === "requested") return reqTo;
      if (status.toLowerCase() === "approved") return reqTo && !!w?.approvedBy;
      if (status.toLowerCase() === "rejected") return reqTo && !!w?.rejectBy;
      return reqTo;
    });

    if (!searchQuery?.trim()) return baseList;
    const q = searchQuery.toLowerCase();
    return baseList.filter((w: any) => {
      const projectName = w?.task?.project?.name || "";
      const taskName = w?.task?.name || "";
      const userName = w?.user?.name || w?.createdByUser?.name || "";
      const reason = w?.reason || w?.description || "";
      return (
        projectName.toLowerCase().includes(q) ||
        taskName.toLowerCase().includes(q) ||
        userName.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q)
      );
    });
  }, [worklogs, currentUserId, status, searchQuery]);

  const rowSelection =
    !isMobile && status.toLowerCase() === "requested" && (canApproveWorklogs || canRejectWorklogs)
      ? {
          selectedRowKeys,
          onChange: (newSelectedRowKeys: Key[]) => setSelectedRowKeys(newSelectedRowKeys),
          getCheckboxProps: (record: any) => ({
            disabled: record?.status !== "requested" || record?.user?.id?.toString?.() === currentUserId?.toString(),
          }),
        }
      : undefined;

  const renderIncomingWorklogCard = (record: any) => {
    const isExpanded = expandedCardIds.includes(String(record.id));
    const dateStr = record?.startTime ? new Date(record.startTime).toLocaleDateString() : "-";
    const projectName = record?.task?.project?.name || "-";
    const taskName = record?.task?.name || "-";
    const requester = record?.user?.name || record?.createdByUser?.name || "-";
    const duration = record?.time || "-";
    const reason = record?.reason || record?.description || "";

    return (
      <div className="flex flex-col gap-2">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-sm truncate">{projectName}</div>
            <div className="text-xs text-gray-500 truncate">{taskName} &bull; {requester}</div>
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
                  icon={<CheckCircleOutlined style={{ fontSize: "16px", color: "#52c41a" }} />}
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
                  icon={<CloseCircleOutlined style={{ fontSize: "16px", color: "#ff4d4f" }} />}
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
              <span className="text-gray-500 font-medium shrink-0">Requester:</span>
              <span className="font-semibold text-gray-800 text-right">{requester}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Date:</span>
              <span className="font-semibold text-gray-800 text-right">{dateStr}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Duration:</span>
              <span className="font-semibold text-gray-800 text-right">{duration} hrs</span>
            </div>
            {record.rejectedRemark && (
              <div className="flex items-center justify-between gap-2 text-red-600">
                <span className="font-medium shrink-0">Remark:</span>
                <span className="font-semibold text-right">{record.rejectedRemark}</span>
              </div>
            )}
            {reason && (
              <div className="pt-1.5 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium block mb-1">Reason / Notes:</span>
                <div className="text-gray-700 bg-white p-2 rounded border border-gray-100 break-words">
                  {reason}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card styles={{ body: { padding: "12px" } }}>
      {!isMobile && (
        <TableToolbar>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {status.toLowerCase() === "requested" && (canApproveWorklogs || canRejectWorklogs) && (
              <Space>
                {canApproveWorklogs && (
                  <Popconfirm
                    title="Approve selected worklogs?"
                    okText="Approve"
                    cancelText="Cancel"
                    onConfirm={handleBulkApprove}
                    disabled={!selectedRowKeys.length}
                  >
                    <Button
                      type="primary"
                      loading={isBulkApprovePending}
                      disabled={!selectedRowKeys.length}
                    >
                      Approve Selected
                    </Button>
                  </Popconfirm>
                )}
                {canRejectWorklogs && (
                  <Popconfirm
                    title="Reject selected worklogs?"
                    okText="Continue"
                    cancelText="Cancel"
                    onConfirm={() => showBulkRejectModal(selectedRowKeys.map((key) => String(key)))}
                    disabled={!selectedRowKeys.length}
                  >
                    <Button
                      danger
                      loading={isBulkRejectPending}
                      disabled={!selectedRowKeys.length}
                    >
                      Reject Selected
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            )}
          </div>
        </TableToolbar>
      )}
      <ResponsiveTable
        tableProps={{
          loading: isPending || isEditPending,
          dataSource: filteredWorklogs,
          rowSelection: rowSelection,
          columns: columns(
            status,
            deleteWorklog,
            editWorklog,
            navigate,
            getColumnSearchProps,
            sortedInfo,
            showRejectModal,
            editWorklog
          ),
          expandable: {
            expandedRowRender,
            expandedRowKeys: expandedRows,
            expandIcon: customExpandIcon,
          },
          onChange: handleTableChange,
          rowKey: "id",
          bordered: true,
          pagination: isMobile ? false : {
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [5, 10, 20, 50],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          },
        }}
        renderMobileCard={renderIncomingWorklogCard}
      />
      <Modal
        title="Reject Worklog"
        open={isModalVisible}
        onOk={handleReject}
        onCancel={handleCancel}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <TextArea
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Enter reason for rejection"
        />
      </Modal>
      <Modal
        title="Reject Selected Worklogs"
        open={isBulkModalVisible}
        onOk={handleBulkReject}
        onCancel={handleBulkCancel}
        okText="Reject Selected"
        okButtonProps={{ danger: true }}
        confirmLoading={isBulkRejectPending}
      >
        <TextArea
          rows={4}
          value={bulkRemark}
          onChange={(e) => setBulkRemark(e.target.value)}
          placeholder="Enter reason for rejecting selected worklogs"
        />
      </Modal>
    </Card>
  );
};

export default IncomingWorklogTable;
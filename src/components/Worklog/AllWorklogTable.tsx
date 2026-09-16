import { useEditWorklog } from "@/hooks/worklog/useEditWorklog";
import { useWorklog } from "@/hooks/worklog/useWorklog";
import { Button, Card, Table, Popconfirm, Input, Space } from "antd";
import { Tooltip } from "antd";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteWorklog } from "@/hooks/worklog/useDeleteWorklog";
import { useState, useRef } from "react";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import ResponsiveTable from "@/components/ui/MobileCardList";
import { Tag } from "antd";

const columns = (
  status: string, 
  deleteWorklog: any, 
  navigate: any, 
  getColumnSearchProps: any, 
  sortedInfo: any
) => {
  // Determine column title based on status
  const getStatusTitle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "Approved By";
      case "rejected":
        return "Rejected By";
      case "requested":
        return "Requested By";
      default:
        return "Reviewed By";
    }
  };

  const baseColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      ...getColumnSearchProps('startTime', 'Date'),
      sorter: (a: any, b: any) => moment(a.startTime).unix() - moment(b.startTime).unix(),
      sortOrder: sortedInfo.columnKey === 'date' && sortedInfo.order,
      render: (_: any, record: any) => {
        return new Date(record?.startTime).toLocaleDateString();
      }
    },
    {
      title: "Project Name",
      dataIndex: "project",
      key: "project",
      ...getColumnSearchProps('task.project.name', 'Project'),
      sorter: (a: any, b: any) => (a.task?.project?.name || '').localeCompare(b.task?.project?.name || ''),
      sortOrder: sortedInfo.columnKey === 'project' && sortedInfo.order,
      render: (_: any, record: any) => {
        return <Link to={`/projects/${record?.task?.project?.id}`} className="text-blue-600">{record?.task?.project?.name}</Link>
      }
    },
    {
      title: "Request To",
      dataIndex: "requestTo",
      key: "requestTo",
      ...getColumnSearchProps('requestToUser.name', 'Request To'),
      sorter: (a: any, b: any) => (a.requestToUser?.name || '').localeCompare(b.requestToUser?.name || ''),
      sortOrder: sortedInfo.columnKey === 'requestTo' && sortedInfo.order,
      render: (_: any, record: any) => {
        const user = record?.requestToUser;
        const requestAt = record?.requestedAt ? new Date(record.requestedAt).toLocaleString() : null;
        return user ? (
          <Tooltip title={<span>{user.email || user.name}<br/>{requestAt && <span>Requested At: {requestAt}</span>}</span>}>
            <span>{user.name}</span>
          </Tooltip>
        ) : "-";
      }
    },
    {
      title: "Task",
      dataIndex: "Task",
      key: "task",
      ...getColumnSearchProps('task.name', 'Task'),
      sorter: (a: any, b: any) => (a.task?.name || '').localeCompare(b.task?.name || ''),
      sortOrder: sortedInfo.columnKey === 'task' && sortedInfo.order,
      render: (_: any, record: any) => {
        return <Link to={`/projects/${record?.task?.project?.id}/tasks/${record?.task?.id}`} className="text-blue-600">{record?.task?.name}</Link>
      }
    },
    {
      title: "Duration",
      dataIndex: "startTime",
      key: "startTime",
      sorter: (a: any, b: any) => moment.duration(moment(a.endTime).diff(moment(a.startTime))).asMinutes() - 
                                 moment.duration(moment(b.endTime).diff(moment(b.startTime))).asMinutes(),
      sortOrder: sortedInfo.columnKey === 'startTime' && sortedInfo.order,
      render: (_: any, record: any) => {
        return <>
          <div>
            {moment(record?.startTime).format("hh:mm A") + " - " + moment(record?.endTime).format("hh:mm A")}
          </div>
          {` (${moment.duration(moment(record?.endTime).diff(moment(record?.startTime))).asMinutes()} minutes)`}
        </>
      }
    },
    {
      title: getStatusTitle(status),
      dataIndex: "approvedBy",
      key: "approvedBy",
      ...getColumnSearchProps(
        status.toLowerCase() === 'approved' ? 'approvedByUser.name' : 
        status.toLowerCase() === 'rejected' ? 'rejectByUser.name' : 
        'user.name', 
        getStatusTitle(status)
      ),
      sorter: (a: any, b: any) => {
        let nameA = '';
        let nameB = '';
        if (status.toLowerCase() === 'approved') {
          nameA = a.approvedByUser?.name || '';
          nameB = b.approvedByUser?.name || '';
        } else if (status.toLowerCase() === 'rejected') {
          nameA = a.rejectByUser?.name || '';
          nameB = b.rejectByUser?.name || '';
        } else {
          nameA = a.user?.name || '';
          nameB = b.user?.name || '';
        }
        return nameA.localeCompare(nameB);
      },
      sortOrder: sortedInfo.columnKey === 'approvedBy' && sortedInfo.order,
      render: (_: any, record: any) => {
        let user = null;
        let extra = null;
        
        if (status.toLowerCase() === 'approved') {
          user = record?.approvedByUser;
          const approvedAt = record?.approvedAt ? new Date(record.approvedAt).toLocaleString() : null;
          if (approvedAt) {
            extra = <span>Approved At: {approvedAt}</span>;
          }
        } else if (status.toLowerCase() === 'rejected') {
          user = record?.rejectByUser;
          const rejectedAt = record?.rejectedAt ? new Date(record.rejectedAt).toLocaleString() : null;
          if (rejectedAt) {
            extra = <span>Rejected At: {rejectedAt}</span>;
          }
        } else {
          user = record?.user;
          const requestedAt = record?.requestedAt ? new Date(record.requestedAt).toLocaleString() : null;
          if (requestedAt) {
            extra = <span>Requested At: {requestedAt}</span>;
          }
        }
        
        return user ? (
          <Tooltip title={<span>{user.email || user.name}<br/>{extra}</span>}>
            <span>{user.name}</span>
          </Tooltip>
        ) : "-";
      }
    },
  ];

  // Add Remark column only for rejected status
  if (status.toLowerCase() === "rejected") {
    baseColumns.push({
      title: "Rejection Remark",
      dataIndex: "rejectedRemark",
      key: "rejectedRemark",
      ...getColumnSearchProps('rejectedRemark', 'Rejection Remark'),
      sorter: (a: any, b: any) => (a.rejectedRemark || '').localeCompare(b.rejectedRemark || ''),
      sortOrder: sortedInfo.columnKey === 'rejectedRemark' && sortedInfo.order,
      render: (_: any, record: any) => {
        if (record?.status === 'rejected' && record?.rejectedRemark) {
          return (
            <Tooltip title={record.rejectedRemark}>
              <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#fa541c' }}>
                {record.rejectedRemark.length > 30 ? record.rejectedRemark.slice(0, 30) + '...' : record.rejectedRemark}
              </span>
            </Tooltip>
          );
        }
        return record?.rejectedRemark || "-";
      }
    });
  }

  baseColumns.push({
    title: "Action",
    dataIndex: "o",
    key: "s",
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
            onConfirm={() => deleteWorklog({id:record?.id})}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button 
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      );
    }
  });

  return baseColumns;
};

const AllWorklogTable = ({ status }: { status: string }) => {
  const navigate = useNavigate();
  const { data: worklogs, isPending } = useWorklog(status);
  const { isPending: isEditPending } = useEditWorklog();
  const { mutate: deleteWorklog } = useDeleteWorklog();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  // For search
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<any>(null);
  
  // For sorting
  const [sortedInfo, setSortedInfo] = useState<any>({});

  // Function to toggle description visibility
  const toggleDescription = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  // Custom expand icon
  const customExpandIcon = ({ expanded, onExpand, record }: any) => {
    return (
      <span
        onClick={e => {
          toggleDescription(record.id);
          onExpand(record, e);
        }}
        style={{ cursor: "pointer", marginRight: 8 }}
      >
        {expanded ? "−" : "+"}
      </span>
    );
  };

  // Expanded row render function for description
  const expandedRowRender = (record: any) => {
    let description = record?.description || "No description available";
    if (record?.status === "rejected" && record?.rejectedRemark) {
      description += `<br/><br/><b>Rejection Remark:</b> ${record.rejectedRemark}`;
    }
    return (
      <div 
        className="p-4 bg-gray-50"
        dangerouslySetInnerHTML={{ __html: description }}
      />
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
  
  const getColumnSearchProps = (dataIndex: string, title: string) => {
    // Get unique values for autocomplete
    const getUniqueValues = () => {
      const getValue = (obj: any, path: string): any => {
        if (path.includes('.')) {
          const keys = path.split('.');
          let nestedObj = obj;
          for (const key of keys) {
            if (!nestedObj || !nestedObj[key]) return null;
            nestedObj = nestedObj[key];
          }
          return nestedObj;
        }
        return obj[path];
      };

      const values = new Set<string>();
      worklogs?.forEach((record: any) => {
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
        const currentValue = selectedKeys[0] || '';
        const filteredOptions = currentValue 
          ? uniqueValues.filter(val => 
              val.toLowerCase().includes(currentValue.toLowerCase())
            ).slice(0, 10)
          : [];

        return (
          <div style={{ padding: 8 }}>
            <Input
              ref={searchInput}
              placeholder={`Search ${title}`}
              value={currentValue}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
              style={{ marginBottom: 8, display: 'block' }}
            />
            {filteredOptions.length > 0 && currentValue && (
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto', 
                marginBottom: 8,
                border: '1px solid #d9d9d9',
                borderRadius: 4
              }}>
                {filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      borderBottom: idx < filteredOptions.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
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
        if (dataIndex.includes('.')) {
          const keys = dataIndex.split('.');
          let nestedObj = record;
          for (const key of keys) {
            if (!nestedObj || !nestedObj[key]) return false;
            nestedObj = nestedObj[key];
          }
          return nestedObj.toString().toLowerCase().includes(value.toLowerCase());
        }
        return record[dataIndex]
          ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
          : '';
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
    };
  };

  const renderWorklogCard = (record: any) => {
    const dateStr = record?.startTime ? new Date(record.startTime).toLocaleDateString() : '-';
    const projectName = record?.task?.project?.name || '-';
    const taskName = record?.task?.name || '-';
    const duration = record?.time || '-';
    const reason = record?.reason || '';

    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-2">
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{projectName}</div>
            <div className="text-xs text-gray-500 truncate">{taskName}</div>
          </div>
          <Tag color={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'blue'} className="shrink-0">
            {status.toUpperCase()}
          </Tag>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs py-1">
          <div><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-800">{dateStr}</span></div>
          <div><span className="text-gray-500">Duration:</span> <span className="font-medium text-gray-800">{duration} hrs</span></div>
        </div>
        {reason && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded break-words">
            {reason}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/worklogs/edit/${record.id}`)}>Edit</Button>
        </div>
      </div>
    );
  };

  return (
    <Card styles={{ body: { padding: '12px' } }}>
      <ResponsiveTable
        tableProps={{
          loading: isPending || isEditPending,
          dataSource: worklogs || [],
          columns: columns(status, deleteWorklog, navigate, getColumnSearchProps, sortedInfo) as any,
          expandable: {
            expandedRowRender,
            expandedRowKeys: expandedRows,
            expandIcon: customExpandIcon,
          },
          onChange: handleTableChange,
          rowKey: "id",
          bordered: true,
          pagination: {
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [5, 10, 20, 50],
            showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} items`,
          },
        }}
        renderMobileCard={renderWorklogCard}
      />
    </Card>
  );
};

export default AllWorklogTable;
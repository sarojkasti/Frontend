

import { Table, Space, Button, Input, Tooltip, Empty, Tag } from "antd";
import moment from "moment";
import { useState, useRef, useEffect } from "react";
import { SearchOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import Highlighter from 'react-highlight-words';
import { fetchUsers } from "@/service/user.service";
import { UserType } from "@/types/user";
import useIsMobile from "@/hooks/useIsMobile";
import { ResponsiveTable } from "@/components/ui/MobileCardList";

const WorklogTable = ({ data }: { data: any }) => {
  const { isMobile } = useIsMobile();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [sortedInfo, setSortedInfo] = useState<any>({});
  const searchInput = useRef<any>(null);
  const [userMap, setUserMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Fetch all users (active, large limit, first page, no keywords)
    fetchUsers({ status: "active", limit: 1000, page: 1, keywords: "" })
      .then((res: any) => {
        // If paginated, use res.results, else fallback to res
        const users: UserType[] = res?.results || res || [];
        const map: { [key: string]: string } = {};
        users.forEach((u) => {
          if (u.id) map[u.id.toString()] = u.name || u.username || u.email || u.id.toString();
        });
        setUserMap(map);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };

  const getColumnSearchProps = (dataIndex: string, title: string): any => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
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
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: string, record: any) => {
      if (dataIndex.includes('.')) {
        const keys = dataIndex.split('.');
        let val = record;
        for (const key of keys) {
          if (!val) return false;
          val = val[key];
        }
        return val ? val.toString().toLowerCase().includes(value.toLowerCase()) : false;
      }
      return record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '';
    },
    onFilterDropdownVisibleChange: (visible: boolean) => {
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

  const columns = [
    {
      title: "Request To",
      dataIndex: "requestTo",
      key: "requestTo",
      ...getColumnSearchProps('requestTo', 'Request To'),
      render: (_: any, record: any) => {
        if (!record?.requestTo) return "-";
        return userMap[record.requestTo?.toString()] || record.requestTo;
      },
    },
    {
      title: "Approved By",
      dataIndex: "approvedBy",
      key: "approvedBy",
      ...getColumnSearchProps('approvedBy', 'Approved By'),
      render: (_: any, record: any) => {
        if (!record?.approvedBy) return "-";
        return userMap[record.approvedBy?.toString()] || record.approvedBy;
      },
    },
    {
      title: "Rejected By",
      dataIndex: "rejectBy",
      key: "rejectBy",
      ...getColumnSearchProps('rejectBy', 'Rejected By'),
      render: (_: any, record: any) => {
        if (!record?.rejectBy) return "-";
        return userMap[record.rejectBy?.toString()] || record.rejectBy;
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a: any, b: any) => moment(a.startTime).unix() - moment(b.startTime).unix(),
      sortOrder: sortedInfo.columnKey === 'date' && sortedInfo.order,
      render: (_: any, record: any) => {
        return new Date(record?.startTime).toLocaleDateString();
      }
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      sorter: (a: any, b: any) => moment(a.startTime).unix() - moment(b.startTime).unix(),
      sortOrder: sortedInfo.columnKey === 'startTime' && sortedInfo.order,
      render: (_: any, record: any) => {
        return moment(record?.startTime).format("hh:mm A");
      }
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      sorter: (a: any, b: any) => moment(a.endTime).unix() - moment(b.endTime).unix(),
      sortOrder: sortedInfo.columnKey === 'endTime' && sortedInfo.order,
      render: (_: any, record: any) => {
        return moment(record?.endTime).format("hh:mm A");
      }
    },
    {
      title: "Logged by",
      dataIndex: "userId",
      key: "userId",
      ...getColumnSearchProps('user.name', 'Logged by'),
      sorter: (a: any, b: any) => (a.user?.name || '').localeCompare(b.user?.name || ''),
      sortOrder: sortedInfo.columnKey === 'userId' && sortedInfo.order,
      render: (_: any, record: any) => {
        return (record?.user?.name);
      }
    },
  ];

  // Add Rejection Remark column if any worklog is rejected
  if (Array.isArray(data) && data.some((w) => w.status === 'rejected')) {
    columns.push({
      title: "Rejection Remark",
      dataIndex: "rejectedRemark",
      key: "rejectedRemark",
      ...getColumnSearchProps('rejectedRemark', 'Rejection Remark'),
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
      },
    });
  }

  return (
    <ResponsiveTable
      dataSource={data}
      columns={columns}
      size="small"
      rowKey={"id"}
      bordered
      onChange={handleTableChange}
      pagination={isMobile ? false : {
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: [5, 10, 20, 50],
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
      locale={{
        emptyText: <Empty description="No worklogs available" />
      }}
      renderMobileCard={(record: any) => {
        const startTime = record?.startTime ? moment(record.startTime).format("hh:mm A") : "";
        const endTime = record?.endTime ? moment(record.endTime).format("hh:mm A") : "";
        const logDate = record?.startTime ? moment(record.startTime).format("MMM DD, YYYY") : "";
        const reqTo = record?.requestTo ? (userMap[record.requestTo.toString()] || record.requestTo) : null;
        const appBy = record?.approvedBy ? (userMap[record.approvedBy.toString()] || record.approvedBy) : null;
        const rejBy = record?.rejectBy ? (userMap[record.rejectBy.toString()] || record.rejectBy) : null;

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  {record?.user?.name || "Unknown User"}
                </div>
                <div className="text-xs text-gray-500">{logDate}</div>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium shrink-0">
                <ClockCircleOutlined />
                <span>{startTime} - {endTime}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {reqTo && (
                <div className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  <span className="text-gray-400 mr-1">To:</span>
                  <span className="font-medium">{reqTo}</span>
                </div>
              )}
              {appBy && (
                <Tag color="success" style={{ margin: 0 }}>
                  Approved by: {appBy}
                </Tag>
              )}
              {rejBy && (
                <Tag color="error" style={{ margin: 0 }}>
                  Rejected by: {rejBy}
                </Tag>
              )}
            </div>

            {record?.description && (
              <div 
                className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 border border-gray-100 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: record.description }}
              />
            )}

            {record?.status === "rejected" && record?.rejectedRemark && (
              <div className="bg-red-50 text-red-700 rounded-lg p-2 text-xs border border-red-100">
                <strong>Rejection Remark:</strong> {record.rejectedRemark}
              </div>
            )}
          </div>
        );
      }}
      expandable={{
        expandedRowRender: (record: any) => {
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
        }
      }}
    />
  );
};

export default WorklogTable;

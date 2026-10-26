import { Table, Space, Button, Input, Tooltip, Empty, Tag } from "antd";
import moment from "moment";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { SearchOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import Highlighter from 'react-highlight-words';
import { fetchUsers, listActiveUsers } from "@/service/user.service";
import { UserType } from "@/types/user";
import useIsMobile from "@/hooks/useIsMobile";
import { ResponsiveTable } from "@/components/ui/MobileCardList";
import { PowerTable, PowerTableColumn } from "@/components/Table";

export const ALL_WORKLOG_COLUMNS = [
  { key: "requestTo", label: "Request To" },
  { key: "approvedBy", label: "Approved By" },
  { key: "rejectBy", label: "Rejected By" },
  { key: "date", label: "Date" },
  { key: "startTime", label: "Start Time" },
  { key: "endTime", label: "End Time" },
  { key: "userId", label: "Logged by" },
  { key: "rejectedRemark", label: "Rejection Remark" },
];

interface WorklogTableProps {
  data: any;
  visibleColumnKeys?: string[];
}

const WorklogTable = ({ data, visibleColumnKeys }: WorklogTableProps) => {
  const { isMobile } = useIsMobile();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [sortedInfo, setSortedInfo] = useState<any>({});
  const searchInput = useRef<any>(null);
  const [userMap, setUserMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      const map: { [key: string]: string } = {};

      // 1. Fetch via listActiveUsers (accessible to all authenticated users without admin permission)
      try {
        const activeUsers = await listActiveUsers();
        if (Array.isArray(activeUsers)) {
          activeUsers.forEach((u: any) => {
            if (u.id) {
              const name = u.name || u.username || u.email || "";
              map[u.id.toString()] = name;
            }
          });
        }
      } catch (err) {
        console.warn("listActiveUsers failed", err);
      }

      // 2. Fetch full users list as fallback/enrichment for any inactive/historical users
      try {
        const res: any = await fetchUsers({ status: "all", limit: 1000, page: 1, keywords: "" });
        const users: UserType[] = res?.results || (Array.isArray(res) ? res : []);
        users.forEach((u) => {
          if (u.id && !map[u.id.toString()]) {
            const name = u.name || u.username || u.email || "";
            map[u.id.toString()] = name;
          }
        });
      } catch {
        // Fallback error ignored
      }

      if (isMounted) {
        setUserMap(map);
      }
    };

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatName = useCallback((rawName?: string): string => {
    if (!rawName) return "";
    const clean = rawName.trim();
    if (false) {
      /* ignore */
    }
    return clean;
  }, []);

  const resolveUserDisplayName = useCallback(
    (fieldValue: any, userRelation?: any): string => {
      // 1. Populated relation object on the worklog (requestToUser, approvedByUser, rejectByUser, user)
      if (userRelation) {
        if (userRelation.name) return formatName(userRelation.name);
        if (userRelation.username) return formatName(userRelation.username);
        if (userRelation.email) return formatName(userRelation.email);
      }

      // 2. If fieldValue is an object
      if (typeof fieldValue === "object" && fieldValue !== null) {
        if (fieldValue.name) return formatName(fieldValue.name);
        if (fieldValue.username) return formatName(fieldValue.username);
        if (fieldValue.id && userMap[fieldValue.id.toString()]) {
          return formatName(userMap[fieldValue.id.toString()]);
        }
      }

      // 3. String / UUID identifier
      if (fieldValue) {
        const str = fieldValue.toString().trim();
        if (false) {
          /* ignore */
        }
        if (userMap[str]) {
          return formatName(userMap[str]);
        }
        // If it's a UUID not found in userMap, return a graceful fallback
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        if (isUUID) {
          return "Team Member";
        }
        return formatName(str);
      }

      return "-";
    },
    [userMap, formatName]
  );

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
      let resolvedText = '';
      if (dataIndex === 'requestTo') {
        resolvedText = resolveUserDisplayName(record?.requestTo, record?.requestToUser);
      } else if (dataIndex === 'approvedBy') {
        resolvedText = resolveUserDisplayName(record?.approvedBy, record?.approvedByUser);
      } else if (dataIndex === 'rejectBy') {
        resolvedText = resolveUserDisplayName(record?.rejectBy, record?.rejectByUser);
      } else if (dataIndex === 'user.name' || dataIndex === 'userId') {
        resolvedText = resolveUserDisplayName(record?.user?.id || record?.userId, record?.user);
      } else if (dataIndex.includes('.')) {
        const keys = dataIndex.split('.');
        let val = record;
        for (const key of keys) {
          if (!val) return false;
          val = val[key];
        }
        resolvedText = val ? val.toString() : '';
      } else {
        resolvedText = record[dataIndex] ? record[dataIndex].toString() : '';
      }
      return resolvedText.toLowerCase().includes(value.toLowerCase());
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

  const columns: PowerTableColumn<any>[] = [
    {
      title: "Request To",
      dataIndex: "requestTo",
      key: "requestTo",
      defaultWidth: 160,
      ...getColumnSearchProps('requestTo', 'Request To'),
      sorter: (a: any, b: any) => {
        const nameA = resolveUserDisplayName(a?.requestTo, a?.requestToUser);
        const nameB = resolveUserDisplayName(b?.requestTo, b?.requestToUser);
        return nameA.localeCompare(nameB);
      },
      sortOrder: sortedInfo.columnKey === 'requestTo' && sortedInfo.order,
      render: (_: any, record: any) => {
        const name = resolveUserDisplayName(record?.requestTo, record?.requestToUser);
        if (!name || name === "-") return "-";
        return (
          <span className="font-medium text-slate-800">
            {name}
          </span>
        );
      },
    },
    {
      title: "Approved By",
      dataIndex: "approvedBy",
      key: "approvedBy",
      defaultWidth: 160,
      ...getColumnSearchProps('approvedBy', 'Approved By'),
      sorter: (a: any, b: any) => {
        const nameA = resolveUserDisplayName(a?.approvedBy, a?.approvedByUser);
        const nameB = resolveUserDisplayName(b?.approvedBy, b?.approvedByUser);
        return nameA.localeCompare(nameB);
      },
      sortOrder: sortedInfo.columnKey === 'approvedBy' && sortedInfo.order,
      render: (_: any, record: any) => {
        const name = resolveUserDisplayName(record?.approvedBy, record?.approvedByUser);
        if (!name || name === "-") return "-";
        return (
          <span className="font-medium text-slate-800">
            {name}
          </span>
        );
      },
    },
    {
      title: "Rejected By",
      dataIndex: "rejectBy",
      key: "rejectBy",
      defaultWidth: 160,
      ...getColumnSearchProps('rejectBy', 'Rejected By'),
      sorter: (a: any, b: any) => {
        const nameA = resolveUserDisplayName(a?.rejectBy, a?.rejectByUser);
        const nameB = resolveUserDisplayName(b?.rejectBy, b?.rejectByUser);
        return nameA.localeCompare(nameB);
      },
      sortOrder: sortedInfo.columnKey === 'rejectBy' && sortedInfo.order,
      render: (_: any, record: any) => {
        const name = resolveUserDisplayName(record?.rejectBy, record?.rejectByUser);
        if (!name || name === "-") return "-";
        return (
          <span className="font-medium text-red-600">
            {name}
          </span>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      defaultWidth: 130,
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
      defaultWidth: 120,
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
      defaultWidth: 120,
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
      defaultWidth: 150,
      ...getColumnSearchProps('user.name', 'Logged by'),
      sorter: (a: any, b: any) => {
        const nameA = resolveUserDisplayName(a?.user?.id || a?.userId, a?.user);
        const nameB = resolveUserDisplayName(b?.user?.id || b?.userId, b?.user);
        return nameA.localeCompare(nameB);
      },
      sortOrder: sortedInfo.columnKey === 'userId' && sortedInfo.order,
      render: (_: any, record: any) => {
        return resolveUserDisplayName(record?.user?.id || record?.userId, record?.user);
      }
    },
  ];

  // Add Rejection Remark column if any worklog is rejected
  if (Array.isArray(data) && data.some((w) => w.status === 'rejected')) {
    columns.push({
      title: "Rejection Remark",
      dataIndex: "rejectedRemark",
      key: "rejectedRemark",
      defaultWidth: 180,
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
    <PowerTable
      dataSource={data}
      columns={columns}
      size="small"
      rowKey={"id"}
      bordered
      enableResize
      enableColumnSearch
      showToolbar={false}
      visibleColumnKeys={visibleColumnKeys}
      persistenceKey="worklog_table"
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
        const reqTo = resolveUserDisplayName(record?.requestTo, record?.requestToUser);
        const appBy = resolveUserDisplayName(record?.approvedBy, record?.approvedByUser);
        const rejBy = resolveUserDisplayName(record?.rejectBy, record?.rejectByUser);
        const loggedBy = resolveUserDisplayName(record?.user?.id || record?.userId, record?.user);

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  {loggedBy || "Unknown User"}
                </div>
                <div className="text-xs text-gray-500">{logDate}</div>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium shrink-0">
                <ClockCircleOutlined />
                <span>{startTime} - {endTime}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {reqTo && reqTo !== "-" && (
                <div className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  <span className="text-gray-400 mr-1">To:</span>
                  <span className="font-medium">{reqTo}</span>
                </div>
              )}
              {appBy && appBy !== "-" && (
                <Tag color="success" style={{ margin: 0 }}>
                  Approved by: {appBy}
                </Tag>
              )}
              {rejBy && rejBy !== "-" && (
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

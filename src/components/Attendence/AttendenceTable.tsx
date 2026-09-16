import { useAttendence } from "@/hooks/attendence/useAttendence";
import { useAllUsersAttendence } from "@/hooks/attendence/useAllUsersAttendence";
import { useTodayAllUsersAttendence } from "@/hooks/attendence/useTodayAllUsersAttendence";
import { useAttendenceById } from "@/hooks/attendence/useAttendenceById";
import { Table, Button, Input, Space, Tooltip } from "antd";
import { SearchOutlined, EnvironmentOutlined } from "@ant-design/icons";
import moment from "moment";
import { useState, useRef } from "react";
import Highlighter from 'react-highlight-words';
import ResponsiveTable from "@/components/ui/MobileCardList";
import { Tag } from "antd";

interface AttendenceTableProps {
  viewType?: 'my' | 'all-users' | 'today-all' | 'by-user' | 'date-wise';
  selectedUserId?: string;
  selectedDate?: string;
  dateWiseData?: any[];
  isPending?: boolean;
}

const AttendenceTable = ({ 
  viewType = 'my', 
  selectedUserId,
  selectedDate,
  dateWiseData,
  isPending: externalPending
}: AttendenceTableProps) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [sortedInfo, setSortedInfo] = useState<any>({
    order: 'descend',
    columnKey: 'date',
  });
  const searchInput = useRef<any>(null);

  // Get attendance data and loading state from the custom hooks based on view type
  const { data: myAttendence, isPending: myAttendencePending } = useAttendence();
  const { data: allUsersAttendence, isPending: allUsersAttendencePending } = useAllUsersAttendence(
    viewType === 'all-users'
  );
  const { data: todayAllUsersAttendence, isPending: todayAllUsersAttendencePending } = useTodayAllUsersAttendence(
    viewType === 'today-all'
  );
  const { data: userAttendence, isPending: userAttendencePending } = useAttendenceById({
    id: viewType === 'by-user' && selectedUserId ? selectedUserId : '',
  });

  // Determine which data and loading state to use based on viewType
  const getAttendanceData = () => {
    switch (viewType) {
      case 'all-users':
        return { data: allUsersAttendence, loading: allUsersAttendencePending };
      case 'today-all':
        return { data: todayAllUsersAttendence, loading: todayAllUsersAttendencePending };
      case 'date-wise':
        return { data: dateWiseData, loading: externalPending || false };
      case 'by-user':
        return { data: userAttendence, loading: userAttendencePending };
      case 'my':
      default:
        return { data: myAttendence, loading: myAttendencePending };
    }
  };

  const { data: attendence, loading: isPending } = getAttendanceData();

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };

  // Function to calculate the duration between clockIn and clockOut
  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return "N/A"; // Handle case where clockOut isn't set yet

    const clockInTime = moment(clockIn, "HH:mm:ss a"); // Parse HH:mm:ss a format
    const clockOutTime = moment(clockOut, "HH:mm:ss a"); // Parse HH:mm:ss a format

    // Calculate the difference in minutes
    const durationInMinutes = moment.duration(clockOutTime.diff(clockInTime)).asMinutes();

    // Convert minutes to hours and minutes
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = Math.floor(durationInMinutes % 60);

    return `${hours}h ${minutes}m`;
  };

  // Function to open the location in Google Maps
  const openLocationInMap = (latitude: string, longitude: string) => {
    const googleMapsURL = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(googleMapsURL, "_blank");
  };

  // Function to get landmark name from coordinates (placeholder implementation)
  const getLandmarkName = (latitude: string, longitude: string) => {
    // This is a placeholder. In a real implementation, this would use a reverse geocoding service
    // to convert coordinates to an address or landmark name.
    // For now, it will return a formatted coordinate string
    return `${latitude}, ${longitude}`;
  };

  const getColumnSearchProps = (dataIndex: string, title: string): any => {
    // Get unique values for autocomplete
    const getUniqueValues = () => {
      const getValue = (obj: any, path: string): any => {
        if (path === 'userName') {
          return obj.user?.name || obj.user?.email || '';
        }
        if (path.includes('.')) {
          const keys = path.split('.');
          let val = obj;
          for (const key of keys) {
            if (!val) return null;
            val = val[key];
          }
          return val;
        }
        return obj[path];
      };

      const values = new Set<string>();
      attendence?.forEach((record: any) => {
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
          : uniqueValues.slice(0, 10);

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
            {filteredOptions.length > 0 && (
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
    onFilter: (value: string, record: any) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : dataIndex === 'userName' && record.user
        ? (record.user.name || record.user.email || '').toLowerCase().includes(value.toLowerCase())
        : '',
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
    };
  };

  const columns = [
    // Conditionally show user column for all-users, today-all, and date-wise views
    ...(viewType === 'all-users' || viewType === 'today-all' || viewType === 'date-wise' ? [{
      title: "User",
      dataIndex: ["user", "name"],
      key: "userName",
      ...getColumnSearchProps('userName', 'User'),
      render: (_text: string, record: any) => record.user?.name || record.user?.email || "N/A",
    }] : []),
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a: any, b: any) => moment(a.date).unix() - moment(b.date).unix(),
      sortOrder: sortedInfo.columnKey === 'date' && sortedInfo.order,
      defaultSortOrder: 'descend',
      ...getColumnSearchProps('date', 'Date'),
    },
    {
      title: "Clock In",
      dataIndex: "clockIn",
      key: "clockIn",
      sorter: (a: any, b: any) => moment(a.clockIn, "HH:mm:ss a").unix() - moment(b.clockIn, "HH:mm:ss a").unix(),
      sortOrder: sortedInfo.columnKey === 'clockIn' && sortedInfo.order,
      ...getColumnSearchProps('clockIn', 'Clock In'),
    },
    {
      title: "Clock In Remark",
      dataIndex: "clockInRemark",
      key: "clockInRemark",
      ...getColumnSearchProps('clockInRemark', 'Clock In Remark'),
      render: (text: string) => text || "N/A", // Display "N/A" if no remark
    },
    {
      title: "Clock Out",
      dataIndex: "clockOut",
      key: "clockOut",
      sorter: (a: any, b: any) => {
        if (!a.clockOut) return -1;
        if (!b.clockOut) return 1;
        return moment(a.clockOut, "HH:mm:ss a").unix() - moment(b.clockOut, "HH:mm:ss a").unix();
      },
      sortOrder: sortedInfo.columnKey === 'clockOut' && sortedInfo.order,
      ...getColumnSearchProps('clockOut', 'Clock Out'),
    },
    {
      title: "Clock Out Remark",
      dataIndex: "clockOutRemark",
      key: "clockOutRemark",
      ...getColumnSearchProps('clockOutRemark', 'Clock Out Remark'),
      render: (text: string) => text || "N/A", // Display "N/A" if no remark
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      sorter: (a: any, b: any) => {
        // Convert duration strings to minutes for sorting
        const getMinutes = (duration: string) => {
          if (duration === 'N/A') return 0;
          const match = duration.match(/(\d+)h\s+(\d+)m/);
          if (!match) return 0;
          return parseInt(match[1]) * 60 + parseInt(match[2]);
        };
        return getMinutes(a.duration) - getMinutes(b.duration);
      },
      sortOrder: sortedInfo.columnKey === 'duration' && sortedInfo.order,
    },
    {
      title: "Worklogs",
      key: "worklogs",
      render: (_: any, record: any) => {
        const worklogs = record.worklogs;
        if (!worklogs) return "No data";
        
        return (
          <div style={{ fontSize: '12px' }}>
            <div style={{ color: '#1890ff' }}>
              📋 Requested: {worklogs.requested?.hours || '0h 0m'}
            </div>
            <div style={{ color: '#52c41a' }}>
              ✅ Approved: {worklogs.approved?.hours || '0h 0m'}
            </div>
            <div style={{ color: '#ff4d4f' }}>
              ❌ Rejected: {worklogs.rejected?.hours || '0h 0m'}
            </div>
          </div>
        );
      },
    },
    {
      title: "Location",
      key: "location",
      render: (_: any, record: any) => {
        // Check if we have valid latitude and longitude
        const hasLocation = record.latitude && record.longitude && 
                           record.latitude !== 'null' && record.longitude !== 'null';
        
        if (!hasLocation) {
          return <span style={{ color: '#999' }}>N/A</span>;
        }

        return (
          <Tooltip title="View Clock-in Location on Map">
            <Button
              type="link"
              icon={<EnvironmentOutlined />}
              onClick={() => openLocationInMap(record.latitude, record.longitude)}
              size="small"
            />
          </Tooltip>
        );
      },
    },
  ];

  // Add a "duration" field and landmark field for attendance data
  const updatedAttendence = attendence?.map((item: any) => ({
    ...item,
    duration: calculateDuration(item.clockIn, item.clockOut),
    // Get landmark name from the API response or calculate it here
    landmarkName: item.landmarkName || getLandmarkName(item.latitude, item.longitude),
  }));

  // Expanded row render to show clock-out history and worklog details
  const expandedRowRender = (record: any) => {
    const historyColumns = [
      {
        title: "Clock Out",
        dataIndex: "clockOut",
        key: "clockOut",
      },
      {
        title: "Remark",
        dataIndex: "remark",
        key: "remark",
        render: (text: string) => text || "N/A",
      },
      {
        title: "Action",
        key: "action",
        render: (_: any, historyItem: any) => {
          // Check if we have valid latitude and longitude
          const hasLocation = historyItem.latitude && historyItem.longitude && 
                             historyItem.latitude !== 'null' && historyItem.longitude !== 'null';
          
          if (!hasLocation) {
            return <span style={{ color: '#999' }}>No location</span>;
          }

          return (
            <Tooltip title="View Clock-out Location on Map">
              <Button
                type="primary"
                icon={<EnvironmentOutlined />}
                onClick={() => openLocationInMap(historyItem.latitude, historyItem.longitude)}
                size="small"
              />
            </Tooltip>
          );
        },
      },
    ];

    const worklogColumns = [
      {
        title: "Task",
        dataIndex: ["task", "name"],
        key: "taskName",
        render: (_: string, worklog: any) => worklog.task?.name || "N/A",
      },
      {
        title: "Start Time",
        dataIndex: "startTime",
        key: "startTime",
        render: (text: string) => moment(text).format("HH:mm:ss a"),
      },
      {
        title: "End Time",
        dataIndex: "endTime",
        key: "endTime",
        render: (text: string) => moment(text).format("HH:mm:ss a"),
      },
      {
        title: "Duration",
        key: "worklogDuration",
        render: (_: any, worklog: any) => {
          const start = moment(worklog.startTime);
          const end = moment(worklog.endTime);
          const duration = moment.duration(end.diff(start));
          const hours = Math.floor(duration.asHours());
          const minutes = duration.minutes();
          return `${hours}h ${minutes}m`;
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: string) => {
          const colors: { [key: string]: string } = {
            requested: '#1890ff',
            approved: '#52c41a',
            rejected: '#ff4d4f'
          };
          return (
            <span style={{ color: colors[status] || '#666' }}>
              {status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}
            </span>
          );
        },
      },
    ];

    // Add landmark name to history items
    const updatedHistory = record.history?.map((item: any) => ({
      ...item,
      landmarkName: item.landmarkName || getLandmarkName(item.latitude, item.longitude),
    }));

    // Get all worklogs for display
    const allWorklogs = record.worklogs ? [
      ...(record.worklogs.requested?.items || []),
      ...(record.worklogs.approved?.items || []),
      ...(record.worklogs.rejected?.items || [])
    ] : [];

    return (
      <div>
        {updatedHistory && updatedHistory.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4>Clock-out History</h4>
            <Table
              columns={historyColumns}
              dataSource={updatedHistory}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </div>
        )}
        
        {allWorklogs && allWorklogs.length > 0 && (
          <div>
            <h4>Worklog Details</h4>
            <Table
              columns={worklogColumns}
              dataSource={allWorklogs}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </div>
        )}
        
        {(!updatedHistory || updatedHistory.length === 0) && (!allWorklogs || allWorklogs.length === 0) && (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            No additional details available
          </div>
        )}
      </div>
    );
  };

  const renderAttendenceCard = (record: any) => {
    const duration = calculateDuration(record.clockIn, record.clockOut);
    const isClockedIn = !!record.clockIn && !record.clockOut;

    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-2">
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {record.user?.name || record.date}
            </div>
            {record.user?.name && (
              <div className="text-xs text-gray-500">{record.date}</div>
            )}
          </div>
          <Tag color={isClockedIn ? "green" : record.clockOut ? "blue" : "default"}>
            {isClockedIn ? "Working" : record.clockOut ? "Completed" : "Inactive"}
          </Tag>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs py-1">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500 block">Clock In</span>
            <span className="font-medium text-gray-800">{record.clockIn || "-"}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500 block">Clock Out</span>
            <span className="font-medium text-gray-800">{record.clockOut || (isClockedIn ? "Active now" : "-")}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-600 pt-1">
          <span>Duration: <strong className="text-gray-900">{duration}</strong></span>
          {record.overtime && <span>OT: <strong className="text-blue-600">{record.overtime}</strong></span>}
        </div>

        {record.inLocation && (
          <div className="text-xs text-gray-500 flex items-center gap-1 pt-1 border-t border-gray-100">
            <EnvironmentOutlined className="text-blue-500" />
            <span className="truncate">{record.inLocation}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card-container">
      <ResponsiveTable
        tableProps={{
          loading: isPending,
          dataSource: updatedAttendence,
          columns: columns,
          size: "middle",
          rowKey: "id",
          bordered: true,
          expandable: {
            expandedRowRender,
            rowExpandable: (record: any) => record.history && record.history.length > 0,
          },
          onChange: handleTableChange,
          pagination: {
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [5, 10, 20, 50],
            showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} items`,
          },
        }}
        renderMobileCard={renderAttendenceCard}
      />
    </div>
  );
};

export default AttendenceTable;
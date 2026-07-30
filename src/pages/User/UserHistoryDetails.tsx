import React, { useState } from "react";
import { 
  Card, 
  Table, 
  DatePicker, 
  Select, 
  Typography, 
  Space, 
  Tag, 
  Divider, 
  Button, 
  Timeline, 
  Tooltip, 
  Badge, 
  Tabs, 
  Empty, 
  Drawer, 
  Alert,
  Row,
  Col,
  Breadcrumb,
  Avatar,
  Segmented
} from "antd";
import { 
  DownloadOutlined, 
  HistoryOutlined, 
  UserOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  FilterOutlined,
  TableOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { useUserHistory, UserHistoryItem, HistoryActionType } from "@/hooks/user/useUserHistory";
import { useUserDetails } from "@/hooks/user/useUserDetails";
import { useParams, useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Map for human-readable action type labels
const actionTypeLabels: Record<HistoryActionType, string> = {
  [HistoryActionType.ROLE_CHANGE]: "Role Change",
  [HistoryActionType.PROFILE_UPDATE]: "Profile Update",
  [HistoryActionType.DEPARTMENT_CHANGE]: "Department Change",
  [HistoryActionType.LEAVE_BALANCE_UPDATE]: "Leave Balance Update",
  [HistoryActionType.CONTRACT_UPDATE]: "Contract Update",
  [HistoryActionType.STATUS_CHANGE]: "Status Change",
  [HistoryActionType.VERIFICATION]: "Verification",
  [HistoryActionType.OTHER]: "Other"
};

// Map for action type colors
const actionTypeColors: Record<HistoryActionType, string> = {
  [HistoryActionType.ROLE_CHANGE]: "blue",
  [HistoryActionType.PROFILE_UPDATE]: "green",
  [HistoryActionType.DEPARTMENT_CHANGE]: "orange",
  [HistoryActionType.LEAVE_BALANCE_UPDATE]: "purple",
  [HistoryActionType.CONTRACT_UPDATE]: "cyan",
  [HistoryActionType.STATUS_CHANGE]: "red",
  [HistoryActionType.VERIFICATION]: "geekblue",
  [HistoryActionType.OTHER]: "default"
};

const UserHistoryDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedActionTypes, setSelectedActionTypes] = useState<HistoryActionType[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UserHistoryItem | null>(null);

  // Format query parameters for the API call
  const queryParams = {
    actionType: selectedActionTypes.length > 0 ? selectedActionTypes.join(',') : undefined,
    startDate: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
    endDate: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
  };

  // Fetch history data
  const { data: historyData = [], isLoading } = useUserHistory(id, queryParams);
  // Fetch user details for banner
  const { data: userData, isLoading: userLoading } = useUserDetails(id);

  // Handle date range change
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setDateRange(dates);
  };

  // Handle action type selection change
  const handleActionTypeChange = (values: HistoryActionType[]) => {
    setSelectedActionTypes(values);
  };

  // Handle record click for details drawer
  const handleRecordClick = (record: UserHistoryItem) => {
    setSelectedRecord(record);
    setDetailDrawerOpen(true);
  };

  // Render concise change summary inside table
  const renderChangeSummary = (record: UserHistoryItem) => {
    const oldVal = record.oldValue || '';
    const newVal = record.newValue || '';

    if (!oldVal && !newVal) return <Text type="secondary">No value change recorded</Text>;
    if (!oldVal) return <Tag color="green">Added: {newVal.length > 30 ? `${newVal.slice(0, 30)}...` : newVal}</Tag>;
    if (!newVal) return <Tag color="red">Removed: {oldVal.length > 30 ? `${oldVal.slice(0, 30)}...` : oldVal}</Tag>;

    try {
      const oldObj = JSON.parse(oldVal);
      const newObj = JSON.parse(newVal);
      const changedKeys = Object.keys({ ...oldObj, ...newObj }).filter(
        (key) => JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])
      );
      
      return (
        <Space size="small" wrap>
          <Tag color="blue">{changedKeys.length} field(s) modified</Tag>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            ({changedKeys.slice(0, 2).join(", ")}{changedKeys.length > 2 ? "..." : ""})
          </Text>
        </Space>
      );
    } catch {
      return (
        <Text style={{ fontSize: "13px" }} ellipsis={{ tooltip: true }}>
          <span style={{ color: "#cf1322", textDecoration: "line-through", marginRight: 6 }}>{oldVal}</span>
          →
          <span style={{ color: "#389e0d", marginLeft: 6 }}>{newVal}</span>
        </Text>
      );
    }
  };

  // Format value changes inside detail drawer
  const formatValueChanges = (oldValue: string, newValue: string) => {
    if (!oldValue && !newValue) return <Text type="secondary">(No changes recorded)</Text>;
    if (!oldValue) return <div style={{ color: "#389e0d", background: "#f6ffed", padding: 12, borderRadius: 6 }}>{newValue} <Tag color="green" style={{ marginLeft: 8 }}>Added</Tag></div>;
    if (!newValue) return <div style={{ color: "#cf1322", background: "#fff1f0", padding: 12, borderRadius: 6 }}>{oldValue} <Tag color="red" style={{ marginLeft: 8 }}>Removed</Tag></div>;
    
    try {
      const oldObj = JSON.parse(oldValue);
      const newObj = JSON.parse(newValue);
      
      return (
        <Tabs 
          type="card" 
          size="small" 
          items={[
            {
              key: 'comparison',
              label: 'Changes Diff',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {Object.keys({...oldObj, ...newObj}).map(key => {
                    if (!(key in newObj)) {
                      return (
                        <div key={key} style={{ background: '#fff1f0', padding: '6px 12px', borderRadius: 4 }}>
                          <Tag color="red">Removed</Tag> <strong>{key}:</strong> {JSON.stringify(oldObj[key])}
                        </div>
                      );
                    }
                    if (!(key in oldObj)) {
                      return (
                        <div key={key} style={{ background: '#f6ffed', padding: '6px 12px', borderRadius: 4 }}>
                          <Tag color="green">Added</Tag> <strong>{key}:</strong> {JSON.stringify(newObj[key])}
                        </div>
                      );
                    }
                    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
                      return (
                        <div key={key} style={{ background: '#e6f4ff', padding: '8px 12px', borderRadius: 6, border: '1px solid #91caff' }}>
                          <Tag color="blue" style={{ marginBottom: 4 }}>Modified: {key}</Tag>
                          <div style={{ paddingLeft: 8, fontSize: '13px' }}>
                            <div style={{ color: '#cf1322' }}>- {JSON.stringify(oldObj[key])}</div>
                            <div style={{ color: '#389e0d' }}>+ {JSON.stringify(newObj[key])}</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </Space>
              )
            },
            {
              key: 'before',
              label: 'Original State',
              children: (
                <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 6, maxHeight: 300, overflow: 'auto', fontSize: '12px' }}>
                  {JSON.stringify(oldObj, null, 2)}
                </pre>
              )
            },
            {
              key: 'after',
              label: 'Updated State',
              children: (
                <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 6, maxHeight: 300, overflow: 'auto', fontSize: '12px' }}>
                  {JSON.stringify(newObj, null, 2)}
                </pre>
              )
            }
          ]} 
        />
      );
    } catch {
      return (
        <div>
          {oldValue === newValue ? (
            <div>
              <span>{oldValue}</span>
              <Tag color="default" style={{ marginLeft: 8 }}>Unchanged</Tag>
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ background: '#fff1f0', padding: 8, borderRadius: 6 }}>
                <Tag color="red">Old Value</Tag> {oldValue || '(empty)'}
              </div>
              <div style={{ background: '#f6ffed', padding: 8, borderRadius: 6 }}>
                <Tag color="green">New Value</Tag> {newValue || '(empty)'}
              </div>
            </Space>
          )}
        </div>
      );
    }
  };

  // Table columns definition
  const columns: ColumnsType<UserHistoryItem> = [
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (text: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: "#8c8c8c" }} />
          <span>{dayjs(text).format("YYYY-MM-DD HH:mm")}</span>
        </Space>
      ),
    },
    {
      title: "Action Type",
      dataIndex: "actionType",
      key: "actionType",
      width: 160,
      render: (text: HistoryActionType) => (
        <Tag color={actionTypeColors[text] || "default"} style={{ borderRadius: "4px", padding: "2px 8px" }}>
          {actionTypeLabels[text] || text}
        </Tag>
      ),
    },
    {
      title: "Field Target",
      dataIndex: "field",
      key: "field",
      width: 150,
      render: (text: string) => <Text strong style={{ color: "#334155" }}>{text || "General"}</Text>,
    },
    {
      title: "Change Preview",
      key: "changes",
      render: (_: unknown, record: UserHistoryItem) => renderChangeSummary(record),
    },
    {
      title: "Modified By",
      key: "modifiedBy",
      width: 160,
      render: (_: unknown, record: UserHistoryItem) => (
        <Space size={4}>
          <UserOutlined style={{ color: "#1677ff" }} />
          <span>{record.modifiedBy?.name || 'System'}</span>
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      align: "center",
      render: (_: unknown, record: UserHistoryItem) => (
        <Tooltip title="View full history details">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleRecordClick(record)}
            size="small"
          >
            Details
          </Button>
        </Tooltip>
      ),
    },
  ];

  // Group history by date for timeline
  const groupedByDate = historyData.reduce((acc: Record<string, UserHistoryItem[]>, item) => {
    const date = dayjs(item.createdAt).format('YYYY-MM-DD');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // CSV Export helper
  const exportToCSV = () => {
    if (!historyData.length) return;
    
    const csvHeader = 'Date,Time,Action,Field,Old Value,New Value,Modified By,Description\n';
    const csvRows = historyData.map(item => {
      const date = dayjs(item.createdAt).format('YYYY-MM-DD');
      const time = dayjs(item.createdAt).format('HH:mm:ss');
      const action = actionTypeLabels[item.actionType] || item.actionType;
      const field = item.field;
      const oldValue = `"${(item.oldValue || '').replace(/"/g, '""')}"`;
      const newValue = `"${(item.newValue || '').replace(/"/g, '""')}"`;
      const modifiedBy = item.modifiedBy?.name || 'System';
      const description = `"${(item.description || '').replace(/"/g, '""')}"`;
      
      return `${date},${time},${action},${field},${oldValue},${newValue},${modifiedBy},${description}`;
    }).join('\n');
    
    const blob = new Blob([csvContent = csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `user_history_${id}_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "0 4px 24px 4px" }}>
      {/* Top Navigation & Breadcrumbs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Breadcrumb
          items={[
            { title: <Link to="/users">Users</Link> },
            { title: <Link to={`/user/${id}`}>{userData?.name || "User Profile"}</Link> },
            { title: "Profile History" },
          ]}
        />
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/user/${id}`)}
        >
          Back to User Profile
        </Button>
      </div>

      {/* Header Banner */}
      <Card
        style={{
          borderRadius: "14px",
          marginBottom: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
        }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space size="middle" align="center">
              <Avatar 
                size={56} 
                icon={<HistoryOutlined />} 
                style={{ backgroundColor: "#0958d9", boxShadow: "0 4px 10px rgba(9,88,217,0.3)" }} 
              />
              <div>
                <Title level={3} style={{ margin: 0, color: "#1e293b" }}>
                  Profile History Log
                </Title>
                {userData && (
                  <Space size="small" style={{ marginTop: 4 }}>
                    <Text type="secondary">Audit trail for</Text>
                    <Text strong style={{ color: "#1677ff" }}>{userData.name}</Text>
                    <Tag color="blue">{userData.role?.name || "User"}</Tag>
                    <Text type="secondary">({userData.email})</Text>
                  </Space>
                )}
              </div>
            </Space>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <Space wrap>
              {historyData.length > 0 && (
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={exportToCSV}
                >
                  Export CSV
                </Button>
              )}
              <Segmented
                options={[
                  { value: 'table', icon: <TableOutlined /> },
                  { value: 'timeline', icon: <UnorderedListOutlined /> }
                ]}
                value={viewMode}
                onChange={(val) => setViewMode(val as 'table' | 'timeline')}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Total Events Logged</Text>
            <Title level={3} style={{ margin: "4px 0 0 0", color: "#1677ff" }}>{historyData.length}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Current Filtered Count</Text>
            <Title level={3} style={{ margin: "4px 0 0 0", color: "#52c41a" }}>{historyData.length}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Account Role</Text>
            <Title level={4} style={{ margin: "6px 0 0 0", color: "#722ed1" }} ellipsis>
              {userData?.role?.name || "N/A"}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Account Status</Text>
            <div style={{ marginTop: 6 }}>
              <Tag color={userData?.status === 'active' ? 'green' : 'red'} style={{ textTransform: 'capitalize' }}>
                {userData?.status || 'Unknown'}
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter Toolbar */}
      <Card 
        size="small" 
        style={{ borderRadius: "12px", marginBottom: 20, border: "1px solid #e2e8f0" }}
        bodyStyle={{ padding: "16px" }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={10}>
            <Space style={{ width: "100%" }} direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12, color: "#64748b" }}>Filter by Date Range:</Text>
              <RangePicker 
                onChange={handleDateRangeChange} 
                style={{ width: "100%" }} 
                allowClear 
              />
            </Space>
          </Col>

          <Col xs={24} md={14}>
            <Space style={{ width: "100%" }} direction="vertical" size={4}>
              <Text strong style={{ fontSize: 12, color: "#64748b" }}>Filter by Action Type:</Text>
              <Select
                mode="multiple"
                placeholder="All Action Types"
                style={{ width: "100%" }}
                onChange={handleActionTypeChange}
                allowClear
                maxTagCount="responsive"
              >
                {Object.entries(actionTypeLabels).map(([value, label]) => (
                  <Select.Option key={value} value={value}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Content Area */}
      <Card
        style={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
        bodyStyle={{ padding: viewMode === 'table' ? "0px" : "24px" }}
      >
        {isLoading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <Text type="secondary">Loading history logs...</Text>
          </div>
        ) : historyData.length === 0 ? (
          <div style={{ padding: "40px 0" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No profile history records found matching your filters"
            />
          </div>
        ) : viewMode === 'table' ? (
          <Table
            columns={columns}
            dataSource={historyData}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Total ${total} history entries`,
            }}
            size="middle"
          />
        ) : (
          <div style={{ padding: "12px 16px" }}>
            <Timeline
              mode="left"
              items={Object.entries(groupedByDate).map(([date, items]) => {
                const formattedDate = dayjs(date).format('MMM DD, YYYY');
                return {
                  children: (
                    <div key={date} style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 16, color: "#1e293b" }}>{formattedDate}</Text>
                        <Badge count={items.length} style={{ backgroundColor: "#1677ff" }} />
                      </div>

                      {items.map((item) => (
                        <Card
                          key={item.id}
                          size="small"
                          hoverable
                          onClick={() => handleRecordClick(item)}
                          style={{
                            marginBottom: 12,
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Space>
                              <Tag color={actionTypeColors[item.actionType]}>
                                {actionTypeLabels[item.actionType]}
                              </Tag>
                              <Text strong style={{ color: "#334155" }}>{item.field}</Text>
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(item.createdAt).format('HH:mm:ss')}
                            </Text>
                          </div>

                          <div style={{ marginBottom: 8 }}>
                            {renderChangeSummary(item)}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#64748b" }}>
                            <span>Modified by: <strong>{item.modifiedBy?.name || 'System'}</strong></span>
                            <Button type="link" size="small" icon={<EyeOutlined />}>View Details</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                };
              })}
            />
          </div>
        )}
      </Card>

      {/* History Inspection Drawer */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined style={{ color: "#1677ff" }} />
            <span>Activity Record Inspection</span>
          </Space>
        }
        placement="right"
        onClose={() => setDetailDrawerOpen(false)}
        open={detailDrawerOpen}
        width={580}
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Tag color={actionTypeColors[selectedRecord.actionType]} style={{ fontSize: "14px", padding: "4px 12px" }}>
                {actionTypeLabels[selectedRecord.actionType]}
              </Tag>
              <div style={{ marginTop: 12, fontSize: 14 }}>
                <Text type="secondary">Timestamp: </Text>
                <Text strong>{dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
              </div>
            </div>

            <Divider orientation="left">Record Information</Divider>

            <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Target Field">{selectedRecord.field}</Descriptions.Item>
              <Descriptions.Item label="Action Performed">{actionTypeLabels[selectedRecord.actionType]}</Descriptions.Item>
              <Descriptions.Item label="Modified By">{selectedRecord.modifiedBy?.name || 'System'}</Descriptions.Item>
              {selectedRecord.description && (
                <Descriptions.Item label="Description">{selectedRecord.description}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">Value Audit Diff</Divider>

            <div>
              {formatValueChanges(selectedRecord.oldValue, selectedRecord.newValue)}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UserHistoryDetails;
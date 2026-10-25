import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Checkbox, 
  Button, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Alert, 
  Tag, 
  Divider, 
  Table, 
  Tabs, 
  Switch, 
  Statistic, 
  message, 
  Radio 
} from 'antd';
import { 
  BellOutlined, 
  SendOutlined, 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined, 
  MobileOutlined, 
  DesktopOutlined,
  UserOutlined,
  ReloadOutlined,
  GlobalOutlined,
  LaptopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NotificationType } from '@/types/notification';
import { 
  sendCustomTestNotificationApi, 
  sendTestPushNotification, 
  fetchPushSubscribers,
  fetchUsersForTarget 
} from '@/service/notification.service';
import { listActiveUsers } from '@/service/user.service';
import { useWebPushNotifications } from '@/hooks/useWebPushNotifications';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

function parseUserAgent(ua?: string): string {
  if (!ua) return 'Web Browser';
  let browser = 'Browser';
  if (ua.includes('Brave')) browser = 'Brave';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  let os = 'Device';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

const NotificationSetting: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('sender');
  const [filterPushOnly, setFilterPushOnly] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');

  // 1. Fetch targeted users (includes devices count and device list per user)
  const { 
    data: targetUsersData, 
    isLoading: usersLoading,
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ['notification-target-users'],
    queryFn: async () => {
      try {
        const res = await fetchUsersForTarget();
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {}

      // Fallback to listActiveUsers
      try {
        const fallback = await listActiveUsers();
        if (Array.isArray(fallback)) return fallback;
      } catch (e) {}

      return [];
    },
    staleTime: 10000,
  });

  // 2. Fetch full push subscribers
  const { 
    data: subscriberData, 
    isLoading: subscribersLoading, 
    refetch: refetchSubscribers 
  } = useQuery({
    queryKey: ['push-subscribers'],
    queryFn: fetchPushSubscribers,
    refetchInterval: 30000,
  });

  const rawUsers = targetUsersData || [];
  const subscribers = subscriberData?.subscribers || [];
  const allDevices = subscriberData?.devices || [];

  // Map of userId -> subscriber info (with push devices)
  const subscriberMap = useMemo(() => {
    const map = new Map<string, any>();
    // First fill from subscribers
    for (const sub of subscribers) {
      map.set(sub.userId, sub);
    }
    // Also supplement from rawUsers if devices exist
    for (const u of rawUsers) {
      if (u.devices && u.devices.length > 0 && !map.has(u.id)) {
        map.set(u.id, {
          userId: u.id,
          name: u.name,
          email: u.email,
          deviceCount: u.devices.length,
          devices: u.devices,
        });
      }
    }
    return map;
  }, [subscribers, rawUsers]);

  // Combine and deduplicate users list
  const userList = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    for (const u of rawUsers) {
      if (u.id && !seen.has(u.id)) {
        seen.add(u.id);
        const sub = subscriberMap.get(u.id);
        list.push({
          ...u,
          deviceCount: sub ? sub.deviceCount : (u.deviceCount || 0),
          devices: sub ? sub.devices : (u.devices || []),
        });
      }
    }

    // Include any subscriber not in rawUsers
    for (const sub of subscribers) {
      if (sub.userId && !seen.has(sub.userId)) {
        seen.add(sub.userId);
        list.push({
          id: sub.userId,
          name: sub.name,
          email: sub.email,
          deviceCount: sub.deviceCount,
          devices: sub.devices || [],
        });
      }
    }

    return list;
  }, [rawUsers, subscribers, subscriberMap]);

  // Filter users based on Push-Only switch
  const displayUsers = useMemo(() => {
    if (filterPushOnly) {
      return userList.filter((u) => u.deviceCount > 0);
    }
    return userList;
  }, [userList, filterPushOnly]);

  // Find currently selected user object
  const selectedUser = useMemo(() => {
    return userList.find((u) => u.id === selectedUserId) || null;
  }, [userList, selectedUserId]);

  const { isPushSubscribed } = useWebPushNotifications();
  const currentUserId = localStorage.getItem('userId') || '';

  const handleSendNotification = async (values: any) => {
    setSending(true);
    setLastResult(null);
    try {
      const res = await sendCustomTestNotificationApi({
        userId: values.userId,
        title: values.title || '🔔 Test Notification',
        message: values.message,
        type: values.type || NotificationType.GENERAL,
        link: values.link || '/notifications',
        sendPush: values.sendPush !== false,
        sendInApp: values.sendInApp !== false,
        deviceId: selectedDeviceId !== 'all' ? selectedDeviceId : undefined,
      });

      setLastResult(res);
      message.success('Test notification dispatched successfully!');
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to dispatch notification.');
    } finally {
      setSending(false);
    }
  };

  const handleQuickTestUser = async (targetUserId: string, targetName: string, deviceId?: string) => {
    setSending(true);
    try {
      const res = await sendCustomTestNotificationApi({
        userId: targetUserId,
        title: '🔔 Test Notification',
        message: 'This is a test notification from Artha Admin Settings.',
        type: NotificationType.GENERAL,
        link: '/notifications',
        sendPush: true,
        sendInApp: true,
        deviceId: deviceId,
      });
      if (res.success) {
        message.success(`Test push notification sent to ${targetName}!`);
      } else {
        message.warning(res.message || `Could not deliver push to ${targetName}.`);
      }
    } catch (err: any) {
      message.error(`Failed to send test push to ${targetName}.`);
    } finally {
      setSending(false);
    }
  };

  const handleSendSelfTest = async () => {
    if (!currentUserId) {
      message.warning('User ID not found in session.');
      return;
    }
    await handleQuickTestUser(currentUserId, 'your browser');
  };

  // Table columns for Subscribers
  const subscriberColumns = [
    {
      title: 'User',
      key: 'name',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1f2937' }}>{record.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Active Devices',
      key: 'deviceCount',
      width: 140,
      render: (_: any, record: any) => (
        <Tag color="blue" icon={<DesktopOutlined />}>
          {record.deviceCount} {record.deviceCount === 1 ? 'Device' : 'Devices'}
        </Tag>
      ),
    },
    {
      title: 'Device & Platform Details',
      key: 'devices',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {record.devices?.map((d: any, idx: number) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Space size={6}>
                <LaptopOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>
                  Device #{idx + 1}: {parseUserAgent(d.userAgent)}
                </span>
              </Space>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, fontSize: 11, color: '#1677ff', height: 'auto' }}
                onClick={() => handleQuickTestUser(record.userId, `${record.name} (${parseUserAgent(d.userAgent)})`, d.id)}
              >
                Send Test
              </Button>
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: 'Last Updated',
      key: 'updatedAt',
      width: 170,
      render: (_: any, record: any) => (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {record.devices?.[0]?.updatedAt 
            ? new Date(record.devices[0].updatedAt).toLocaleString() 
            : 'Recently'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          ghost
          icon={<SendOutlined />}
          onClick={() => {
            form.setFieldsValue({ userId: record.userId });
            setSelectedUserId(record.userId);
            setSelectedDeviceId('all');
            setActiveTab('sender');
          }}
        >
          Target User
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 w-full" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/settings')}
            style={{ borderRadius: 6 }}
          >
            Back to Settings
          </Button>
          <div>
            <Title level={3} style={{ margin: 0 }}>Notification Settings & Testing</Title>
            <Text type="secondary">
              List push-enabled devices, target specific users & devices, and send custom test notifications.
            </Text>
          </div>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            refetchUsers();
            refetchSubscribers();
          }}
          loading={usersLoading || subscribersLoading}
        >
          Refresh Devices
        </Button>
      </div>

      {/* Top Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 8, background: '#ffffff', borderColor: '#e5e7eb' }}>
            <Statistic
              title={<span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Active Push Subscribers</span>}
              value={subscribers.length}
              suffix={`/ ${userList.length} users`}
              prefix={<UserOutlined style={{ color: '#1677ff', marginRight: 6 }} />}
              valueStyle={{ color: '#111827', fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 8, background: '#ffffff', borderColor: '#e5e7eb' }}>
            <Statistic
              title={<span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Registered Push Devices</span>}
              value={allDevices.length}
              suffix="devices total"
              prefix={<DesktopOutlined style={{ color: '#1677ff', marginRight: 6 }} />}
              valueStyle={{ color: '#111827', fontWeight: 600 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 8, background: '#ffffff', borderColor: '#e5e7eb' }}>
            <Statistic
              title={<span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Push Delivery Engine</span>}
              value="VAPID Standard"
              prefix={<GlobalOutlined style={{ color: '#1677ff', marginRight: 6 }} />}
              valueStyle={{ color: '#111827', fontSize: '18px', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: 'sender',
            label: (
              <Space>
                <SendOutlined />
                <span>Send Test Notification</span>
              </Space>
            ),
            children: (
              <Row gutter={[16, 16]}>
                {/* Left Column: Form */}
                <Col xs={24} lg={16}>
                  <Card 
                    title={
                      <Space>
                        <SendOutlined style={{ color: '#1677ff' }} />
                        <span>Dispatch Custom Notification</span>
                      </Space>
                    }
                    bordered
                    style={{ borderRadius: 8 }}
                  >
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSendNotification}
                      initialValues={{
                        title: '🔔 Test Notification from Artha',
                        message: 'Hello! This is a test notification sent from Artha Settings.',
                        type: NotificationType.GENERAL,
                        link: '/notifications',
                        sendPush: true,
                        sendInApp: true,
                      }}
                    >
                      {/* User Selection Header with Push-Filter Toggle */}
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                          Target Recipient <span style={{ color: '#ff4d4f' }}>*</span>
                        </span>
                        <Space size={6}>
                          <span style={{ fontSize: 12, color: '#595959' }}>Show push-enabled only:</span>
                          <Switch
                            size="small"
                            checked={filterPushOnly}
                            onChange={setFilterPushOnly}
                          />
                        </Space>
                      </div>

                      <Form.Item
                        name="userId"
                        rules={[{ required: true, message: 'Please select a recipient user.' }]}
                        style={{ marginBottom: 12 }}
                      >
                        <Select
                          showSearch
                          placeholder="Select user by name or email"
                          loading={usersLoading || subscribersLoading}
                          value={selectedUserId}
                          onChange={(val) => {
                            setSelectedUserId(val);
                            setSelectedDeviceId('all');
                          }}
                          filterOption={(input, option) =>
                            ((option?.label ?? '') as string).toLowerCase().includes(input.toLowerCase())
                          }
                          options={displayUsers.map((u: any) => {
                            const count = u.deviceCount || 0;
                            const badge = count > 0 
                              ? `[${count} Push ${count === 1 ? 'Device' : 'Devices'}]` 
                              : `[In-App Only]`;
                            return {
                              value: u.id,
                              label: `${badge} ${u.name || u.email} (${u.email})`,
                            };
                          })}
                        />
                      </Form.Item>

                      {/* Dynamic user status & Multi-Device Target Selector */}
                      {selectedUser && (
                        <div style={{ marginBottom: 16 }}>
                          {selectedUser.deviceCount > 0 ? (
                            <Alert
                              type="success"
                              showIcon
                              message={
                                <div style={{ fontSize: 13 }}>
                                  <b>Push Ready:</b> {selectedUser.name} has <b>{selectedUser.deviceCount}</b> registered background device(s).
                                </div>
                              }
                              description={
                                selectedUser.devices && selectedUser.devices.length > 1 ? (
                                  <div style={{ marginTop: 8 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1f2937' }}>
                                      Select Target Device:
                                    </div>
                                    <Radio.Group 
                                      value={selectedDeviceId} 
                                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                                      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                                    >
                                      <Radio value="all">
                                        <span style={{ fontWeight: 500 }}>All Devices ({selectedUser.deviceCount})</span>
                                        <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>Broadcasts to all computers/browsers</span>
                                      </Radio>
                                      {selectedUser.devices.map((d: any, idx: number) => (
                                        <Radio key={d.id} value={d.id}>
                                          <Space size={6}>
                                            <Tag color="blue" style={{ fontSize: 11 }}>
                                              Device #{idx + 1}: {parseUserAgent(d.userAgent)}
                                            </Tag>
                                            <span style={{ fontSize: 11, color: '#6b7280' }}>
                                              (ID: {d.id.substring(0, 8)}...)
                                            </span>
                                          </Space>
                                        </Radio>
                                      ))}
                                    </Radio.Group>
                                  </div>
                                ) : (
                                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: '#595959' }}>Device:</span>
                                    <Tag color="blue" style={{ fontSize: 11 }}>
                                      {parseUserAgent(selectedUser.devices?.[0]?.userAgent)}
                                    </Tag>
                                  </div>
                                )
                              }
                            />
                          ) : (
                            <Alert
                              type="info"
                              showIcon
                              message={
                                <div style={{ fontSize: 12 }}>
                                  <b>In-App Only:</b> This user has not enabled push in their browser yet. The notification will be saved to their bell drawer and delivered to active tabs, but will not show an OS desktop alert if Artha is closed.
                                </div>
                              }
                            />
                          )}
                        </div>
                      )}

                      <Form.Item
                        name="title"
                        label={<span style={{ fontWeight: 600 }}>Notification Title</span>}
                        rules={[{ required: true, message: 'Please enter a title.' }]}
                      >
                        <Input placeholder="e.g. 🔔 Meeting Reminder" />
                      </Form.Item>

                      <Form.Item
                        name="message"
                        label={<span style={{ fontWeight: 600 }}>Notification Message</span>}
                        rules={[{ required: true, message: 'Please enter the message text.' }]}
                      >
                        <TextArea 
                          rows={3} 
                          placeholder="Type the message you want to display on screen..." 
                        />
                      </Form.Item>

                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            name="type"
                            label={<span style={{ fontWeight: 600 }}>Notification Category</span>}
                          >
                            <Select>
                              <Select.Option value={NotificationType.GENERAL}>General</Select.Option>
                              <Select.Option value={NotificationType.TASK}>Task</Select.Option>
                              <Select.Option value={NotificationType.PROJECT}>Project</Select.Option>
                              <Select.Option value={NotificationType.WORKLOG}>Worklog</Select.Option>
                              <Select.Option value={NotificationType.MEETING}>Meeting</Select.Option>
                              <Select.Option value={NotificationType.NOTICEBOARD}>Notice Board</Select.Option>
                              <Select.Option value={NotificationType.SYSTEM}>System</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="link"
                            label={<span style={{ fontWeight: 600 }}>Click Action Route</span>}
                          >
                            <Input placeholder="e.g. /tasks or /notifications" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label={<span style={{ fontWeight: 600 }}>Delivery Channels</span>}>
                        <Space direction="vertical">
                          <Form.Item name="sendPush" valuePropName="checked" noStyle>
                            <Checkbox defaultChecked>
                              <Space>
                                <DesktopOutlined style={{ color: '#1677ff' }} />
                                <span><b>Background Web Push</b> (OS alert even when browser is closed)</span>
                              </Space>
                            </Checkbox>
                          </Form.Item>
                          <div style={{ marginTop: 6 }}>
                            <Form.Item name="sendInApp" valuePropName="checked" noStyle>
                              <Checkbox defaultChecked>
                                <Space>
                                  <BellOutlined style={{ color: '#1677ff' }} />
                                  <span><b>In-App Notification</b> (Saved to database + real-time Socket.io bell notification)</span>
                                </Space>
                              </Checkbox>
                            </Form.Item>
                          </div>
                        </Space>
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={sending}
                        style={{ width: '100%', height: 40, borderRadius: 6, fontWeight: 600 }}
                      >
                        Send Test Notification
                      </Button>
                    </Form>

                    {/* Result display */}
                    {lastResult && (
                      <div style={{ marginTop: 16 }}>
                        <Alert
                          type={lastResult.success ? 'success' : 'warning'}
                          showIcon
                          message={lastResult.message}
                          description={
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                              <div><b>In-App Delivery:</b> {lastResult.inAppCreated ? 'Created & Dispatched ✅' : 'Skipped ⚪'}</div>
                              <div>
                                <b>Push Delivery:</b>{' '}
                                {lastResult.pushDevicesCount > 0 ? (
                                  <Tag color="blue">{lastResult.pushDevicesCount} Device(s) Reached</Tag>
                                ) : (
                                  <Tag color="default">0 devices (User has not enabled background push in browser yet)</Tag>
                                )}
                              </div>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </Card>
                </Col>

                {/* Right Column: Quick Status & Self Test */}
                <Col xs={24} lg={8}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {/* Quick Self Test */}
                    <Card 
                      title={
                        <Space>
                          <MobileOutlined style={{ color: '#1677ff' }} />
                          <span>My Device Push Status</span>
                        </Space>
                      }
                      bordered
                      style={{ borderRadius: 8 }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Status on this browser:
                        </Text>
                        <div style={{ marginTop: 6 }}>
                          {isPushSubscribed ? (
                            <Tag color="blue" icon={<CheckCircleOutlined />}>
                              Background Alerts Active
                            </Tag>
                          ) : (
                            <Tag color="default">Notifications Not Active</Tag>
                          )}
                        </div>
                      </div>

                      <Paragraph style={{ fontSize: 12, color: '#595959' }}>
                        Trigger a test notification to verify your current browser can receive OS alerts:
                      </Paragraph>

                      <Button
                        type="default"
                        icon={<BellOutlined />}
                        onClick={handleSendSelfTest}
                        loading={sending}
                        style={{ width: '100%', borderRadius: 6 }}
                      >
                        Send Test to My Browser
                      </Button>
                    </Card>

                    {/* Info */}
                    <Card 
                      title={
                        <Space>
                          <InfoCircleOutlined style={{ color: '#1677ff' }} />
                          <span>Push Delivery Notes</span>
                        </Space>
                      }
                      bordered
                      style={{ borderRadius: 8 }}
                    >
                      <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: '#595959', lineHeight: 1.8 }}>
                        <li><b>Target Specific Device:</b> If a user has multiple registered devices (e.g. PC and phone), you can target a single device or broadcast to all.</li>
                        <li><b>Offline Delivery:</b> Once enabled, the browser does not need to be open to receive alerts.</li>
                        <li><b>Brave Users:</b> Require Google push services enabled in <code>brave://settings/privacy</code>.</li>
                      </ul>
                    </Card>
                  </Space>
                </Col>
              </Row>
            ),
          },
          {
            key: 'subscribers',
            label: (
              <Space>
                <DesktopOutlined />
                <span>Registered Push Users & Devices ({subscribers.length})</span>
              </Space>
            ),
            children: (
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span>Users with Active Push Subscriptions</span>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Total Devices: <b>{allDevices.length}</b> across <b>{subscribers.length}</b> users
                    </Text>
                  </div>
                }
                bordered
                style={{ borderRadius: 8 }}
              >
                <Table
                  dataSource={subscribers}
                  columns={subscriberColumns}
                  rowKey="userId"
                  loading={subscribersLoading}
                  pagination={{ pageSize: 10 }}
                  locale={{
                    emptyText: (
                      <div style={{ padding: '24px 0', textAlign: 'center' }}>
                        <DesktopOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 8 }} />
                        <div>No users have enabled background push notifications yet.</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                          Team members will appear here as soon as they click &quot;Enable&quot; in their Notifications drawer.
                        </div>
                      </div>
                    ),
                  }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default NotificationSetting;

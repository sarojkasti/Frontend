import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  Select,
  InputNumber,
  message,
  Space,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
  Modal,
  Tag,
  Tabs,
  Table,
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  SwapOutlined,
  PlusOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  allocateLeaveToUser,
  allocateLeaveToAllUsers,
  carryOverLeave,
  fetchUserLeaveLedger,
} from '../../service/leave.service';
import { useActiveLeaveTypes } from '../../hooks/useLeaveTypes';
import { fetchUsers } from '../../service/user.service';
import type { LeaveBalanceLedgerItem } from '../../types/leave';
import moment from 'moment';

const { Title, Text } = Typography;

const actionTagMeta: Record<string, { color: string; label: string }> = {
  ALLOCATION: { color: 'blue', label: 'Allocation' },
  MANUAL_ADJUSTMENT: { color: 'cyan', label: 'Adjustment' },
  LEAVE_RESERVATION: { color: 'gold', label: 'Reservation (Hold)' },
  LEAVE_CONSUMPTION: { color: 'red', label: 'Consumption (Used)' },
  LEAVE_CANCELLATION: { color: 'orange', label: 'Cancellation' },
  LEAVE_REJECTION: { color: 'volcano', label: 'Rejection' },
  CARRY_OVER: { color: 'purple', label: 'Carry Over' },
};

const LeaveBalanceManagement: React.FC = () => {
  const [singleUserForm] = Form.useForm();
  const [allUsersForm] = Form.useForm();
  const [carryOverForm] = Form.useForm();
  const queryClient = useQueryClient();
  const currentYear = moment().year();

  const [users, setUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const { data: leaveTypes = [], isLoading: isLoadingLeaveTypes } = useActiveLeaveTypes();

  // Ledger state
  const [selectedLedgerUserId, setSelectedLedgerUserId] = useState<string | undefined>();
  const [selectedLedgerYear, setSelectedLedgerYear] = useState<number>(currentYear);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetchUsers({
        status: 'active',
        limit: 1000,
        page: 1,
        keywords: '',
      });
      if (response && response.results && Array.isArray(response.results)) {
        setUsers(response.results);
      } else if (Array.isArray(response)) {
        setUsers(response);
      } else {
        setUsers([]);
        message.error('Failed to parse user data');
      }
    } catch (error) {
      message.error('Failed to load users');
      setUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Ledger query
  const { data: ledgerEntries = [], isLoading: isLoadingLedger } = useQuery({
    queryKey: ['leave-ledger', selectedLedgerUserId, selectedLedgerYear],
    queryFn: () =>
      selectedLedgerUserId
        ? fetchUserLeaveLedger(selectedLedgerUserId, selectedLedgerYear)
        : Promise.resolve([]),
    enabled: !!selectedLedgerUserId,
  });

  const allocateSingleMutation = useMutation({
    mutationFn: allocateLeaveToUser,
    onSuccess: () => {
      message.success('Leave allocated successfully to user');
      singleUserForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-ledger'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to allocate leave');
    },
  });

  const allocateAllMutation = useMutation({
    mutationFn: allocateLeaveToAllUsers,
    onSuccess: () => {
      message.success('Leave allocated successfully to all active users');
      allUsersForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-ledger'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to allocate leave to all users');
    },
  });

  const carryOverMutation = useMutation({
    mutationFn: carryOverLeave,
    onSuccess: (data) => {
      Modal.success({
        title: 'Carry Over Completed',
        content: (
          <div>
            <p>Carry over process has been completed:</p>
            <ul>
              <li>Successful: {data.success}</li>
              <li>Failed: {data.failed}</li>
            </ul>
            {data.details && data.details.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Details:</Text>
                <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 8 }}>
                  {data.details.map((detail: any, index: number) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Tag
                        color={
                          detail.status === 'success'
                            ? 'green'
                            : detail.status === 'failed'
                            ? 'red'
                            : 'default'
                        }
                      >
                        {detail.status}
                      </Tag>
                      <Text>
                        {detail.userName} - {detail.leaveType}
                      </Text>
                      {detail.carriedOverDays && (
                        <Text type="secondary"> (+{detail.carriedOverDays} days)</Text>
                      )}
                      {detail.message && <Text type="secondary"> - {detail.message}</Text>}
                      {detail.error && <Text type="danger"> - {detail.error}</Text>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
        width: 600,
      });
      carryOverForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-ledger'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to carry over leave');
    },
  });

  const handleAllocateSingleUser = async (values: any) => {
    allocateSingleMutation.mutate({
      userId: values.userId,
      leaveTypeId: values.leaveTypeId,
      year: values.year,
      allocatedDays: values.allocatedDays,
      carriedOverDays: values.carriedOverDays || 0,
    });
  };

  const handleAllocateAllUsers = async (values: any) => {
    allocateAllMutation.mutate({
      leaveTypeId: values.leaveTypeId,
      year: values.year,
      allocatedDays: values.allocatedDays,
    });
  };

  const handleCarryOver = async (values: any) => {
    carryOverMutation.mutate({
      fromYear: values.fromYear,
      toYear: values.toYear,
    });
  };

  const ledgerColumns: ColumnsType<LeaveBalanceLedgerItem> = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => moment(d).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Leave Type',
      dataIndex: ['leaveType', 'name'],
      key: 'leaveType',
      render: (_: any, r: LeaveBalanceLedgerItem) => r.leaveType?.name || '—',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const meta = actionTagMeta[action] || { color: 'default', label: action };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Change',
      dataIndex: 'changeType',
      key: 'changeType',
      render: (type: string, r: LeaveBalanceLedgerItem) => {
        const sign = type === 'CREDIT' ? '+' : type === 'DEBIT' ? '-' : '';
        const color = type === 'CREDIT' ? 'green' : type === 'DEBIT' ? 'red' : 'gold';
        return (
          <Tag color={color}>
            {type} ({sign}
            {r.days})
          </Tag>
        );
      },
    },
    {
      title: 'Resulting Balance',
      dataIndex: 'resultingBalance',
      key: 'resultingBalance',
      render: (bal: number) => <b>{bal} days</b>,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (rem: string) => rem || '—',
    },
  ];

  if (isLoadingLeaveTypes || isUsersLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  const items = [
    {
      key: 'allocations',
      label: (
        <span>
          <UserOutlined /> Allocations & Rollover
        </span>
      ),
      children: (
        <>
          {/* Allocate to Single User */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Allocate Leave to Single User</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Alert
              message="Allocate leave balance to a specific user for a given year"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Form form={singleUserForm} layout="vertical" onFinish={handleAllocateSingleUser}>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="userId"
                    label="User"
                    rules={[{ required: true, message: 'Please select a user' }]}
                  >
                    <Select
                      placeholder="Select user"
                      showSearch
                      filterOption={(input, option: any) => {
                        const label = option?.children?.toString() || '';
                        return label.toLowerCase().includes(input.toLowerCase());
                      }}
                    >
                      {users.map((user: any) => (
                        <Select.Option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Form.Item
                    name="leaveTypeId"
                    label="Leave Type"
                    rules={[{ required: true, message: 'Please select leave type' }]}
                  >
                    <Select placeholder="Select leave type" showSearch optionFilterProp="children">
                      {leaveTypes.map((type: any) => (
                        <Select.Option key={type.id} value={type.id}>
                          {type.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Form.Item
                    name="year"
                    label="Year"
                    rules={[{ required: true, message: 'Please enter year' }]}
                    initialValue={currentYear}
                  >
                    <InputNumber min={2024} max={2050} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Form.Item
                    name="allocatedDays"
                    label="Allocated Days"
                    rules={[{ required: true, message: 'Please enter days' }]}
                  >
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Form.Item name="carriedOverDays" label="Carried Over (Optional)">
                    <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  loading={allocateSingleMutation.isPending}
                >
                  Allocate to User
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Allocate to All Users */}
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Allocate Leave to All Users</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Alert
              message="Allocate leave balance to all active users in the system"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Form form={allUsersForm} layout="inline" onFinish={handleAllocateAllUsers}>
              <Form.Item
                name="leaveTypeId"
                label="Leave Type"
                rules={[{ required: true, message: 'Please select leave type' }]}
              >
                <Select placeholder="Select leave type" style={{ width: 200 }}>
                  {leaveTypes.map((type: any) => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="year"
                label="Year"
                rules={[{ required: true, message: 'Please enter year' }]}
                initialValue={currentYear}
              >
                <InputNumber min={2024} max={2050} />
              </Form.Item>
              <Form.Item
                name="allocatedDays"
                label="Allocated Days"
                rules={[{ required: true, message: 'Please enter days' }]}
              >
                <InputNumber min={0} step={0.5} />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<TeamOutlined />}
                  loading={allocateAllMutation.isPending}
                  danger
                >
                  Allocate to All Users
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Carry Over Leave */}
          <Card
            title={
              <Space>
                <SwapOutlined />
                <span>Carry Over Leave (Fiscal Rollover)</span>
              </Space>
            }
          >
            <Alert
              message="Transfer unused leave balance from previous year to current year for all eligible leave types"
              description="This will only carry over leave types that have 'allowCarryOver' enabled, respecting maximum limits and recording audit entries."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Form form={carryOverForm} layout="inline" onFinish={handleCarryOver}>
              <Form.Item
                name="fromYear"
                label="From Year"
                rules={[{ required: true, message: 'Please enter year' }]}
                initialValue={currentYear - 1}
              >
                <InputNumber min={2024} max={2050} />
              </Form.Item>
              <Form.Item
                name="toYear"
                label="To Year"
                rules={[{ required: true, message: 'Please enter year' }]}
                initialValue={currentYear}
              >
                <InputNumber min={2024} max={2050} />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SwapOutlined />}
                  loading={carryOverMutation.isPending}
                >
                  Execute Carry Over
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </>
      ),
    },
    {
      key: 'ledger',
      label: (
        <span>
          <AuditOutlined /> Balance Audit Ledger
        </span>
      ),
      children: (
        <Card title="Employee Leave Balance Audit Ledger">
          <Alert
            type="info"
            showIcon
            message="Inspect immutable transaction logs: every credit, debit, reservation, and cancellation is tracked with timestamps and remaining balances."
            style={{ marginBottom: 16 }}
          />
          <Space style={{ marginBottom: 16 }} wrap>
            <span>Employee:</span>
            <Select
              style={{ width: 260 }}
              placeholder="Select employee to inspect"
              showSearch
              value={selectedLedgerUserId}
              onChange={setSelectedLedgerUserId}
              filterOption={(input, option: any) => {
                const label = option?.children?.toString() || '';
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {users.map((user: any) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>

            <span>Fiscal Year:</span>
            <InputNumber
              value={selectedLedgerYear}
              onChange={(y) => y && setSelectedLedgerYear(y)}
              min={2024}
              max={2050}
            />
          </Space>

          <Table
            rowKey="id"
            loading={isLoadingLedger}
            columns={ledgerColumns}
            dataSource={ledgerEntries}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: selectedLedgerUserId
                ? 'No ledger audit transactions found for this user and year'
                : 'Please select an employee above to inspect their audit ledger',
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <CalendarOutlined /> Leave Balance & Ledger Management
      </Title>
      <Text type="secondary">
        Manage leave allocations, automated carry-over, and inspect immutable audit ledgers.
      </Text>
      <Divider />
      <Tabs defaultActiveKey="allocations" items={items} />
    </div>
  );
};

export default LeaveBalanceManagement;
import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  notification,
  Modal,
  Select,
  Form,
  Popconfirm,
  Input,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SearchOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useSession } from '../../context/SessionContext';
import {
  fetchUserLeaves,
  fetchUserLeaveBalances,
  approveLeave,
  rejectLeave,
  fetchLeavesForUser,
} from '../../service/leave.service';
import { usePendingApprovals, useDeleteLeave } from '../../hooks/leave';
import LeaveRequestModal from '../../components/Leave/LeaveRequestModal';
import LeaveDetailsModal from '../../components/Leave/LeaveDetailsModal';
import EditLeaveModal from '../../components/Leave/EditLeaveModal';
import { LeaveType } from '../../types/leave';
import {
  getLeaveStatusColor,
  getLeaveStatusText,
  handleLeaveApproval,
  handleLeaveRejection,
} from '../../utils/leaveHelpers';
import {
  canApplyForLeave as checkCanApplyForLeave,
  canViewUserLeaves as checkCanViewUserLeaves,
  hasAnyLeaveApprovalPermission as checkHasAnyLeaveApprovalPermission,
} from '../../utils/permissionHelpers';
import { hasPermission } from '@/utils/utils';
import { permissionConfig } from '@/utils/permission-config';
import ResponsiveTable from '@/components/ui/MobileCardList';
import { useIsMobile } from '@/hooks/useIsMobile';

const { Title, Text } = Typography;

interface LeaveManagementProps {
  userId?: string;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ userId: profileUserId }) => {
  const { profile, permissions } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userId = profileUserId || (profile as any)?.id;

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveType | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveType | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  const toggleExpandCard = (id: string | number) => {
    const strId = String(id);
    setExpandedCardIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };

  // Mobile search state
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Search in columns functionality
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<any>(null);

  const getUniqueValues = (dataSource: any[], dataIndex: string | string[]) => {
    if (!dataSource) return [];
    const values = dataSource
      .map((item: any) => {
        if (Array.isArray(dataIndex)) {
          let value = item;
          for (const key of dataIndex) {
            value = value?.[key];
          }
          return value;
        }
        return item[dataIndex];
      })
      .filter(Boolean);
    return [...new Set(values)];
  };

  const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: any, confirm: any) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn('');
    confirm({ closeDropdown: false });
  };

  const getColumnSearchProps = (dataSource: any[], dataIndex: any, columnName: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
      const uniqueValues = getUniqueValues(dataSource, dataIndex);
      const [currentValue, setCurrentValue] = useState('');
      const filteredOptions = currentValue
        ? uniqueValues.filter((value: any) =>
            value?.toString().toLowerCase().includes(currentValue.toLowerCase())
          )
        : uniqueValues.slice(0, 10);
      return (
        <div style={{ padding: 8 }}>
          <Select
            ref={searchInput}
            placeholder={`Search ${columnName}`}
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
              setCurrentValue('');
            }}
            onSearch={(value) => setCurrentValue(value)}
            showSearch
            allowClear
            style={{ width: 188, marginBottom: 8, display: 'block' }}
            filterOption={false}
            onDropdownVisibleChange={(open) => {
              if (open) {
                setCurrentValue('');
              }
            }}
          >
            {filteredOptions.map((value: any, index: number) => (
              <Select.Option key={`${value}-${index}`} value={value}>
                {value}
              </Select.Option>
            ))}
          </Select>
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
              onClick={() => clearFilters && handleReset(clearFilters, confirm)}
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
    onFilter: (value: any, record: any) => {
      const recordValue = Array.isArray(dataIndex)
        ? dataIndex.reduce((obj: any, key: any) => obj?.[key], record)
        : record[dataIndex];
      return recordValue
        ? recordValue.toString().toLowerCase().includes(value.toLowerCase())
        : false;
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput.current?.focus(), 100);
      }
    },
    render: (text: any) =>
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

  // Permissions
  const permissionsArr = permissions || [];
  const canApplyForLeave = permissionsArr.length > 0 ? checkCanApplyForLeave(permissionsArr) : false;
  const canApproveLeaves = permissionsArr.length > 0 ? checkHasAnyLeaveApprovalPermission(permissionsArr) : false;
  const canViewUserLeaves = permissionsArr.length > 0 ? checkCanViewUserLeaves(permissionsArr) : false;
  const canAllocateLeave = hasPermission(permissionConfig.ALLOCATE_LEAVE);

  // Fetch leave balances
  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['leave-balances', userId],
    queryFn: () => fetchUserLeaveBalances(userId),
    enabled: !!userId,
  });

  // Fetch leaves
  const { data: userLeaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['user-leaves', userId],
    queryFn: () => (profileUserId ? fetchLeavesForUser(userId) : fetchUserLeaves()),
    enabled: !!userId && (profileUserId ? canViewUserLeaves : true),
  });

  // Fetch pending approvals
  const { data: pendingApprovals = [], isLoading: approvalsLoading } = usePendingApprovals();

  // Approval mutations
  const approveMutation = useMutation({
    mutationFn: ({ leaveId, notifyAdmins }: { leaveId: string; notifyAdmins?: string[] }) => {
      return approveLeave(leaveId, notifyAdmins);
    },
    onSuccess: () => {
      message.success('Leave approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['user-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to approve leave');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ leaveId }: { leaveId: string }) => {
      return rejectLeave(leaveId, userId);
    },
    onSuccess: () => {
      message.success('Leave rejected successfully');
      notification.error({
        message: 'Leave Request Rejected',
        description: 'Your leave request has been rejected. Please contact your manager for more information.',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['user-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to reject leave');
    },
  });

  // Delete mutation
  const deleteLeaveMutation = useDeleteLeave();
  const handleDeleteLeave = async (leaveId: string) => {
    try {
      await deleteLeaveMutation.mutateAsync(leaveId);
      message.success('Leave request deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['user-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to delete leave request');
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await rejectMutation.mutateAsync({ leaveId });
      message.success('Leave request cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['user-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  const handleEditLeave = (leave: LeaveType) => {
    setLeaveToEdit(leave);
    setIsEditMode(true);
  };

  const getStatusColor = getLeaveStatusColor;
  const getStatusText = getLeaveStatusText;

  // Admin notification selection
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [showAdminSelection, setShowAdminSelection] = useState<boolean>(false);
  const [currentLeaveId, setCurrentLeaveId] = useState<string | null>(null);

  const { data: adminUsers = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URI}/users`, {
          params: { role: 'admin', status: 'active', limit: 50, page: 1 },
        });
        return response.data.results || [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleApprove = (leaveId: string) => {
    const isManager =
      (profile as any)?.role?.name === 'manager' ||
      (profile as any)?.role?.name === 'project_manager' ||
      (profile as any)?.role?.name === 'projectmanager';
    if (isManager) {
      setCurrentLeaveId(leaveId);
      setShowAdminSelection(true);
    } else {
      handleLeaveApproval(leaveId, approveMutation);
    }
  };

  const handleFinalizeApproval = () => {
    if (currentLeaveId) {
      if (selectedAdmins.length === 0) {
        message.error('Please select at least one admin to notify');
        return;
      }
      approveMutation.mutate({
        leaveId: currentLeaveId,
        notifyAdmins: selectedAdmins,
      });
      setCurrentLeaveId(null);
      setShowAdminSelection(false);
      setSelectedAdmins([]);
    }
  };

  const handleReject = (leaveId: string) => {
    handleLeaveRejection(leaveId, userId, rejectMutation);
  };

  // Search filtered lists
  const filteredUserLeaves = useMemo(() => {
    if (!userLeaves) return [];
    if (!searchQuery?.trim()) return userLeaves;
    const q = searchQuery.toLowerCase();
    return userLeaves.filter((l: any) => {
      const type = l.leaveType?.name || l.type || '';
      const reason = l.reason || '';
      const status = l.status || '';
      return (
        type.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)
      );
    });
  }, [userLeaves, searchQuery]);

  const filteredApprovals = useMemo(() => {
    if (!pendingApprovals) return [];
    if (!searchQuery?.trim()) return pendingApprovals;
    const q = searchQuery.toLowerCase();
    return pendingApprovals.filter((l: any) => {
      const userName = l.user?.name || '';
      const userEmail = l.user?.email || '';
      const type = l.leaveType?.name || l.type || '';
      const reason = l.reason || '';
      return (
        userName.toLowerCase().includes(q) ||
        userEmail.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q)
      );
    });
  }, [pendingApprovals, searchQuery]);

  const myLeavesColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: LeaveType, b: LeaveType) => {
        const typeA = a.leaveType?.name || a.type;
        const typeB = b.leaveType?.name || b.type;
        return typeA.localeCompare(typeB);
      },
      filters: [
        { text: 'Annual Leave', value: 'Annual Leave' },
        { text: 'Sick Leave', value: 'Sick Leave' },
        { text: 'Personal Leave', value: 'Personal Leave' },
        { text: 'Unpaid Leave', value: 'Unpaid Leave' },
      ],
      onFilter: (value: any, record: LeaveType) =>
        (record.leaveType?.name || record.type) === value,
      render: (type: string, record: LeaveType) => (
        <Tag color="blue">{record.leaveType?.name || type}</Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      sorter: (a: LeaveType, b: LeaveType) => moment(a.startDate).diff(moment(b.startDate)),
      render: (record: LeaveType) => {
        if (record.isCustomDates && record.customDates) {
          const sortedDates = record.customDates.sort();
          return (
            <div>
              <div>
                <strong>Custom Dates</strong>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {sortedDates.length <= 3
                  ? sortedDates.map((date) => moment(date).format('MMM DD')).join(', ')
                  : `${sortedDates.slice(0, 2).map((date) => moment(date).format('MMM DD')).join(', ')} +${sortedDates.length - 2} more`}
              </Text>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {sortedDates.length} days
                </Text>
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <div>
                <strong>
                  {moment(record.startDate).format('MMM DD')} -{' '}
                  {moment(record.endDate).format('MMM DD, YYYY')}
                </strong>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {moment(record.endDate).diff(moment(record.startDate), 'days') + 1} days
              </Text>
            </div>
          );
        }
      },
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      ...getColumnSearchProps(userLeaves, 'reason', 'Reason'),
      render: (reason: string) => {
        if (!reason) return <Text type="secondary">No reason provided</Text>;
        const displayText =
          searchedColumn === 'reason' ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={reason}
            />
          ) : (
            reason
          );
        return displayText;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: LeaveType, b: LeaveType) => a.status.localeCompare(b.status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Manager Approved', value: 'approved_by_manager' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value: any, record: LeaveType) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: LeaveType, b: LeaveType) => moment(a.createdAt).diff(moment(b.createdAt)),
      render: (date: string, record: LeaveType) => (
        <Tooltip
          title={
            <div>
              <p>Requested by: {record.user.name}</p>
              <p>Requested to: {record.requestedManager?.name || 'Manager'}</p>
              <p>Time: {moment(date).format('MMM DD, YYYY HH:mm')}</p>
            </div>
          }
        >
          <span>{moment(date).format('MMM DD, YYYY')}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Approvers',
      key: 'approvers',
      render: (record: LeaveType) => (
        <div>
          {record.managerApproverId && (
            <div style={{ marginBottom: '4px' }}>
              <Tooltip
                title={
                  <div>
                    <p>
                      Approved by:{' '}
                      {record.managerApprover ? record.managerApprover.name : 'Manager'}
                    </p>
                    <p>
                      Time:{' '}
                      {record.updatedAt
                        ? moment(record.updatedAt).format('MMM DD, YYYY HH:mm')
                        : 'Unknown'}
                    </p>
                  </div>
                }
              >
                <Tag color="green">Manager Approved</Tag>
              </Tooltip>
            </div>
          )}
          {record.adminApproverId && (
            <div>
              <Tooltip
                title={
                  <div>
                    <p>
                      Approved by:{' '}
                      {record.adminApprover ? record.adminApprover.name : 'Admin'}
                    </p>
                    <p>
                      Time:{' '}
                      {record.updatedAt
                        ? moment(record.updatedAt).format('MMM DD, YYYY HH:mm')
                        : 'Unknown'}
                    </p>
                  </div>
                }
              >
                <Tag color="purple">Admin Approved</Tag>
              </Tooltip>
            </div>
          )}
          {!record.managerApproverId && !record.adminApproverId && (
            <Text type="secondary">Not yet approved</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: LeaveType) => {
        const isOwnLeave = record.user.id === userId;
        const canEdit =
          isOwnLeave &&
          (record.status === 'pending' || record.status === 'approved_by_manager');
        const canDelete = isOwnLeave && record.status === 'pending';
        const canCancel =
          isOwnLeave &&
          (record.status === 'pending' || record.status === 'approved_by_manager');
        return (
          <Space size="small" direction="vertical">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedLeave(record);
                setIsDetailsModalOpen(true);
              }}
            >
              View
            </Button>
            <Space>
              {canEdit && (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEditLeave(record)}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Popconfirm
                  title="Delete Leave Request"
                  description="Are you sure you want to delete this leave request? This action cannot be undone."
                  onConfirm={() => handleDeleteLeave(record.id)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteLeaveMutation.isPending}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              )}
              {canCancel && !canDelete && (
                <Popconfirm
                  title="Cancel Leave Request"
                  description="Are you sure you want to cancel this leave request? This will reject it and you will need to create a new request."
                  onConfirm={() => handleCancelLeave(record.id)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="link"
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={rejectMutation.isPending}
                  >
                    Cancel
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Space>
        );
      },
    },
  ];

  const approvalsColumns = [
    {
      title: 'Employee',
      key: 'employee',
      sorter: (a: LeaveType, b: LeaveType) => {
        const nameA = a.user.name;
        const nameB = b.user.name;
        return nameA.localeCompare(nameB);
      },
      ...getColumnSearchProps(pendingApprovals, ['user', 'name'], 'Employee'),
      render: (record: LeaveType) => {
        const userName = record.user.name;
        const displayName =
          searchedColumn === 'user,name' ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={userName || ''}
            />
          ) : (
            userName
          );
        return (
          <div>
            <div>
              <strong>{displayName}</strong>
            </div>
            <Text type="secondary">{record.user.email}</Text>
            {record.user.role && (
              <div>
                <Tag color="default" style={{ fontSize: '10px', marginTop: '4px' }}>
                  {record.user.role.displayName || record.user.role.name}
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: LeaveType, b: LeaveType) => {
        const typeA = a.leaveType?.name || a.type;
        const typeB = b.leaveType?.name || b.type;
        return typeA.localeCompare(typeB);
      },
      filters: [
        { text: 'Annual Leave', value: 'Annual Leave' },
        { text: 'Sick Leave', value: 'Sick Leave' },
        { text: 'Personal Leave', value: 'Personal Leave' },
        { text: 'Unpaid Leave', value: 'Unpaid Leave' },
      ],
      onFilter: (value: any, record: LeaveType) =>
        (record.leaveType?.name || record.type) === value,
      render: (type: string, record: LeaveType) => (
        <Tag color="blue">{record.leaveType?.name || type}</Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      sorter: (a: LeaveType, b: LeaveType) => moment(a.startDate).diff(moment(b.startDate)),
      render: (record: LeaveType) => {
        if (record.isCustomDates && record.customDates) {
          const sortedDates = record.customDates.sort();
          return (
            <div>
              <div>
                <strong>Custom Dates</strong>
              </div>
              <Text type="secondary">
                {sortedDates.length <= 3
                  ? sortedDates.map((date) => moment(date).format('MMM DD')).join(', ')
                  : `${sortedDates.slice(0, 2).map((date) => moment(date).format('MMM DD')).join(', ')} +${sortedDates.length - 2} more`}
              </Text>
              <div>
                <Text type="secondary">{sortedDates.length} days</Text>
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <div>
                <strong>
                  {moment(record.startDate).format('MMM DD')} -{' '}
                  {moment(record.endDate).format('MMM DD, YYYY')}
                </strong>
              </div>
              <Text type="secondary">
                {moment(record.endDate).diff(moment(record.startDate), 'days') + 1} days
              </Text>
            </div>
          );
        }
      },
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      ...getColumnSearchProps(pendingApprovals, 'reason', 'Reason'),
      render: (reason: string) => {
        if (!reason) return <Text type="secondary">No reason provided</Text>;
        const displayText =
          searchedColumn === 'reason' ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={reason}
            />
          ) : (
            reason
          );
        return displayText;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: LeaveType, b: LeaveType) => a.status.localeCompare(b.status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Manager Approved', value: 'approved_by_manager' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value: any, record: LeaveType) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: LeaveType, b: LeaveType) => moment(a.createdAt).diff(moment(b.createdAt)),
      render: (date: string, record: LeaveType) => (
        <Tooltip
          title={
            <div>
              <p>Requested by: {record.user.name}</p>
              <p>Requested to: {record.requestedManager?.name || 'Manager'}</p>
              <p>Time: {moment(date).format('MMM DD, YYYY HH:mm')}</p>
            </div>
          }
        >
          <span>{moment(date).format('MMM DD, YYYY')}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Approved By',
      key: 'approvedBy',
      render: (record: LeaveType) => (
        <div style={{ minWidth: '150px' }}>
          {record.managerApprover && (
            <div style={{ marginBottom: '4px' }}>
              <Tooltip
                title={`Manager approved on: ${moment(record.managerApprovalTime).format('MMM DD, YYYY [at] HH:mm')}`}
              >
                <Tag color="blue">Manager: {record.managerApprover.name}</Tag>
              </Tooltip>
            </div>
          )}
          {record.adminApprover && (
            <div>
              <Tooltip
                title={`Final approved on: ${moment(record.adminApprovalTime).format('MMM DD, YYYY [at] HH:mm')}`}
              >
                <Tag color="green">Final: {record.adminApprover.name}</Tag>
              </Tooltip>
            </div>
          )}
          {!record.managerApprover && !record.adminApprover && (
            <Text type="secondary">Not yet approved</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: LeaveType) => {
        const isPending = ['pending', 'approved_by_manager'].includes(record.status);
        const isManagerApproved = record.status === 'approved_by_manager';
        const isManager =
          (profile as any)?.role?.name === 'projectmanager' ||
          (profile as any)?.role?.name === 'project_manager';
        const showApproveButtons = isPending && !(isManagerApproved && isManager);
        return (
          <Space direction="vertical" size="small">
            {showApproveButtons && (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApprove(record.id)}
                  loading={approveMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReject(record.id)}
                  loading={rejectMutation.isPending}
                >
                  Reject
                </Button>
              </Space>
            )}
            {isManagerApproved && isManager && (
              <div style={{ marginBottom: '8px' }}>
                <Tag color="blue" icon={<CheckCircleOutlined />}>
                  You approved this request
                </Tag>
              </div>
            )}
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedLeave(record);
                setIsDetailsModalOpen(true);
              }}
            >
              View
            </Button>
          </Space>
        );
      },
    },
  ];

  // Mobile card renderers
  const renderMyLeaveCard = (record: LeaveType) => {
    const isExpanded = expandedCardIds.includes(String(record.id));
    const leaveName = record.leaveType?.name || record.type;
    const canEdit = record.status === 'pending';
    const canDelete = record.status === 'pending';
    const canCancel = ['pending', 'approved_by_manager'].includes(record.status);
    const periodText = record.isCustomDates && record.customDates
      ? `${record.customDates.length} custom days`
      : `${moment(record.startDate).format('MMM DD')} - ${moment(record.endDate).format('MMM DD, YYYY')} (${moment(record.endDate).diff(moment(record.startDate), 'days') + 1}d)`;

    return (
      <div className="flex flex-col gap-2">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-900 text-sm block truncate">{leaveName}</span>
            <span className="text-xs text-gray-500 block truncate">{periodText}</span>
          </div>

          {/* Action Icons: View Details, Edit, Delete/Cancel, Toggle Details */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLeave(record);
                setIsDetailsModalOpen(true);
              }}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
              title="View Details"
              aria-label="View Details"
            />
            {canEdit && (
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditLeave(record);
                }}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
                title="Edit Leave"
                aria-label="Edit Leave"
              />
            )}
            {canDelete && (
              <Popconfirm
                title="Delete Leave Request"
                description="Are you sure you want to delete this leave request?"
                onConfirm={() => handleDeleteLeave(record.id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined style={{ fontSize: "16px", color: "#ff4d4f" }} />}
                  loading={deleteLeaveMutation.isPending}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-red-50 text-red-600"
                  title="Delete"
                  aria-label="Delete"
                />
              </Popconfirm>
            )}
            {canCancel && !canDelete && (
              <Popconfirm
                title="Cancel Leave Request"
                description="Are you sure you want to cancel this leave request?"
                onConfirm={() => handleCancelLeave(record.id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined style={{ fontSize: "16px", color: "#ff4d4f" }} />}
                  loading={rejectMutation.isPending}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-red-50 text-red-600"
                  title="Cancel"
                  aria-label="Cancel"
                />
              </Popconfirm>
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
              <span className="text-gray-500 font-medium shrink-0">Requested Date:</span>
              <span className="font-semibold text-gray-800 text-right">{moment(record.createdAt).format('MMM DD, YYYY')}</span>
            </div>
            {record.managerApprover && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500 font-medium shrink-0">Manager Approval:</span>
                <Tag color="green" className="m-0 text-[10px]">Approved</Tag>
              </div>
            )}
            {record.adminApprover && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500 font-medium shrink-0">Admin Approval:</span>
                <Tag color="purple" className="m-0 text-[10px]">Approved</Tag>
              </div>
            )}
            {record.reason && (
              <div className="pt-1.5 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium block mb-1">Reason:</span>
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

  const renderApprovalCard = (record: LeaveType) => {
    const isExpanded = expandedCardIds.includes(String(record.id));
    const isPending = ['pending', 'approved_by_manager'].includes(record.status);
    const isManagerApproved = record.status === 'approved_by_manager';
    const isManager =
      (profile as any)?.role?.name === 'projectmanager' ||
      (profile as any)?.role?.name === 'project_manager';
    const showApproveButtons = isPending && !(isManagerApproved && isManager);
    const leaveName = record.leaveType?.name || record.type;
    const periodText = record.isCustomDates && record.customDates
      ? `${record.customDates.length} custom days`
      : `${moment(record.startDate).format('MMM DD')} - ${moment(record.endDate).format('MMM DD, YYYY')} (${moment(record.endDate).diff(moment(record.startDate), 'days') + 1}d)`;

    return (
      <div className="flex flex-col gap-2">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-900 text-sm block truncate">{record.user.name}</span>
            <span className="text-xs text-gray-500 block truncate">{leaveName} &bull; {periodText}</span>
          </div>

          {/* Action Icons: View Details, Approve, Reject, Toggle Details */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLeave(record);
                setIsDetailsModalOpen(true);
              }}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
              title="View Details"
              aria-label="View Details"
            />
            {showApproveButtons && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined style={{ fontSize: "16px", color: "#52c41a" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(record.id);
                  }}
                  loading={approveMutation.isPending}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-green-50 text-green-600"
                  title="Approve"
                  aria-label="Approve"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined style={{ fontSize: "16px", color: "#ff4d4f" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(record.id);
                  }}
                  loading={rejectMutation.isPending}
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
              <span className="text-gray-500 font-medium shrink-0">Employee Email:</span>
              <span className="font-semibold text-gray-800 text-right truncate max-w-[180px]">{record.user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Leave Type:</span>
              <span className="font-semibold text-gray-800 text-right">{leaveName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Period:</span>
              <span className="font-semibold text-gray-800 text-right">{periodText}</span>
            </div>
            {isManagerApproved && isManager && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500 font-medium shrink-0">Status:</span>
                <Tag color="blue" icon={<CheckCircleOutlined />} className="m-0">You approved</Tag>
              </div>
            )}
            {record.reason && (
              <div className="pt-1.5 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium block mb-1">Reason:</span>
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
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Title level={isMobile ? 4 : 2} style={{ margin: 0 }}>
          Leave Management
        </Title>
        {canAllocateLeave && (
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={() => navigate('/leave-balance-management')}
            size={isMobile ? 'small' : 'middle'}
          >
            Manage Leave Balances
          </Button>
        )}
      </div>

      {/* Mobile search bar toggle */}
      {isMobile && showMobileSearch && (
        <div className="mb-4">
          <Input.Search
            placeholder="Search leaves by type, employee, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            autoFocus
            className="w-full shadow-sm"
          />
        </div>
      )}

      {/* Leave Balances */}
      <Card
        title="Leave Balances"
        style={{ marginBottom: '20px' }}
        styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
        loading={balancesLoading}
      >
        <Row gutter={[12, 12]}>
          {balances.map((balance: any) => (
            <Col xs={12} sm={12} md={6} key={balance.leaveType?.name || balance.leaveTypeId}>
              <Card styles={{ body: { padding: isMobile ? '10px' : '16px' } }}>
                <Statistic
                  title={balance.leaveType?.name || 'Leave'}
                  value={balance.remainingDays || 'Unlimited'}
                  suffix={balance.maxDays ? `/ ${balance.maxDays}` : ''}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ fontSize: isMobile ? '18px' : '24px' }}
                />
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                  Used: {balance.usedDays} days
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* My Leave Requests */}
      <Card
        title="My Leave Requests"
        extra={
          !isMobile && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsRequestModalOpen(true)}
              disabled={!canApplyForLeave}
              title={!canApplyForLeave ? "You don't have permission to apply for leave" : undefined}
            >
              Request Leave
            </Button>
          )
        }
        styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
        style={{ marginBottom: '20px' }}
      >
        <ResponsiveTable
          tableProps={{
            dataSource: filteredUserLeaves,
            columns: myLeavesColumns,
            loading: leavesLoading,
            rowKey: 'id',
            pagination: isMobile ? false : { pageSize: 10 },
            locale: { emptyText: 'No leave requests found' },
            scroll: { x: 'max-content' },
          }}
          renderMobileCard={renderMyLeaveCard}
        />
      </Card>

      {/* Pending Approvals & Overridable Leaves */}
      {canApproveLeaves && (
        <Card
          title="Incoming Request Approvals"
          styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
          extra={
            <Space>
              <ClockCircleOutlined />
              <Text>
                {
                  pendingApprovals.filter((leave: any) =>
                    ['pending', 'approved_by_manager'].includes(leave.status)
                  ).length
                }{' '}
                pending
              </Text>
            </Space>
          }
        >
          <ResponsiveTable
            tableProps={{
              dataSource: filteredApprovals,
              columns: approvalsColumns,
              loading: approvalsLoading,
              rowKey: 'id',
              pagination: isMobile ? false : { pageSize: 10 },
              locale: { emptyText: 'No leave requests requiring action' },
              scroll: { x: 'max-content' },
            }}
            renderMobileCard={renderApprovalCard}
          />
        </Card>
      )}

      {/* Mobile Floating Action Buttons */}
      {isMobile && (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-lg active:scale-95 transition-all"
            aria-label="Search leaves"
          >
            {showMobileSearch ? <CloseOutlined /> : <SearchOutlined />}
          </button>
          {canApplyForLeave && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all hover:bg-blue-700"
              aria-label="Request Leave"
            >
              <PlusOutlined />
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <LeaveRequestModal
        open={isRequestModalOpen && !isEditMode}
        onCancel={() => {
          setIsRequestModalOpen(false);
          setIsEditMode(false);
          setLeaveToEdit(null);
        }}
        onSuccess={() => {
          setIsRequestModalOpen(false);
          setIsEditMode(false);
          setLeaveToEdit(null);
          queryClient.invalidateQueries({ queryKey: ['user-leaves'] });
          queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
        }}
      />
      <EditLeaveModal
        open={isEditMode && leaveToEdit !== null}
        leave={leaveToEdit}
        onCancel={() => {
          setIsEditMode(false);
          setLeaveToEdit(null);
        }}
        onSuccess={() => {
          setIsEditMode(false);
          setLeaveToEdit(null);
          queryClient.invalidateQueries({ queryKey: ['user-leaves'] });
          queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
        }}
      />
      <LeaveDetailsModal
        visible={isDetailsModalOpen}
        leave={selectedLeave}
        onCancel={() => {
          setIsDetailsModalOpen(false);
          setSelectedLeave(null);
        }}
      />

      {/* Admin Selection Modal */}
      <Modal
        title="Select Admins to Notify"
        open={showAdminSelection}
        onCancel={() => {
          setShowAdminSelection(false);
          setCurrentLeaveId(null);
          setSelectedAdmins([]);
        }}
        onOk={handleFinalizeApproval}
        confirmLoading={approveMutation.isPending}
        okButtonProps={{ disabled: selectedAdmins.length === 0 }}
      >
        <Form layout="vertical">
          <Form.Item
            label="Select Admins to be notified:"
            required
            validateStatus={selectedAdmins.length === 0 ? 'error' : 'success'}
            help={selectedAdmins.length === 0 ? 'Please select at least one admin to notify' : ''}
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select admins to notify (required)"
              value={selectedAdmins}
              onChange={(values) => setSelectedAdmins(values)}
              loading={adminsLoading}
              optionFilterProp="children"
            >
              {adminUsers.map((user: any) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div>
            <p>
              <strong>Note:</strong> Selected admins will be notified immediately when this leave is approved
              and they will be able to provide final approval.
            </p>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveManagement;
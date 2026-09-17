import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Input, Button, message, Tag, Space, Popconfirm, Avatar } from 'antd';
import { UserAddOutlined, DeleteOutlined, EditOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import useIsMobile from '@/hooks/useIsMobile';
import { ResponsiveTable } from '@/components/ui/MobileCardList';

const { TextArea } = Input;
const backendURI = import.meta.env.VITE_BACKEND_URI;

interface UserAssignment {
  id: string;
  userId: string;
  projectId: string;
  isActive: boolean;
  assignedDate: string;
  startDate: string | null;
  releaseDate: string | null;
  plannedReleaseDate: string | null;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: {
      name: string;
    };
  };
}

interface ProjectUserAssignmentProps {
  projectId: string;
  users: any[];
  onAssignmentChange?: () => void;
}

const ProjectUserAssignment = ({ projectId, users, onAssignmentChange }: ProjectUserAssignmentProps) => {
  const { isMobile } = useIsMobile();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<UserAssignment | null>(null);

  // Extension modal state
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [extendingAssignment, setExtendingAssignment] = useState<UserAssignment | null>(null);
  const [newPlannedDate, setNewPlannedDate] = useState<dayjs.Dayjs | null>(null);
  const [extending, setExtending] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendURI}/projects/${projectId}/users/assignments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAssignments(response.data);
    } catch (error) {
      message.error('Failed to fetch user assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [projectId]);

  const handleAssignUser = async (values: any) => {
    setLoading(true);
    try {
      await axios.post(
        `${backendURI}/projects/${projectId}/users/assign`,
        {
          userId: values.userId,
          isActive: values.isActive ?? true,
          startDate: values.startDate ? dayjs(values.startDate).toISOString() : null,
          plannedReleaseDate: values.plannedReleaseDate ? dayjs(values.plannedReleaseDate).toISOString() : null,
          notes: values.notes
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      message.success('User assigned successfully');
      setModalVisible(false);
      form.resetFields();
      fetchAssignments();
      onAssignmentChange?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to assign user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (values: any) => {
    if (!editingAssignment) return;
    setLoading(true);
    try {
      await axios.patch(
        `${backendURI}/projects/${projectId}/users/${editingAssignment.userId}`,
        {
          isActive: values.isActive,
          startDate: values.startDate ? dayjs(values.startDate).toISOString() : null,
          plannedReleaseDate: values.plannedReleaseDate ? dayjs(values.plannedReleaseDate).toISOString() : null,
          notes: values.notes
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      message.success('Assignment updated successfully');
      setModalVisible(false);
      setEditingAssignment(null);
      form.resetFields();
      fetchAssignments();
      onAssignmentChange?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseUser = async (userId: string) => {
    setLoading(true);
    try {
      await axios.patch(
        `${backendURI}/projects/${projectId}/users/${userId}/release`,
        {
          releaseDate: new Date().toISOString()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      message.success('User released from project');
      fetchAssignments();
      onAssignmentChange?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to release user');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = () => {
    form.resetFields();
    setEditingAssignment(null);
    setModalVisible(true);
  };

  const openEditModal = (assignment: UserAssignment) => {
    setEditingAssignment(assignment);
    form.setFieldsValue({
      userId: assignment.userId,
      isActive: assignment.isActive,
      startDate: assignment.startDate ? dayjs(assignment.startDate) : null,
      plannedReleaseDate: assignment.plannedReleaseDate ? dayjs(assignment.plannedReleaseDate) : null,
      notes: assignment.notes
    });
    setModalVisible(true);
  };

  const openExtendModal = (assignment: UserAssignment) => {
    setExtendingAssignment(assignment);
    setNewPlannedDate(assignment.plannedReleaseDate ? dayjs(assignment.plannedReleaseDate) : dayjs().add(1, 'month'));
    setExtendModalVisible(true);
  };

  const handleExtendAssignment = async () => {
    if (!extendingAssignment || !newPlannedDate) {
      message.error('Please select a new date');
      return;
    }
    setExtending(true);
    try {
      await axios.patch(
        `${backendURI}/projects/${projectId}/users/${extendingAssignment.userId}`,
        {
          plannedReleaseDate: newPlannedDate.toISOString()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      message.success(`Extended ${extendingAssignment.user.name}'s assignment to ${newPlannedDate.format('MMM DD, YYYY')}`);
      setExtendModalVisible(false);
      setExtendingAssignment(null);
      setNewPlannedDate(null);
      fetchAssignments();
      onAssignmentChange?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to extend assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendCancel = () => {
    setExtendModalVisible(false);
    setExtendingAssignment(null);
    setNewPlannedDate(null);
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: UserAssignment) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{record.user?.name}</span>
          <span style={{ fontSize: '12px', color: '#666' }}>{record.user?.email}</span>
        </Space>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (record: UserAssignment) => (
        <Tag color="blue">{record.user?.role?.name || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Planned Release',
      dataIndex: 'plannedReleaseDate',
      key: 'plannedReleaseDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Release Date',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: UserAssignment) => (
        <Space wrap size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          {record.isActive && !record.releaseDate && (
            <>
              <Button
                icon={<ClockCircleOutlined />}
                size="small"
                onClick={() => openExtendModal(record)}
                type="default"
              >
                Extend
              </Button>
              <Popconfirm
                title="Release this user from the project?"
                onConfirm={() => handleReleaseUser(record.userId)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                >
                  Release
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={openAssignModal}
        >
          Assign User
        </Button>
      </div>

      <ResponsiveTable
        columns={columns}
        dataSource={assignments}
        rowKey="id"
        loading={loading}
        pagination={isMobile ? false : { pageSize: 5 }}
        renderMobileCard={(record: UserAssignment) => (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <div className="min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{record.user?.name}</div>
                  <div className="text-xs text-gray-500 truncate">{record.user?.email}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Tag color={record.isActive ? 'success' : 'default'} style={{ margin: 0 }}>
                  {record.isActive ? 'Active' : 'Inactive'}
                </Tag>
                {record.user?.role?.name && (
                  <Tag color="blue" style={{ margin: 0, fontSize: '11px' }}>
                    {record.user.role.name}
                  </Tag>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600">
              <div>
                <span className="text-gray-400 block">Assigned:</span>
                <span className="font-medium text-gray-700">
                  {record.assignedDate ? dayjs(record.assignedDate).format('YYYY-MM-DD') : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Start Date:</span>
                <span className="font-medium text-gray-700">
                  {record.startDate ? dayjs(record.startDate).format('YYYY-MM-DD') : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Planned Release:</span>
                <span className="font-medium text-gray-700">
                  {record.plannedReleaseDate ? dayjs(record.plannedReleaseDate).format('YYYY-MM-DD') : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Release Date:</span>
                <span className="font-medium text-gray-700">
                  {record.releaseDate ? dayjs(record.releaseDate).format('YYYY-MM-DD') : '-'}
                </span>
              </div>
            </div>

            {record.notes && (
              <div className="text-xs text-gray-500 italic bg-white p-1.5 border border-gray-100 rounded">
                Note: {record.notes}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => openEditModal(record)}
              >
                Edit
              </Button>
              {record.isActive && !record.releaseDate && (
                <>
                  <Button
                    icon={<ClockCircleOutlined />}
                    size="small"
                    onClick={() => openExtendModal(record)}
                  >
                    Extend
                  </Button>
                  <Popconfirm
                    title="Release this user from the project?"
                    onConfirm={() => handleReleaseUser(record.userId)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                    >
                      Release
                    </Button>
                  </Popconfirm>
                </>
              )}
            </div>
          </div>
        )}
      />

      <Modal
        title={editingAssignment ? 'Update User Assignment' : 'Assign User to Project'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingAssignment(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingAssignment ? handleUpdateAssignment : handleAssignUser}
        >
          <Form.Item
            name="userId"
            label="User"
            rules={[{ required: !editingAssignment, message: 'Please select a user' }]}
          >
            <Select
              placeholder="Select a user"
              disabled={!!editingAssignment}
              showSearch
              optionFilterProp="children"
            >
              {users?.map((user: any) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="isActive"
            label="Is Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select a start date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              disabledDate={(current) => {
                if (!current) return false;
                if (current < dayjs().startOf('day')) return true;
                return false;
              }}
            />
          </Form.Item>
          <Form.Item
            name="plannedReleaseDate"
            label="Planned Release Date"
          >
            <DatePicker 
              style={{ width: '100%' }}
              disabledDate={(current) => {
                if (!current) return false;
                const startDate = form.getFieldValue('startDate');
                if (current < dayjs().startOf('day')) return true;
                if (startDate && current < dayjs(startDate).startOf('day')) return true;
                return false;
              }}
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Add any notes about this assignment" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingAssignment ? 'Update' : 'Assign'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingAssignment(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Extend Assignment Modal */}
      <Modal
        title={
          <Space>
            <ClockCircleOutlined />
            <span>Extend User Assignment</span>
          </Space>
        }
        open={extendModalVisible}
        onOk={handleExtendAssignment}
        onCancel={handleExtendCancel}
        confirmLoading={extending}
        okText="Extend Assignment"
        cancelText="Cancel"
        width={500}
      >
        {extendingAssignment && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <span style={{ fontWeight: 600 }}>User: </span>
              <span>{extendingAssignment.user.name}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Email: </span>
              <span>{extendingAssignment.user.email}</span>
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>Current Planned Release Date: </span>
              <span>
                {extendingAssignment.plannedReleaseDate 
                  ? dayjs(extendingAssignment.plannedReleaseDate).format('MMM DD, YYYY')
                  : 'Not set'
                }
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>New Planned Release Date:</div>
              <DatePicker
                value={newPlannedDate}
                onChange={(date) => setNewPlannedDate(date)}
                format="YYYY-MM-DD"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  if (extendingAssignment.plannedReleaseDate) {
                    return current && current.isBefore(dayjs(extendingAssignment.plannedReleaseDate), 'day');
                  }
                  return current && current.isBefore(dayjs(), 'day');
                }}
              />
              {newPlannedDate && extendingAssignment.plannedReleaseDate && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
                  Extension: {dayjs(newPlannedDate).diff(dayjs(extendingAssignment.plannedReleaseDate), 'day')} days
                </div>
              )}
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ProjectUserAssignment;
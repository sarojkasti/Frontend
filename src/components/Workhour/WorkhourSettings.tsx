import React, { useState } from 'react';
import { PowerTable, PowerTableColumn, useColumnVisibility } from '@/components/Table';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  InputNumber, 
  Select, 
  Space, 
  Popconfirm, 
  message, 
  Typography,
  Tag,
  DatePicker,
  Tabs,
  TimePicker,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SettingOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { 
  useWorkhours, 
  useWorkhourHistory,
  useCreateWorkhour, 
  useUpdateWorkhour, 
  useDeleteWorkhour 
} from '../../hooks/workhour/useWorkhour';
import { CreateWorkhourDto, UpdateWorkhourDto, WorkhourType, WorkhourHistoryType } from '../../types/workhour';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface WorkhourSettingsProps {
  roles?: any[];
}

const WorkhourSettings: React.FC<WorkhourSettingsProps> = ({ roles = [] }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkhourType | null>(null);
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Hooks
  const { data: workhours = [], isLoading, refetch } = useWorkhours();
  const { data: workhourHistory = [], isLoading: historyLoading } = useWorkhourHistory(selectedRole || '');
  const createWorkhour = useCreateWorkhour();
  const updateWorkhour = useUpdateWorkhour();
  const deleteWorkhour = useDeleteWorkhour();

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: WorkhourType) => {
    setEditingRecord(record);
    form.setFieldsValue({
      roleId: record.roleId,
      workHours: record.workHours,
      startTime: record.startTime ? dayjs(record.startTime, "HH:mm") : undefined,
      endTime: record.endTime ? dayjs(record.endTime, "HH:mm") : undefined,
      validFrom: record.validFrom ? dayjs(record.validFrom) : undefined
    }); // Only set initial values, no auto-calculation
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkhour.mutateAsync(id);
      message.success('Work hour configuration deleted successfully');
      refetch();
    } catch (error) {
      message.error('Failed to delete work hour configuration');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload: CreateWorkhourDto | UpdateWorkhourDto = {
        roleId: values.roleId,
        workHours: values.workHours,
        startTime: values.startTime ? values.startTime.format("HH:mm") : undefined,
        endTime: values.endTime ? values.endTime.format("HH:mm") : undefined,
        validFrom: values.validFrom ? values.validFrom.format('YYYY-MM-DD') : undefined
      };

      if (editingRecord) {
        await updateWorkhour.mutateAsync({ 
          id: editingRecord.id, 
          payload: payload as UpdateWorkhourDto 
        });
        message.success('Work hour configuration updated successfully');
      } else {
        await createWorkhour.mutateAsync(payload as CreateWorkhourDto);
        message.success('Work hour configuration created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error) {
      message.error('Failed to save work hour configuration');
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  // Handle changes to form fields
  const handleValuesChange = (_changedValues: any) => {
    // All fields are independent. No auto-calculation or auto-setting of fields.
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.displayName : 'Unknown Role';
  };

  const activeColumns: PowerTableColumn<WorkhourType>[] = [
    {
      title: 'Role',
      key: 'role',
      defaultWidth: 160,
      render: (_: any, record: WorkhourType) => getRoleName(record.roleId)
    },
    {
      title: 'Work Hours',
      dataIndex: 'workHours',
      key: 'workHours',
      defaultWidth: 130,
      render: (hours: number) => <strong>{hours}h</strong>
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      defaultWidth: 130,
      render: (time: string) => time || 'Not set'
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      defaultWidth: 130,
      render: (time: string) => time || 'Not set'
    },
    {
      title: 'Valid From',
      dataIndex: 'validFrom',
      key: 'validFrom',
      defaultWidth: 140,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Not set'
    },
    {
      title: 'Status',
      key: 'status',
      defaultWidth: 120,
      render: (_: any, record: WorkhourType) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      defaultWidth: 130,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      defaultWidth: 180,
      required: true,
      fixed: 'right',
      render: (_: any, record: WorkhourType) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => handleRoleSelect(record.roleId)}
            size="small"
          >
            History
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this configuration?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const historyColumns: PowerTableColumn<WorkhourHistoryType>[] = [
    {
      title: 'Role',
      key: 'role',
      defaultWidth: 160,
      render: (_: any, record: WorkhourHistoryType) => getRoleName(record.roleId)
    },
    {
      title: 'Work Hours',
      dataIndex: 'workHours',
      key: 'workHours',
      defaultWidth: 130,
      render: (hours: number) => <strong>{hours}h</strong>
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      defaultWidth: 130,
      render: (time: string) => time || 'Not set'
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      defaultWidth: 130,
      render: (time: string) => time || 'Not set'
    },
    {
      title: 'Valid From',
      dataIndex: 'validFrom',
      key: 'validFrom',
      defaultWidth: 140,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Not set'
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      defaultWidth: 140,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Still Active'
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      defaultWidth: 130,
      render: (date: string) => new Date(date).toLocaleDateString()
    }
  ];

  const { visibleColumnKeys: activeVisibleKeys, columnCustomizer: activeCustomizer } =
    useColumnVisibility({
      persistenceKey: "workhour_active_settings",
      columns: activeColumns,
    });

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SettingOutlined style={{ marginRight: '8px' }} />
            <Title level={4} style={{ margin: 0 }}>Work Hour Settings</Title>
          </div>
          <Space>
            {activeCustomizer}
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              Add Configuration
            </Button>
          </Space>
        </div>
      }
    >
      <Tabs defaultActiveKey="active">
        <TabPane tab="Active Workhours" key="active">
          <PowerTable<WorkhourType>
            columns={activeColumns}
            dataSource={workhours}
            rowKey="id"
            loading={isLoading}
            enableResize
            enableColumnSearch
            visibleColumnKeys={activeVisibleKeys}
            showToolbar={false}
            persistenceKey="workhour_active_settings"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} configurations`
            }}
          />
        </TabPane>
        {selectedRole && (
          <TabPane tab={`History for ${getRoleName(selectedRole)}`} key="history">
            <PowerTable<WorkhourHistoryType>
              columns={historyColumns}
              dataSource={workhourHistory}
              rowKey="id"
              loading={historyLoading}
              enableResize
              enableColumnSearch
              showToolbar={false}
              persistenceKey="workhour_history_settings"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} history records`
              }}
            />
          </TabPane>
        )}
      </Tabs>

      <Modal
        title={editingRecord ? 'Edit Work Hour Configuration' : 'Add Work Hour Configuration'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
        >
          <Form.Item
            name="roleId"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select role">
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.displayName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="workHours"
                label="Daily Work Hours"
                rules={[
                  { required: true, message: 'Please enter work hours' },
                  { type: 'number', min: 0.5, max: 24, message: 'Work hours must be between 0.5 and 24' }
                ]}
              >
                <InputNumber 
                  placeholder="8" 
                  style={{ width: '100%' }}
                  min={0.5}
                  max={24}
                  step={0.5}
                  addonAfter="hours"
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Please enter start time' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Please enter end time' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="validFrom"
            label="Valid From"
            rules={[{ required: true, message: 'Please select valid from date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createWorkhour.isPending || updateWorkhour.isPending}
              >
                {editingRecord ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default WorkhourSettings;

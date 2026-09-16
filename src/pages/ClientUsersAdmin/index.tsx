import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Typography,
  Avatar,
  Tooltip
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  StopOutlined,
  DownloadOutlined
} from "@ant-design/icons";
import {
  useClientUsers,
  useCreateClientUser,
  useUpdateClientUser,
  useDeleteClientUser
} from "@/hooks/clientReport";
import { useClient } from "@/hooks/client/useClient";
import { ClientUserType, ClientUserStatus } from "@/types/clientUser";
import { formatDistanceToNow, format } from "date-fns";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Title, Text } = Typography;
const { Option } = Select;

const ClientUsersAdmin: React.FC = () => {
  const isMobile = useIsMobile();
  const [filterCustomerId, setFilterCustomerId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUserType | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: users, isLoading } = useClientUsers(filterCustomerId);
  const { data: clients } = useClient();
  const { mutate: createUser, isPending: creating } = useCreateClientUser();
  const { mutate: updateUser, isPending: updating } = useUpdateClientUser();
  const { mutate: deleteUser } = useDeleteClientUser();

  const handleCreateUser = (values: any) => {
    createUser(values, {
      onSuccess: () => {
        message.success("Client user created successfully");
        setIsModalOpen(false);
        form.resetFields();
      },
      onError: (err: any) => {
        message.error(err.response?.data?.message || "Failed to create user");
      }
    });
  };

  const handleUpdateUser = (values: any) => {
    if (!selectedUser) return;

    updateUser(
      { id: selectedUser.id, payload: values },
      {
        onSuccess: () => {
          message.success("User updated successfully");
          setIsEditModalOpen(false);
          setSelectedUser(null);
          editForm.resetFields();
        },
        onError: () => {
          message.error("Failed to update user");
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteUser(id, {
      onSuccess: () => {
        message.success("User deleted successfully");
      },
      onError: () => {
        message.error("Failed to delete user");
      }
    });
  };

  const getStatusTag = (status: ClientUserStatus) => {
    switch (status) {
      case ClientUserStatus.ACTIVE:
        return <Tag color="success">Active</Tag>;
      case ClientUserStatus.INACTIVE:
        return <Tag color="default">Inactive</Tag>;
      case ClientUserStatus.BLOCKED:
        return <Tag color="error">Blocked</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_: any, record: ClientUserType) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-xs flex items-center gap-1">
              <MailOutlined /> {record.email}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: "Clients",
      dataIndex: "customers",
      key: "customers",
      render: (customers: any[]) => 
        customers?.length > 0 ? (
          <Space wrap>
            {customers.map((c: any) => (
              <Tag key={c.id} color="blue">{c.name}</Tag>
            ))}
          </Space>
        ) : "-"
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phone: string) =>
        phone ? (
          <span className="flex items-center gap-1">
            <PhoneOutlined /> {phone}
          </span>
        ) : (
          "-"
        )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: ClientUserStatus) => getStatusTag(status)
    },
    {
      title: "Downloads",
      dataIndex: "isDownloadDisabled",
      key: "isDownloadDisabled",
      render: (disabled: boolean, record: ClientUserType) => (
        <Tooltip title={disabled ? "Downloads disabled for this user" : "Downloads enabled"}>
          <Switch
            checked={!disabled}
            checkedChildren={<DownloadOutlined />}
            unCheckedChildren={<StopOutlined />}
            onChange={(checked) => {
              updateUser(
                { id: record.id, payload: { isDownloadDisabled: !checked } },
                {
                  onSuccess: () => {
                    message.success(
                      `Downloads ${checked ? "enabled" : "disabled"} for ${record.name}`
                    );
                  },
                  onError: () => {
                    message.error("Failed to update download access");
                  }
                }
              );
            }}
          />
        </Tooltip>
      )
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (date: string) =>
        date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "Never"
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => format(new Date(date), "PP")
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ClientUserType) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedUser(record);
              editForm.setFieldsValue({
                name: record.name,
                phoneNumber: record.phoneNumber,
                status: record.status,
                customerIds: record.customers?.map((c: any) => c.id) || [],
                isDownloadDisabled: record.isDownloadDisabled || false
              });
              setIsEditModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete this user?"
            description="This will permanently remove their access to the client portal."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="!mb-0">
          Client Portal Users
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Client User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Space className={isMobile ? "w-full" : ""}>
          <Select
            style={{ width: isMobile ? '100%' : 250 }}
            placeholder="Filter by Client"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={setFilterCustomerId}
          >
            {clients?.map((client: any) => (
              <Option key={client.id} value={client.id}>
                {client.name}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Add Client Portal User"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={isMobile ? '95vw' : 500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" }
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" }
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone Number">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="customerIds"
            label="Clients"
            rules={[{ required: true, message: "Please select at least one client" }]}
          >
            <Select 
              mode="multiple" 
              placeholder="Select clients"
              optionFilterProp="children"
            >
              {clients?.map((client: any) => (
                <Option key={client.id} value={client.id}>
                  {client.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Create User
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Client User"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          editForm.resetFields();
        }}
        footer={null}
        width={isMobile ? '95vw' : 500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Text type="secondary">{selectedUser?.email}</Text>
          </div>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone Number">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              <Option value={ClientUserStatus.ACTIVE}>Active</Option>
              <Option value={ClientUserStatus.INACTIVE}>Inactive</Option>
              <Option value={ClientUserStatus.BLOCKED}>Blocked</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="customerIds"
            label="Clients"
          >
            <Select 
              mode="multiple" 
              placeholder="Select clients"
              optionFilterProp="children"
            >
              {clients?.map((client: any) => (
                <Option key={client.id} value={client.id}>
                  {client.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isDownloadDisabled" label="Disable Downloads" valuePropName="checked">
            <Switch
              checkedChildren={<StopOutlined />}
              unCheckedChildren={<DownloadOutlined />}
            />
          </Form.Item>
          <Text type="secondary" className="text-xs -mt-4 mb-4 block">
            When enabled, this user cannot download any files regardless of individual file settings.
          </Text>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updating}>
              Update User
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientUsersAdmin;

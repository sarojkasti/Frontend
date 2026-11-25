import React, { useState } from "react";
import {
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
  Avatar,
  Tooltip,
  Card,
  Spin,
  Empty
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  StopOutlined,
  DownloadOutlined,
  LockOutlined,
  UsergroupAddOutlined
} from "@ant-design/icons";
import {
  useClientUsers,
  useCreateClientUser,
  useUpdateClientUser,
  useDeleteClientUser
} from "@/hooks/clientReport/useClientUsers";
import { ClientUserType, ClientUserStatus } from "@/types/clientUser";

const { Option } = Select;

interface ClientUsersTabProps {
  clientId: string;
  clientName: string;
}

const ClientUsersTab: React.FC<ClientUsersTabProps> = ({ clientId, clientName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUserType | null>(null);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: users, isLoading } = useClientUsers(clientId);
  const { mutate: createUser, isPending: creating } = useCreateClientUser();
  const { mutate: updateUser, isPending: updating } = useUpdateClientUser();
  const { mutate: deleteUser } = useDeleteClientUser();

  const handleOpenAddModal = () => {
    form.resetFields();
    // Lock the customerId to current client
    form.setFieldsValue({
      customerIds: [clientId],
      status: ClientUserStatus.ACTIVE,
      isDownloadDisabled: false
    });
    setIsModalOpen(true);
  };

  const handleCreateUser = (values: any) => {
    // Ensure customerIds includes current clientId
    const payload = {
      ...values,
      customerIds: [clientId]
    };

    createUser(payload, {
      onSuccess: () => {
        message.success(`Client user created for ${clientName}`);
        setIsModalOpen(false);
        form.resetFields();
      },
      onError: (err: any) => {
        message.error(err.response?.data?.message || "Failed to create client user");
      }
    });
  };

  const handleOpenEditModal = (record: ClientUserType) => {
    setSelectedUser(record);
    editForm.setFieldsValue({
      name: record.name,
      email: record.email,
      phoneNumber: record.phoneNumber,
      status: record.status,
      isDownloadDisabled: record.isDownloadDisabled
    });
    setIsEditModalOpen(true);
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
        onError: (err: any) => {
          message.error(err.response?.data?.message || "Failed to update user");
        }
      }
    );
  };

  const getStatusTag = (status: ClientUserStatus) => {
    switch (status) {
      case ClientUserStatus.ACTIVE:
        return <Tag color="success" className="rounded-full text-[11px]">Active</Tag>;
      case ClientUserStatus.INACTIVE:
        return <Tag color="default" className="rounded-full text-[11px]">Inactive</Tag>;
      case ClientUserStatus.BLOCKED:
        return <Tag color="error" className="rounded-full text-[11px]">Blocked</Tag>;
      default:
        return <Tag className="rounded-full text-[11px]">{status}</Tag>;
    }
  };

  const columns = [
    {
      title: "User Name & Email",
      key: "user",
      width: 240,
      render: (_: any, record: ClientUserType) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1677ff" }} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800 truncate text-xs sm:text-sm" title={record.name}>
              {record.name}
            </div>
            <a
              href={`mailto:${record.email}`}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 truncate"
              title={record.email}
            >
              <MailOutlined className="shrink-0 text-[11px]" />
              <span className="truncate">{record.email}</span>
            </a>
          </div>
        </div>
      )
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 150,
      render: (phone: string) =>
        phone ? (
          <a href={`tel:${phone}`} className="flex items-center gap-1 text-slate-700 hover:text-blue-600 text-xs whitespace-nowrap">
            <PhoneOutlined className="shrink-0 text-[11px] text-slate-400" />
            <span>{phone}</span>
          </a>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: ClientUserStatus) => getStatusTag(status)
    },
    {
      title: "Download Access",
      dataIndex: "isDownloadDisabled",
      key: "isDownloadDisabled",
      width: 140,
      render: (disabled: boolean, record: ClientUserType) => (
        <Tooltip title={disabled ? "Downloads disabled" : "Downloads enabled"}>
          <Switch
            checked={!disabled}
            size="small"
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
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right" as const,
      render: (_: any, record: ClientUserType) => (
        <Space size="small">
          <Tooltip title="Edit User">
            <Button
              type="text"
              icon={<EditOutlined className="text-slate-500 hover:text-blue-600" />}
              size="small"
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete client user?"
            description="This user will lose access to portal reports."
            onConfirm={() => {
              deleteUser(record.id, {
                onSuccess: () => message.success("Client user deleted"),
                onError: () => message.error("Failed to delete user")
              });
            }}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined className="text-red-500 hover:text-red-700" />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const userList = Array.isArray(users) ? users : [];

  return (
    <Card size="small" className="border-slate-200 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <UsergroupAddOutlined className="text-blue-600 text-sm" />
            <span className="font-semibold text-slate-800 text-xs sm:text-sm">
              Client Portal Users & Report Access ({userList.length})
            </span>
          </div>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Authorized staff and client representatives from <strong>{clientName}</strong> who can log in to the client portal to view deliverables and download reports.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAddModal}
          size="small"
          className="self-start sm:self-center"
        >
          Add Client User
        </Button>
      </div>

      {userList.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-1.5 py-1">
              <div className="text-slate-700 font-medium text-xs">
                No client portal users added for {clientName} yet
              </div>
              <div className="text-slate-400 text-xs max-w-md mx-auto">
                Invite representatives from this client to grant them secure self-service access to view published audit reports, tax documents, and compliance statuses.
              </div>
            </div>
          }
        >
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleOpenAddModal} className="mt-1">
            Add First Client User
          </Button>
        </Empty>
      ) : (
        <Table
          loading={isLoading}
          dataSource={userList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          size="small"
          className="mt-2"
        />
      )}

      {/* Add Client User Modal */}
      <Modal
        title={
          <Space>
            <UsergroupAddOutlined style={{ color: "#1677ff" }} />
            <span>Add Client User for {clientName}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser} className="mt-3">
          {/* LOCKED Client Name Field */}
          <Form.Item label="Assigned Client" required>
            <Input
              value={clientName}
              disabled
              prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
              suffix={<Tag color="blue">Locked</Tag>}
              style={{ backgroundColor: "#f8fafc", color: "#1e293b", fontWeight: 600 }}
            />
          </Form.Item>

          {/* Hidden customerIds array containing locked clientId */}
          <Form.Item name="customerIds" hidden initialValue={[clientId]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter user's name" }]}
          >
            <Input placeholder="John Doe" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" }
            ]}
          >
            <Input placeholder="john@clientcompany.com" prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item name="password" label="Portal Password (Optional)">
            <Input.Password placeholder="Set password for client portal login" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone Number">
            <Input placeholder="+977 9800000000" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item name="status" label="Account Status" initialValue={ClientUserStatus.ACTIVE}>
            <Select>
              <Option value={ClientUserStatus.ACTIVE}>Active</Option>
              <Option value={ClientUserStatus.INACTIVE}>Inactive</Option>
              <Option value={ClientUserStatus.BLOCKED}>Blocked</Option>
            </Select>
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Create Client User
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Client User Modal */}
      <Modal
        title="Edit Client User"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUser} className="mt-3">
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please enter user's name" }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" }
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone Number">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item name="status" label="Account Status">
            <Select>
              <Option value={ClientUserStatus.ACTIVE}>Active</Option>
              <Option value={ClientUserStatus.INACTIVE}>Inactive</Option>
              <Option value={ClientUserStatus.BLOCKED}>Blocked</Option>
            </Select>
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
            <Button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={updating}>
              Update User
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default ClientUsersTab;

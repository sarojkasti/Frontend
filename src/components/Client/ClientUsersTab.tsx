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
  Spin
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
      title: "User Name",
      key: "user",
      render: (_: any, record: ClientUserType) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1677ff" }} />
          <div>
            <div className="font-semibold text-slate-800">{record.name}</div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MailOutlined /> {record.email}
            </span>
          </div>
        </div>
      )
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phone: string) =>
        phone ? (
          <span className="flex items-center gap-1 text-slate-700">
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
      title: "Download Access",
      dataIndex: "isDownloadDisabled",
      key: "isDownloadDisabled",
      render: (disabled: boolean, record: ClientUserType) => (
        <Tooltip title={disabled ? "Downloads disabled" : "Downloads enabled"}>
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
      title: "Actions",
      key: "actions",
      render: (_: any, record: ClientUserType) => (
        <Space size="middle">
          <Tooltip title="Edit User">
            <Button
              type="default"
              icon={<EditOutlined />}
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
              <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <UsergroupAddOutlined style={{ color: "#1677ff" }} />
            Client Contact & Portal Users ({users?.length || 0})
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            Staff representatives & users for <strong>{clientName}</strong> who can access reports on client portal
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal}>
          Add Client User
        </Button>
      </div>

      <Table
        loading={isLoading}
        dataSource={users || []}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

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
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
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
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
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
    </div>
  );
};

export default ClientUsersTab;

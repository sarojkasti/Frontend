import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  DownloadOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined
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
import ResponsiveTable from "@/components/ui/MobileCardList";

const { Title, Text } = Typography;
const { Option } = Select;

const ClientUsersAdmin: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUserType | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  const toggleExpandCard = (id: string | number) => {
    const strId = String(id);
    setExpandedCardIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  };
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

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery?.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u: ClientUserType) => {
      const name = u.name || "";
      const email = u.email || "";
      const phone = u.phoneNumber || "";
      const customers = u.customers?.map((c: any) => c.name).join(" ") || "";
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        customers.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  const renderClientUserCard = (record: ClientUserType) => {
    const isExpanded = expandedCardIds.includes(String(record.id));
    return (
      <div className="flex flex-col gap-2">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar icon={<UserOutlined />} className="shrink-0 bg-blue-500" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-gray-900 text-sm block truncate">{record.name}</span>
              <span className="text-xs text-gray-500 block truncate">{record.email}</span>
            </div>
          </div>

          {/* Action Icons: Edit, Delete, Toggle Details */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
              onClick={(e) => {
                e.stopPropagation();
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
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
              title="Edit User"
              aria-label="Edit User"
            />
            <Popconfirm
              title="Delete this user?"
              description="This will permanently remove their access."
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="text"
                size="small" 
                danger 
                icon={<DeleteOutlined style={{ fontSize: "16px", color: "#ff4d4f" }} />} 
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-red-50 text-red-600"
                title="Delete User"
                aria-label="Delete User"
              />
            </Popconfirm>
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
              <span className="text-gray-500 font-medium shrink-0">Status:</span>
              <Tag color={record.status === ClientUserStatus.ACTIVE ? "green" : "red"} className="m-0">
                {record.status?.toUpperCase()}
              </Tag>
            </div>
            {record.phoneNumber && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500 font-medium shrink-0">Phone:</span>
                <span className="font-semibold text-gray-800 text-right">{record.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Clients:</span>
              <span className="font-semibold text-gray-800 text-right truncate max-w-[180px]">
                {record.customers && record.customers.length > 0
                  ? record.customers.map((c: any) => c.name).join(", ")
                  : "No clients assigned"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Downloads:</span>
              <span className="font-semibold text-gray-800 text-right">
                {record.isDownloadDisabled ? "Disabled" : "Enabled"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 font-medium shrink-0">Created:</span>
              <span className="font-semibold text-gray-800 text-right">
                {format(new Date(record.createdAt), "PP")}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 relative min-h-[400px]">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/client')}
            title="Back to Clients"
          />
          <Title level={isMobile ? 4 : 3} className="!mb-0">
            Client Portal Users
          </Title>
        </div>
        {!isMobile && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Client User
          </Button>
        )}
      </div>

      {/* Mobile search bar toggle */}
      {isMobile && showMobileSearch && (
        <div className="mb-4">
          <Input.Search
            placeholder="Search client users by name, email, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            autoFocus
            className="w-full shadow-sm"
          />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4" styles={{ body: { padding: isMobile ? '12px' : '20px' } }}>
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
      <Card styles={{ body: { padding: isMobile ? '12px' : '20px' } }}>
        <ResponsiveTable
          tableProps={{
            dataSource: filteredUsers,
            columns: columns,
            rowKey: "id",
            loading: isLoading,
            pagination: isMobile ? false : { pageSize: 10 },
            scroll: { x: 'max-content' },
          }}
          renderMobileCard={renderClientUserCard}
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

      {/* Floating Action Buttons for Mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-lg active:scale-95 transition-all"
            aria-label="Search Client Users"
          >
            {showMobileSearch ? <CloseOutlined /> : <SearchOutlined />}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all hover:bg-blue-700"
            aria-label="Add Client User"
          >
            <PlusOutlined />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientUsersAdmin;

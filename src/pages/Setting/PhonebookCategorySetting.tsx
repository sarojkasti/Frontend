import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PhoneOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import { useSession } from "@/context/SessionContext";
import {
  useCreatePhonebookCategory,
  useDeletePhonebookCategory,
  usePhonebookCategories,
} from "@/hooks/phonebook/usePhonebook";
import { PhonebookCategory } from "@/types/phonebook";

const { Title, Text } = Typography;

const CATEGORY_COLUMNS_DEF = [
  { key: "name", label: "Category Name", required: true },
  { key: "description", label: "Description" },
  { key: "isActive", label: "Status" },
  { key: "createdAt", label: "Created At" },
  { key: "actions", label: "Actions", required: true },
];

const PhonebookCategorySetting: React.FC = () => {
  const navigate = useNavigate();
  const { permissionChecker } = useSession();
  const isSuperUser = permissionChecker.isSuperAdmin();

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: categories = [], isLoading } = usePhonebookCategories();
  const { mutateAsync: createCategory, isPending: creating } =
    useCreatePhonebookCategory();
  const { mutateAsync: deleteCategory } = useDeletePhonebookCategory();

  const { visibleColumnKeys } = useColumnVisibility({
    persistenceKey: "phonebook_category_setting",
    columns: CATEGORY_COLUMNS_DEF,
  });

  const handleCreate = async (values: any) => {
    try {
      await createCategory({
        name: values.name,
        description: values.description || undefined,
      });
      message.success("Phonebook category added");
      form.resetFields();
      setModalOpen(false);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to add category");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success("Category deleted");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to delete category");
    }
  };

  const columns: PowerTableColumn<PhonebookCategory>[] = [
    {
      key: "name",
      title: "Category Name",
      dataIndex: "name",
      searchable: true,
      defaultWidth: 220,
      render: (val) => (
        <span className="font-medium text-slate-900">{val}</span>
      ),
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      defaultWidth: 300,
      render: (val) =>
        val ? (
          <span className="text-slate-600">{val}</span>
        ) : (
          <Text type="secondary" className="text-xs">
            —
          </Text>
        ),
    },
    {
      key: "isActive",
      title: "Status",
      dataIndex: "isActive",
      defaultWidth: 120,
      render: (val) => (
        <Tag color={val !== false ? "green" : "default"}>
          {val !== false ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      key: "createdAt",
      title: "Created At",
      dataIndex: "createdAt",
      defaultWidth: 160,
      render: (val) =>
        val ? dayjs(val).format("YYYY-MM-DD HH:mm") : "—",
    },
    {
      key: "actions",
      title: "Actions",
      required: true,
      defaultWidth: 100,
      render: (_val, record) =>
        isSuperUser ? (
          <Popconfirm
            title="Delete this category?"
            description="Existing numbers in this category will become uncategorized."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete (Super User only)">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        ) : (
          <Text type="secondary" className="text-xs">
            —
          </Text>
        ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/settings")}
          >
            Back
          </Button>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <PhoneOutlined className="mr-2 text-blue-600" />
              Phonebook Categories
            </Title>
            <Text type="secondary">
              Add and manage categories for phonebook numbers
            </Text>
          </div>
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Add Category
        </Button>
      </div>

      <Card>
        <PowerTable<PhonebookCategory>
          dataSource={categories}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          enableResize
          enableColumnSearch
          visibleColumnKeys={visibleColumnKeys}
          showToolbar={false}
          persistenceKey="phonebook_category_setting_table"
          pagination={{ pageSize: 15 }}
          emptyTitle="No phonebook categories"
          emptyDescription="Add your first phonebook category to organize numbers."
        />
      </Card>

      <Modal
        title="Add Phonebook Category"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-3">
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input placeholder="e.g. Banks, Vendors, Government Offices" />
          </Form.Item>

          <Form.Item name="description" label="Description (Optional)">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Add Category
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PhonebookCategorySetting;

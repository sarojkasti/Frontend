import React, { useState } from "react";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  useDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
  useToggleDocumentTypeStatus,
} from "@/hooks/clientReport/useClientReportDocumentTypes";
import { useClient } from "@/hooks/client/useClient";
import {
  ClientReportDocumentTypeType,
  CreateClientReportDocumentTypePayload,
  UpdateClientReportDocumentTypePayload,
} from "@/types/clientReportDocumentType";

const CLIENT_REPORT_DOC_TYPE_COLUMNS = [
  { key: "name", label: "Name", required: true },
  { key: "scope", label: "Scope" },
  { key: "sortOrder", label: "Sort Order" },
  { key: "isActive", label: "Status" },
  { key: "actions", label: "Actions", required: true },
];

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ClientReportDocumentTypeSetting: React.FC = () => {
  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "client_report_doc_types",
    columns: CLIENT_REPORT_DOC_TYPE_COLUMNS,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ClientReportDocumentTypeType | null>(null);
  const [form] = Form.useForm();

  const { data: documentTypes, isLoading } = useDocumentTypes();
  const { data: clients } = useClient();
  const { mutate: createType, isPending: creating } = useCreateDocumentType();
  const { mutate: updateType, isPending: updating } = useUpdateDocumentType();
  const { mutate: deleteType } = useDeleteDocumentType();
  const { mutate: toggleStatus } = useToggleDocumentTypeStatus();

  const handleOpenModal = (type?: ClientReportDocumentTypeType) => {
    if (type) {
      setEditingType(type);
      form.setFieldsValue({
        name: type.name,
        description: type.description,
        customerId: type.customerId,
        sortOrder: type.sortOrder,
        isActive: type.isActive,
        isGlobal: type.isGlobal,
      });
    } else {
      setEditingType(null);
      form.resetFields();
      form.setFieldsValue({ isActive: true, isGlobal: true, sortOrder: 0 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    form.resetFields();
  };

  const handleSubmit = (values: CreateClientReportDocumentTypePayload | UpdateClientReportDocumentTypePayload) => {
    // If global, don't send customerId
    if (values.isGlobal) {
      delete values.customerId;
    }

    if (editingType) {
      updateType(
        { id: editingType.id, payload: values },
        {
          onSuccess: () => {
            message.success("Document type updated successfully");
            handleCloseModal();
          },
          onError: (err: any) => {
            message.error(err.response?.data?.message || "Failed to update document type");
          },
        }
      );
    } else {
      createType(values as CreateClientReportDocumentTypePayload, {
        onSuccess: () => {
          message.success("Document type created successfully");
          handleCloseModal();
        },
        onError: (err: any) => {
          message.error(err.response?.data?.message || "Failed to create document type");
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteType(id, {
      onSuccess: () => {
        message.success("Document type deleted successfully");
      },
      onError: (err: any) => {
        message.error(err.response?.data?.message || "Failed to delete document type");
      },
    });
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus(id, {
      onSuccess: () => {
        message.success("Status updated successfully");
      },
      onError: () => {
        message.error("Failed to update status");
      },
    });
  };

  const columns: PowerTableColumn<ClientReportDocumentTypeType>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      defaultWidth: 220,
      render: (name: string, record: ClientReportDocumentTypeType) => (
        <div>
          <div className="font-medium">{name}</div>
          {record.description && (
            <Text type="secondary" className="text-xs">
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Scope",
      key: "scope",
      defaultWidth: 140,
      render: (_: any, record: ClientReportDocumentTypeType) => (
        record.isGlobal ? (
          <Tag icon={<GlobalOutlined />} color="blue">Global</Tag>
        ) : (
          <Tooltip title={record.customer?.name || "Customer"}>
            <Tag icon={<UserOutlined />} color="green">
              {record.customer?.shortName || record.customer?.name || "Customer Specific"}
            </Tag>
          </Tooltip>
        )
      ),
    },
    {
      title: "Sort Order",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 100,
      defaultWidth: 100,
      align: "center" as const,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      defaultWidth: 120,
      render: (isActive: boolean, record: ClientReportDocumentTypeType) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record.id)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      defaultWidth: 140,
      required: true,
      fixed: "right",
      render: (_: any, record: ClientReportDocumentTypeType) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this document type?"
            description="This action cannot be undone. Reports with this type will have their type removed."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="!mb-1">
            Client Report Document Types
          </Title>
          <Text type="secondary">
            Manage document types for client reports. Global types are available for all clients.
          </Text>
        </div>
        <Space>
          {columnCustomizer}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Add Document Type
          </Button>
        </Space>
      </div>

      <Card>
        <PowerTable<ClientReportDocumentTypeType>
          dataSource={documentTypes}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          enableResize
          enableColumnSearch
          showToolbar={false}
          visibleColumnKeys={visibleColumnKeys}
          persistenceKey="client_report_doc_types"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingType ? "Edit Document Type" : "Add Document Type"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true, isGlobal: true, sortOrder: 0 }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter document type name" },
              { min: 2, message: "Name must be at least 2 characters" },
              { max: 100, message: "Name cannot exceed 100 characters" },
            ]}
          >
            <Input placeholder="e.g., Annual Report, Tax Return, Financial Statement" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 500, message: "Description cannot exceed 500 characters" }]}
          >
            <TextArea rows={3} placeholder="Optional description for this document type" />
          </Form.Item>

          <Form.Item
            name="isGlobal"
            label="Scope"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Global (All Clients)"
              unCheckedChildren="Customer Specific"
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.isGlobal !== curr.isGlobal}
          >
            {({ getFieldValue }) => (
              !getFieldValue("isGlobal") && (
                <Form.Item
                  name="customerId"
                  label="Customer"
                  rules={[{ required: true, message: "Please select a customer" }]}
                >
                  <Select placeholder="Select customer" allowClear>
                    {clients?.map((client: any) => (
                      <Option key={client.id} value={client.id}>
                        {client.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )
            )}
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="Sort Order"
            rules={[{ type: "number", min: 0, message: "Sort order must be 0 or higher" }]}
          >
            <InputNumber min={0} placeholder="0" className="w-full" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creating || updating}
            >
              {editingType ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientReportDocumentTypeSetting;

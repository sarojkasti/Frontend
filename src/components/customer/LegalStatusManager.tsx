import React, { useEffect, useState } from "react";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Select } from "antd";
import {
  fetchLegalStatuses,
  createLegalStatus,
  updateLegalStatus,
  deleteLegalStatus,
  LegalStatus
} from "@/service/legalStatus.service";

const { Option } = Select;

const LegalStatusManager: React.FC = () => {
  const [data, setData] = useState<LegalStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<LegalStatus | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetchLegalStatuses();
      setData(res);
    } catch (err) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' }); // Set default status
    setModalVisible(true);
  };

  const handleEdit = (record: LegalStatus) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLegalStatus(id);
      message.success("Deleted successfully");
      fetchData();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateLegalStatus(editing.id, values);
        message.success("Updated successfully");
      } else {
        await createLegalStatus(values);
        message.success("Added successfully");
      }
      setModalVisible(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch {
      // validation or API error
    }
  };

  const columns: PowerTableColumn<LegalStatus>[] = [
    { title: "Name", dataIndex: "name", key: "name", defaultWidth: 200 },
    { title: "Description", dataIndex: "description", key: "description", defaultWidth: 250 },
    { title: "Status", dataIndex: "status", key: "status", defaultWidth: 120, 
      render: (status: string) => (
        <span style={{ 
          color: status === 'active' ? 'green' : 'red',
          textTransform: 'capitalize'
        }}>
          {status}
        </span>
      )
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      defaultWidth: 140,
      required: true,
      fixed: "right",
      render: (_: any, record: LegalStatus) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "customer_legal_status",
    columns,
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <Button type="primary" onClick={handleAdd}>
          Add Legal Status
        </Button>
        {columnCustomizer}
      </div>
      <PowerTable<LegalStatus>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        enableResize
        enableColumnSearch
        visibleColumnKeys={visibleColumnKeys}
        showToolbar={false}
        persistenceKey="customer_legal_status"
        pagination={false}
      />
      <Modal
        title={editing ? "Edit Legal Status" : "Add Legal Status"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input name" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LegalStatusManager;

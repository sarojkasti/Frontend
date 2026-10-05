import React, { useEffect, useState } from "react";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message } from "antd";
import {
  fetchBusinessNatures,
  createBusinessNature,
  updateBusinessNature,
  deleteBusinessNature,
  BusinessNature
} from "@/service/businessNature.service";

const BusinessNatureManager: React.FC = () => {
  const [data, setData] = useState<BusinessNature[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<BusinessNature | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetchBusinessNatures();
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
    setModalVisible(true);
  };

  const handleEdit = (record: BusinessNature) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBusinessNature(id);
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
        await updateBusinessNature(editing.id, values);
        message.success("Updated successfully");
      } else {
        await createBusinessNature(values);
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

  const columns: PowerTableColumn<BusinessNature>[] = [
    { title: "Name", dataIndex: "name", key: "name", defaultWidth: 200 },
    { title: "Short Name", dataIndex: "shortName", key: "shortName", defaultWidth: 150 },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      defaultWidth: 140,
      required: true,
      fixed: "right",
      render: (_: any, record: BusinessNature) => (
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
    persistenceKey: "customer_business_nature",
    columns,
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <Button type="primary" onClick={handleAdd}>
          Add Business Nature
        </Button>
        {columnCustomizer}
      </div>
      <PowerTable<BusinessNature>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        enableResize
        enableColumnSearch
        visibleColumnKeys={visibleColumnKeys}
        showToolbar={false}
        persistenceKey="customer_business_nature"
        pagination={false}
      />
      <Modal
        title={editing ? "Edit Business Nature" : "Add Business Nature"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input name" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="shortName" label="Short Name" rules={[{ required: true, message: "Please input short name" }]}> 
            <Input maxLength={10} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BusinessNatureManager;

import React, { useEffect, useState } from "react";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message } from "antd";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  Department
} from "@/service/department.service";

const DepartmentManager: React.FC = () => {
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetchDepartments();
      setData(res);
    } catch (err) {
      message.error("Failed to fetch departments");
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

  const handleEdit = (record: Department) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment(id);
      message.success("Department deleted successfully");
      fetchData();
    } catch {
      message.error("Failed to delete department");
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateDepartment(editing.id, values);
        message.success("Department updated successfully");
      } else {
        await createDepartment(values);
        message.success("Department added successfully");
      }
      setModalVisible(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch {
      // validation or API error
    }
  };

  const columns: PowerTableColumn<Department>[] = [
    { title: "Name", dataIndex: "name", key: "name", defaultWidth: 200 },
    { title: "Short Name", dataIndex: "shortName", key: "shortName", defaultWidth: 150 },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      defaultWidth: 140,
      required: true,
      fixed: "right",
      render: (_: any, record: Department) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Are you sure you want to delete this department?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "department_manager_table",
    columns,
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <Button type="primary" onClick={handleAdd}>
          Add Department
        </Button>
        {columnCustomizer}
      </div>
      <PowerTable<Department>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        enableResize
        enableColumnSearch
        visibleColumnKeys={visibleColumnKeys}
        showToolbar={false}
        persistenceKey="department_manager_table"
        pagination={false}
      />
      <Modal
        title={editing ? "Edit Department" : "Add Department"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please enter department name" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="shortName" label="Short Name" rules={[{ required: true, message: "Please enter short name" }]}> 
            <Input maxLength={10} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DepartmentManager;
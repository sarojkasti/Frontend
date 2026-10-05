import { useState, useEffect } from "react";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import { 
    Table, 
    Button, 
    Space, 
    Modal, 
    Form, 
    Input, 
    Select,
    Switch, 
    Typography,
    Popconfirm,
    Tag,
    message
} from "antd";
import { 
    EditOutlined, 
    DeleteOutlined, 
    PlusOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined
} from "@ant-design/icons";
import { TaskType, TodoTaskTitle } from "@/types/todoTask";
const { Title } = Typography;
const { TextArea } = Input;
interface TaskTypeListProps {
    taskTypes: TaskType[];
    titles: TodoTaskTitle[];
    loading: boolean;
    onAdd?: (taskType: Partial<TaskType>) => void;
    onEdit?: (id: string, taskType: Partial<TaskType>) => void;
    onDelete?: (id: string) => void;
}
const TaskTypeList = ({
    taskTypes,
    titles,
    loading,
    onAdd,
    onEdit,
    onDelete
}: TaskTypeListProps) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Debug log when taskTypes change
    useEffect(() => {
    }, [taskTypes]);
    const showAddModal = () => {
        if (!onAdd) {
            message.error('You do not have permission to add task types');
            return;
        }
        setEditingTaskType(null);
        form.resetFields();
        form.setFieldsValue({ isActive: true }); // Set default active state
        setModalVisible(true);
    };
    const showEditModal = (taskType: TaskType) => {
        if (!onEdit) {
            message.error('You do not have permission to edit task types');
            return;
        }
        setEditingTaskType(taskType);
        form.setFieldsValue(taskType);
        setModalVisible(true);
    };
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            if (editingTaskType) {
                if (onEdit) {
                    await onEdit(editingTaskType.id, values);
                } else {
                    message.error('You do not have permission to edit task types');
                }
            } else {
                if (onAdd) {
                    await onAdd(values);
                } else {
                    message.error('You do not have permission to add task types');
                }
            }
            setModalVisible(false);
        } catch (error) {
        } finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id: string) => {
        if (onDelete) {
            setDeletingId(id);
            try {
                await onDelete(id);
            } finally {
                setDeletingId(null);
            }
        } else {
            message.error('You do not have permission to delete task types');
        }
    };
    const columns: PowerTableColumn<TaskType>[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            defaultWidth: 200,
        },
        {
            title: 'Title (Group)',
            key: 'todoTaskTitle',
            defaultWidth: 160,
            render: (_: any, record: TaskType) => (
                record.todoTaskTitle ? 
                <Tag color="blue">{record.todoTaskTitle.name}</Tag> : 
                <Tag color="default">Unassigned</Tag>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            defaultWidth: 250,
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            defaultWidth: 120,
            render: (isActive: boolean) => (
                isActive ? 
                <Tag color="green">Active</Tag> : 
                <Tag color="red">Inactive</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            defaultWidth: 140,
            required: true,
            fixed: 'right',
            render: (_: any, record: TaskType) => (
                <Space>
                    {onEdit && (
                        <Button 
                            icon={<EditOutlined />} 
                            size="small"
                            onClick={() => showEditModal(record)}
                        />
                    )}
                    {onDelete && (
                        <Popconfirm
                            title="Are you sure you want to delete this task type?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                            okButtonProps={{ loading: deletingId === record.id }}
                        >
                            <Button 
                                icon={deletingId === record.id ? <LoadingOutlined /> : <DeleteOutlined />} 
                                size="small" 
                                danger
                                loading={deletingId === record.id}
                            />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
        persistenceKey: "task_type_list",
        columns,
    });

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Task Types</Title>
                <Space>
                    {columnCustomizer}
                    {onAdd && (
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={showAddModal}
                        >
                            Add Task Type
                        </Button>
                    )}
                </Space>
            </div>
            <PowerTable<TaskType>
                columns={columns}
                dataSource={taskTypes}
                rowKey="id"
                loading={loading}
                enableResize
                enableColumnSearch
                visibleColumnKeys={visibleColumnKeys}
                showToolbar={false}
                persistenceKey="task_type_list"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                locale={{ emptyText: 'No task types found' }}
            />
            <Modal
                title={editingTaskType ? "Edit Task Type" : "Add Task Type"}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                okText={editingTaskType ? "Save" : "Create"}
                confirmLoading={submitting}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="titleId"
                        label="Title (Group)"
                        rules={[{ required: false }]}
                    >
                        <Select
                            placeholder="Select a title group"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase()?.includes(input.toLowerCase())
                            }
                        >
                            {titles.filter(t => t.isActive).map(title => (
                                <Select.Option key={title.id} value={title.id}>{title.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter a name' }]}
                    >
                        <Input placeholder="Enter task type name" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={4} placeholder="Enter description (optional)" />
                    </Form.Item>
                    <Form.Item
                        name="isActive"
                        label="Active"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default TaskTypeList;
import { useState } from "react";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import { 
    Table, 
    Button, 
    Space, 
    Modal, 
    Form, 
    Input, 
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
import { TodoTaskTitle } from "@/types/todoTask";

const TODO_TASK_TITLE_COLUMNS = [
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'taskTypes', label: 'Task Types' },
    { key: 'isActive', label: 'Status' },
    { key: 'actions', label: 'Actions', required: true },
];

const { Title } = Typography;
const { TextArea } = Input;

interface TodoTaskTitleListProps {
    titles: TodoTaskTitle[];
    loading: boolean;
    onAdd?: (title: Partial<TodoTaskTitle>) => void;
    onEdit?: (id: string, title: Partial<TodoTaskTitle>) => void;
    onDelete?: (id: string) => void;
}

const TodoTaskTitleList = ({
    titles,
    loading,
    onAdd,
    onEdit,
    onDelete
}: TodoTaskTitleListProps) => {
    const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
        persistenceKey: "todo_task_title_list",
        columns: TODO_TASK_TITLE_COLUMNS,
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTitle, setEditingTitle] = useState<TodoTaskTitle | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const showAddModal = () => {
        if (!onAdd) {
            message.error('You do not have permission to add titles');
            return;
        }
        setEditingTitle(null);
        form.resetFields();
        form.setFieldsValue({ isActive: true });
        setModalVisible(true);
    };
    const showEditModal = (title: TodoTaskTitle) => {
        if (!onEdit) {
            message.error('You do not have permission to edit titles');
            return;
        }
        setEditingTitle(title);
        form.setFieldsValue(title);
        setModalVisible(true);
    };
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            if (editingTitle) {
                if (onEdit) {
                    await onEdit(editingTitle.id, values);
                }
            } else {
                if (onAdd) {
                    await onAdd(values);
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
        }
    };
    const columns: PowerTableColumn<TodoTaskTitle>[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            defaultWidth: 200,
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            defaultWidth: 250,
            ellipsis: true,
        },
        {
            title: 'Task Types',
            dataIndex: 'taskTypes',
            key: 'taskTypes',
            defaultWidth: 220,
            render: (taskTypes: any[]) => (
                <Space wrap>
                    {taskTypes && taskTypes.length > 0 ? (
                        taskTypes.map((tt: any) => (
                            <Tag key={tt.id} color="blue">{tt.name}</Tag>
                        ))
                    ) : (
                        <Tag color="default">None</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
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
            render: (_: any, record: TodoTaskTitle) => (
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
                            title="Are you sure you want to delete this title?"
                            description="All task types under this title will be unlinked."
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
    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={5} style={{ margin: 0 }}>Titles</Title>
                <Space>
                    {columnCustomizer}
                    {onAdd && (
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={showAddModal}
                        >
                            Add Title
                        </Button>
                    )}
                </Space>
            </div>
            <PowerTable<TodoTaskTitle>
                columns={columns}
                dataSource={titles}
                rowKey="id"
                loading={loading}
                enableResize
                enableColumnSearch
                showToolbar={false}
                visibleColumnKeys={visibleColumnKeys}
                persistenceKey="todo_task_title_list"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                locale={{ emptyText: 'No titles found' }}
            />
            <Modal
                title={editingTitle ? "Edit Title" : "Add Title"}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                okText={editingTitle ? "Save" : "Create"}
                confirmLoading={submitting}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter a name' }]}
                    >
                        <Input placeholder="Enter title name" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea rows={3} placeholder="Enter description (optional)" />
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
export default TodoTaskTitleList;

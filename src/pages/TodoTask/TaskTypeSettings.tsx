import { useState, useEffect } from "react";
import { Card, Typography, message, Button, Space, Empty, Tabs } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import TaskTypeList from "@/components/TaskType/TaskTypeList";
import TodoTaskTitleList from "@/components/TodoTaskTitle/TodoTaskTitleList";
import { TaskType, TodoTaskTitle } from "@/types/todoTask";
import { useNavigate } from "react-router-dom";
import { permissionConfig } from "@/utils/permission-config";
import { hasPermission } from "@/utils/utils";
import { 
    fetchTaskTypes as fetchTaskTypesAPI, 
    createTaskType, 
    updateTaskType, 
    deleteTaskType as deleteTaskTypeAPI 
} from "@/service/taskType.service";
import {
    fetchTodoTaskTitles as fetchTitlesAPI,
    createTodoTaskTitle,
    updateTodoTaskTitle,
    deleteTodoTaskTitle as deleteTitleAPI
} from "@/service/todoTaskTitle.service";

const { Title } = Typography;

const TaskTypeSettings = () => {
    const navigate = useNavigate();
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [titles, setTitles] = useState<TodoTaskTitle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTitlesLoading, setIsTitlesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check permissions using the hasPermission utility
    const canCreateTaskTypes = hasPermission(permissionConfig.CREATE_TASK_TYPE);
    const canEditTaskTypes = hasPermission(permissionConfig.UPDATE_TASK_TYPE);
    const canDeleteTaskTypes = hasPermission(permissionConfig.DELETE_TASK_TYPE);
    
    const canCreateTitles = hasPermission(permissionConfig.CREATE_TODO_TASK_TITLE);
    const canEditTitles = hasPermission(permissionConfig.UPDATE_TODO_TASK_TITLE);
    const canDeleteTitles = hasPermission(permissionConfig.DELETE_TODO_TASK_TITLE);

    // Fetch task types from API
    const fetchTaskTypes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetchTaskTypesAPI();
            setTaskTypes(Array.isArray(response) ? response : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load task types";
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch titles from API
    const fetchTitles = async () => {
        setIsTitlesLoading(true);
        try {
            const response = await fetchTitlesAPI();
            setTitles(Array.isArray(response) ? response : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load titles";
            message.error(errorMessage);
        } finally {
            setIsTitlesLoading(false);
        }
    };

    // Title handlers
    const handleAddTitle = async (title: Partial<TodoTaskTitle>) => {
        try {
            await createTodoTaskTitle(title);
            message.success('Title created successfully');
            fetchTitles();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create title";
            message.error(errorMessage);
        }
    };

    const handleEditTitle = async (id: string, title: Partial<TodoTaskTitle>) => {
        try {
            await updateTodoTaskTitle({ id, payload: title });
            message.success('Title updated successfully');
            fetchTitles();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update title";
            message.error(errorMessage);
        }
    };

    const handleDeleteTitle = async (id: string) => {
        try {
            await deleteTitleAPI(id);
            message.success('Title deleted successfully');
            fetchTitles();
            fetchTaskTypes(); // Refresh task types since their titleId might be affected
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete title";
            message.error(errorMessage);
        }
    };

    // Task type handlers
    const handleAddTaskType = async (taskType: Partial<TaskType>) => {
        try {
            await createTaskType(taskType);
            message.success('Task type created successfully');
            fetchTaskTypes();
            fetchTitles(); // Refresh titles to update task type counts
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create task type";
            message.error(errorMessage);
        }
    };

    const handleEditTaskType = async (id: string, taskType: Partial<TaskType>) => {
        try {
            await updateTaskType({ id, payload: taskType });
            message.success('Task type updated successfully');
            fetchTaskTypes();
            fetchTitles(); // Refresh titles to update task type counts
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update task type";
            message.error(errorMessage);
        }
    };

    const handleDeleteTaskType = async (id: string) => {
        try {
            await deleteTaskTypeAPI(id);
            message.success('Task type deleted successfully');
            fetchTaskTypes();
            fetchTitles();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete task type";
            message.error(errorMessage);
        }
    };

    useEffect(() => {
        fetchTaskTypes();
        fetchTitles();
    }, []);

    return (
        <Card
            title={
                <Space>
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/settings')}
                    >
                        Back to Settings
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>Task Settings</Title>
                </Space>
            }
            extra={
                <Button 
                    onClick={() => { fetchTaskTypes(); fetchTitles(); }} 
                    disabled={isLoading || isTitlesLoading}
                >
                    Refresh
                </Button>
            }
        >
            {error && !isLoading ? (
                <Empty 
                    description={
                        <span>
                            Error: {error}
                            <br />
                            <Button type="link" onClick={() => { fetchTaskTypes(); fetchTitles(); }}>
                                Try again
                            </Button>
                        </span>
                    }
                />
            ) : (
                <Tabs 
                    defaultActiveKey="titles" 
                    items={[
                        {
                            key: "titles",
                            label: "Titles",
                            children: (
                                <TodoTaskTitleList
                                    titles={titles}
                                    loading={isTitlesLoading}
                                    onAdd={canCreateTitles ? handleAddTitle : undefined}
                                    onEdit={canEditTitles ? handleEditTitle : undefined}
                                    onDelete={canDeleteTitles ? handleDeleteTitle : undefined}
                                />
                            )
                        },
                        {
                            key: "taskTypes",
                            label: "Task Types",
                            children: (
                                <TaskTypeList 
                                    taskTypes={taskTypes}
                                    titles={titles}
                                    loading={isLoading}
                                    onAdd={canCreateTaskTypes ? handleAddTaskType : undefined}
                                    onEdit={canEditTaskTypes ? handleEditTaskType : undefined}
                                    onDelete={canDeleteTaskTypes ? handleDeleteTaskType : undefined}
                                />
                            )
                        }
                    ]}
                />
            )}
        </Card>
    );
};

export default TaskTypeSettings;
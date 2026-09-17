import { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Space,
  Typography,
  Button,
  Select,
  Alert,
  DatePicker,
  Modal,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  OrderedListOutlined,
  SettingOutlined,
  DeleteOutlined,
  ClearOutlined,
  SearchOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useSession } from "@/context/SessionContext";
import TodoTaskTable from "@/components/TodoTask/TodoTaskTable";
import TodoTaskForm from "@/components/TodoTask/TodoTaskForm";
import TodoTaskDetails from "@/components/TodoTask/TodoTaskDetails";
import { TodoTask, TodoTaskStatus } from "@/types/todoTask";
import { fetchTaskTypes } from "@/service/taskType.service";
import { fetchTodoTaskTitles } from "@/service/todoTaskTitle.service";
import { listActiveUsers } from "@/service/user.service";
import {
  fetchTodoTasks,
  fetchTodoTasksByAssignedUser,
  fetchTodoTasksByCreatedUser,
  fetchInformedTodoTasks,
  createTodoTask,
  updateTodoTask,
  deleteTodoTask,
  acknowledgeTodoTask,
  markTodoTaskAsPending,
  completeTodoTask,
  dropTodoTask,
} from "@/service/todoTask.service";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./TodoTask.css";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const TodoTaskPage = () => {
  const { profile } = useSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "view">(
    "list",
  );
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<TodoTaskStatus | "">("");
  const [taskData, setTaskData] = useState<TodoTask[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTaskTypesLoading, setIsTaskTypesLoading] = useState(false);
  const [isTitlesLoading, setIsTitlesLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<"day" | "week" | "month" | "">(
    "",
  );
  // Compute date range from filter
  const getDateRange = () => {
    if (!dateFilter) return { dateFrom: undefined, dateTo: undefined };
    const now = dayjs();
    let dateFrom: string | undefined;
    let dateTo: string | undefined;
    dateTo = now.endOf("day").toISOString();
    if (dateFilter === "day") {
      dateFrom = now.startOf("day").toISOString();
    } else if (dateFilter === "week") {
      dateFrom = now.startOf("week").toISOString();
    } else if (dateFilter === "month") {
      dateFrom = now.startOf("month").toISOString();
    }
    return { dateFrom, dateTo };
  };
  // Fetch task types from API
  const loadTaskTypes = async () => {
    setIsTaskTypesLoading(true);
    try {
      const response = await fetchTaskTypes();
      setTaskTypes(Array.isArray(response) ? response : []);
    } catch (error) {
      message.error("Failed to load task types");
    } finally {
      setIsTaskTypesLoading(false);
    }
  };
  // Fetch titles from API
  const loadTitles = async () => {
    setIsTitlesLoading(true);
    try {
      const response = await fetchTodoTaskTitles();
      setTitles(Array.isArray(response) ? response : []);
    } catch (error) {
      message.error("Failed to load titles");
    } finally {
      setIsTitlesLoading(false);
    }
  };
  // Fetch active users from API (lightweight endpoint, no full user management permission required)
  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await listActiveUsers();
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      message.error("Failed to load users");
      setUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };
  // Fetch tasks based on active tab
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Check permission for all-tasks tab
      if (activeTab === "all-tasks" && !hasViewAllPermission) {
        setActiveTab("my-tasks");
        setIsLoading(false);
        return;
      }
      let response;
      const userId = (profile as any)?.id;
      if (!userId && activeTab !== "all-tasks") {
        setTaskData([]);
        setIsLoading(false);
        return;
      }
      if (activeTab === "informed") {
        // Fetch tasks where current user is informed
        response = await fetchInformedTodoTasks(filterStatus || undefined);
      } else if (activeTab === "my-tasks") {
        // If status filter is applied for My Tasks
        if (filterStatus) {
          response = await fetchTodoTasksByAssignedUser(userId, filterStatus);
        } else {
          response = await fetchTodoTasksByAssignedUser(userId);
        }
      } else if (activeTab === "created-tasks") {
        // If status filter is applied for Created By Me
        if (filterStatus) {
          response = await fetchTodoTasksByCreatedUser(userId, filterStatus);
        } else {
          response = await fetchTodoTasksByCreatedUser(userId);
        }
      } else {
        // All tasks tab
        if (filterUserId && filterStatus) {
          // Both user and status filters are applied - use the updated service function
          try {
            response = await fetchTodoTasks(filterStatus, filterUserId);
          } catch (error) {
            // Fallback to assigned user endpoint if there's a permission issue
            response = await fetchTodoTasksByAssignedUser(
              filterUserId,
              filterStatus,
            );
          }
        } else if (filterUserId) {
          // Only user filter is applied
          try {
            response = await fetchTodoTasks(undefined, filterUserId);
          } catch (error) {
            // Fallback to assigned user endpoint
            response = await fetchTodoTasksByAssignedUser(filterUserId);
          }
        } else if (filterStatus) {
          // Only status filter is applied
          response = await fetchTodoTasks(filterStatus);
        } else {
          // No filters, fetch all tasks
          response = await fetchTodoTasks();
        }
      }
      // Verify the response structure and update task data
      if (
        response &&
        (Array.isArray(response) ||
          (response.data && Array.isArray(response.data)))
      ) {
        const taskArray = Array.isArray(response) ? response : response.data;
        setTaskData(taskArray);
      } else {
        setTaskData([]);
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 403) {
          message.error("You do not have permission to view these tasks");
        } else {
          message.error(
            "Failed to load tasks: " +
              (error.response.data?.message || "Unknown error"),
          );
        }
      } else if (error.request) {
        message.error("No response from server. Please check your connection.");
      } else {
        message.error(
          "Failed to load tasks: " + (error.message || "Unknown error"),
        );
      }
      setTaskData([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreateTask = async (values: any) => {
    try {
      await createTodoTask(values);
      message.success("Task created successfully");
      setViewMode("list");
      fetchTasks(); // Refresh task list
    } catch (error) {
      message.error("Failed to create task");
    }
  };
  const handleUpdateTask = async (values: any) => {
    if (!selectedTask) return;
    try {
      await updateTodoTask({ id: selectedTask.id, payload: values });
      message.success("Task updated successfully");
      setViewMode("list");
      fetchTasks(); // Refresh task list
    } catch (error) {
      message.error("Failed to update task");
    }
  };
  const handleStatusChange = async (
    taskId: string,
    status: TodoTaskStatus,
    remark: string,
  ) => {
    try {
      switch (status) {
        case TodoTaskStatus.ACKNOWLEDGED:
          await acknowledgeTodoTask({
            id: taskId,
            payload: { acknowledgeRemark: remark },
          });
          break;
        case TodoTaskStatus.PENDING:
          await markTodoTaskAsPending({
            id: taskId,
            payload: { pendingRemark: remark },
          });
          break;
        case TodoTaskStatus.COMPLETED:
          await completeTodoTask({
            id: taskId,
            payload: { completionRemark: remark },
          });
          break;
        case TodoTaskStatus.DROPPED:
          await dropTodoTask({
            id: taskId,
            payload: { droppedRemark: remark },
          });
          break;
        default:
          message.error(`Unsupported status change: ${status}`);
          return;
      }
      message.success(`Task status updated to ${status}`);
      fetchTasks(); // Refresh task list
    } catch (error) {
      message.error("Failed to update task status");
    }
  };
  const handleTaskStatusChange = async (
    status: TodoTaskStatus,
    remark: string,
  ) => {
    if (!selectedTask) return;
    await handleStatusChange(selectedTask.id, status, remark);
  };
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTodoTask(taskId);
      message.success("Task deleted successfully");
      fetchTasks();
    } catch (error: any) {
      message.error(error.message || "Failed to delete task");
    }
  };
  // Get permissions
  const { permissions = [] } = useSession();
  const hasCreatePermission = permissions.some(
    (permission: any) =>
      permission.method === "post" && permission.resource === "todo-task",
  );
  // Check specifically for all-tasks view permission
  const hasViewAllPermission = permissions.some(
    (permission: any) =>
      // Look specifically for endpoint paths that would grant all-task viewing permissions
      (permission.method === "get" &&
        permission.resource === "todo-task" &&
        (!permission.path ||
          permission.path === "/todo-task" ||
          permission.path === "/todo-task/status/:status")) ||
      (permission.method === "view-all" &&
        permission.resource === "todo-task") ||
      (permission.method === "manage" && permission.resource === "todo-task"),
  );
  const hasManagePermission = permissions.some(
    (permission: any) =>
      permission.method === "manage" && permission.resource === "todo-task",
  );
  const hasDeletePermission = permissions.some(
    (permission: any) =>
      permission.method === "delete" && permission.resource === "todo-task",
  );
  // Before rendering, verify if user should see All Tasks tab
  const shouldShowAllTasksTab = hasViewAllPermission;
  // Handler for viewing a task
  const handleViewTask = (task: TodoTask) => {
    setSelectedTask(task);
    setViewMode("view");
  };
  // Handler for editing a task
  const handleEditTask = (task: TodoTask) => {
    setSelectedTask(task);
    setViewMode("edit");
  };
  // Determine if current user can edit the selected task
  const canEditSelectedTask = () => {
    if (!selectedTask) return false;
    // Check if user is the creator and task is still OPEN
    const isCreator = selectedTask.createdById === (profile as any)?.id;
    const isOpen = selectedTask.status === TodoTaskStatus.OPEN;
    return (isCreator && isOpen) || hasManagePermission;
  };
  // Determine if current user can change status of the selected task
  const canChangeSelectedTaskStatus = () => {
    if (!selectedTask) return false;
    // Check if user is assigned to this task
    const isAssigned = selectedTask.assignedToId === (profile as any)?.id;
    // Check if task is in a state that can be changed
    const canChangeStatus =
      selectedTask.status !== TodoTaskStatus.COMPLETED &&
      selectedTask.status !== TodoTaskStatus.DROPPED;
    return (isAssigned && canChangeStatus) || hasManagePermission;
  };
  // Determine if current user can drop the selected task
  const canDropSelectedTask = () => {
    if (!selectedTask) return false;
    // Check if user is the creator of this task
    const isCreator = selectedTask.createdById === (profile as any)?.id;
    // Check if task is in a state that can be dropped
    const canDrop =
      selectedTask.status !== TodoTaskStatus.COMPLETED &&
      selectedTask.status !== TodoTaskStatus.DROPPED;
    return (isCreator && canDrop) || hasManagePermission;
  };
  // Effect to fetch task types and users on initial load
  useEffect(() => {
    loadTaskTypes();
    loadTitles();
    loadUsers();
    // Add debug console output
    // If user doesn't have all tasks permission, make sure they are not on that tab
    if (!hasViewAllPermission && activeTab === "all-tasks") {
      setActiveTab("my-tasks");
    }
  }, []);
  // Effect to fetch tasks when tab changes or filters change
  useEffect(() => {
    fetchTasks();
  }, [activeTab, filterUserId, filterStatus, dateFilter, profile]);
  // Apply client-side date and status filters on the fetched data
  const getFilteredTaskData = () => {
    let data = taskData;
    if (filterStatus) {
      data = data.filter((task) => task.status === filterStatus);
    }
    if (dateFilter) {
      const { dateFrom, dateTo } = getDateRange();
      if (dateFrom && dateTo) {
        data = data.filter((task) => {
          const taskDate = new Date(task.createdTimestamp).getTime();
          return (
            taskDate >= new Date(dateFrom).getTime() &&
            taskDate <= new Date(dateTo).getTime()
          );
        });
      }
    }
    return data;
  };
  return (
    <div className="todo-task-container pb-16 sm:pb-0 px-2 sm:px-0">
      <Card
        title={
          <Space>
            <OrderedListOutlined style={{ color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0 }}>
              TodoTask
            </Title>
          </Space>
        }
        extra={
          viewMode === "list" ? (
            !isMobile && (
              <Space>
                {hasCreatePermission && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setViewMode("create")}
                  >
                    Create Task
                  </Button>
                )}
                {hasManagePermission && (
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => navigate("/todotask/task-types")}
                  >
                    Task Types
                  </Button>
                )}
              </Space>
            )
          ) : (
            <Button icon={<ArrowLeftOutlined />} onClick={() => setViewMode("list")}>Back to List</Button>
          )
        }
      >
        {viewMode === "list" && (
          <>
            {/* Mobile search bar toggle */}
            {isMobile && showMobileSearch && (
              <div className="mb-4 px-2 sm:px-0">
                <Input.Search
                  placeholder="Search tasks by title, assigned user, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  autoFocus
                  className="w-full shadow-sm"
                />
              </div>
            )}

            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                setFilterStatus("");
                setFilterUserId("");
              }}
              renderTabBar={(props, DefaultTabBar) => (
                <div className="overflow-x-auto whitespace-nowrap px-4 sm:px-0">
                  <DefaultTabBar {...props} style={{ marginBottom: 0 }} />
                </div>
              )}
              tabBarStyle={
                isMobile
                  ? {
                      overflowX: "auto",
                      whiteSpace: "nowrap",
                      marginBottom: 12,
                      paddingLeft: "16px",
                      paddingRight: "16px",
                    }
                  : undefined
              }
            >
              <TabPane tab="My Tasks" key="my-tasks">
                <Space style={{ marginBottom: 16 }} wrap className="flex flex-wrap gap-2">
                  <Select
                    placeholder="Filter by status"
                    style={{ width: "100%", maxWidth: 200 }}
                    allowClear
                    value={filterStatus || undefined}
                    onChange={(val) => setFilterStatus(val || "")}
                  >
                    <Option value={TodoTaskStatus.OPEN}>Open</Option>
                    <Option value={TodoTaskStatus.ACKNOWLEDGED}>
                      Acknowledged
                    </Option>
                    <Option value={TodoTaskStatus.PENDING}>Pending</Option>
                    <Option value={TodoTaskStatus.COMPLETED}>Completed</Option>
                    <Option value={TodoTaskStatus.DROPPED}>Dropped</Option>
                  </Select>
                  <Button
                    type={dateFilter === "day" ? "primary" : "default"}
                    size="small"
                    onClick={() =>
                      setDateFilter(dateFilter === "day" ? "" : "day")
                    }
                  >
                    Day
                  </Button>
                  <Button
                    type={dateFilter === "week" ? "primary" : "default"}
                    size="small"
                    onClick={() =>
                      setDateFilter(dateFilter === "week" ? "" : "week")
                    }
                  >
                    Week
                  </Button>
                  <Button
                    type={dateFilter === "month" ? "primary" : "default"}
                    size="small"
                    onClick={() =>
                      setDateFilter(dateFilter === "month" ? "" : "month")
                    }
                  >
                    Month
                  </Button>
                  {(filterStatus || filterUserId || dateFilter) && (
                    <Button
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={() => {
                        setFilterStatus("");
                        setFilterUserId("");
                        setDateFilter("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Space>
                <TodoTaskTable
                  viewType="my"
                  taskData={getFilteredTaskData()}
                  isPending={isLoading}
                  searchQuery={searchQuery}
                  onViewTask={handleViewTask}
                  onEditTask={handleEditTask}
                  onStatusChange={handleStatusChange}
                  onDeleteTask={
                    hasDeletePermission ? handleDeleteTask : undefined
                  }
                />
              </TabPane>
              {hasCreatePermission && (
                <TabPane tab="Created By Me" key="created-tasks">
                  <Space style={{ marginBottom: 16 }} wrap className="flex flex-wrap gap-2">
                    <Select
                      placeholder="Filter by status"
                      style={{ width: "100%", maxWidth: 200 }}
                      allowClear
                      value={filterStatus || undefined}
                      onChange={(val) => setFilterStatus(val || "")}
                    >
                      <Option value={TodoTaskStatus.OPEN}>Open</Option>
                      <Option value={TodoTaskStatus.ACKNOWLEDGED}>
                        Acknowledged
                      </Option>
                      <Option value={TodoTaskStatus.PENDING}>Pending</Option>
                      <Option value={TodoTaskStatus.COMPLETED}>
                        Completed
                      </Option>
                      <Option value={TodoTaskStatus.DROPPED}>Dropped</Option>
                    </Select>
                    <Button
                      type={dateFilter === "day" ? "primary" : "default"}
                      size="small"
                      onClick={() =>
                        setDateFilter(dateFilter === "day" ? "" : "day")
                      }
                    >
                      Day
                    </Button>
                    <Button
                      type={dateFilter === "week" ? "primary" : "default"}
                      size="small"
                      onClick={() =>
                        setDateFilter(dateFilter === "week" ? "" : "week")
                      }
                    >
                      Week
                    </Button>
                    <Button
                      type={dateFilter === "month" ? "primary" : "default"}
                      size="small"
                      onClick={() =>
                        setDateFilter(dateFilter === "month" ? "" : "month")
                      }
                    >
                      Month
                    </Button>
                    {(filterStatus || filterUserId || dateFilter) && (
                      <Button
                        size="small"
                        icon={<ClearOutlined />}
                        onClick={() => {
                          setFilterStatus("");
                          setFilterUserId("");
                          setDateFilter("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </Space>
                  <TodoTaskTable
                    viewType="created"
                    taskData={getFilteredTaskData()}
                    isPending={isLoading}
                    searchQuery={searchQuery}
                    onViewTask={handleViewTask}
                    onEditTask={handleEditTask}
                    onStatusChange={handleStatusChange}
                    onDeleteTask={
                      hasDeletePermission ? handleDeleteTask : undefined
                    }
                  />
                </TabPane>
              )}
              <TabPane tab="Informed" key="informed">
                <Space style={{ marginBottom: 16 }} wrap className="flex flex-wrap gap-2">
                  <Select
                    placeholder="Filter by status"
                    style={{ width: "100%", maxWidth: 200 }}
                    allowClear
                    value={filterStatus || undefined}
                    onChange={(val) => setFilterStatus(val || "")}
                  >
                    <Option value={TodoTaskStatus.OPEN}>Open</Option>
                    <Option value={TodoTaskStatus.ACKNOWLEDGED}>
                      Acknowledged
                    </Option>
                    <Option value={TodoTaskStatus.PENDING}>Pending</Option>
                    <Option value={TodoTaskStatus.COMPLETED}>Completed</Option>
                    <Option value={TodoTaskStatus.DROPPED}>Dropped</Option>
                  </Select>
                  <Button
                    type={dateFilter === "day" ? "primary" : "default"}
                    size="small"
                    onClick={() =>
                      setDateFilter(dateFilter === "day" ? "" : "day")
                    }
                  >
                    Day
                  </Button>
                  <Button
                    type={dateFilter === "week" ? "primary" : "default"}
                    size="small"
                    onClick={() =>
                      setDateFilter(dateFilter === "week" ? "" : "week")
                    }
                  >
                    Week
                  </Button>
                  <Button
                    type={dateFilter === "month" ? "primary" : "default"}
                    size="small"
                    onClick={() =>
                      setDateFilter(dateFilter === "month" ? "" : "month")
                    }
                  >
                    Month
                  </Button>
                  {(filterStatus || filterUserId || dateFilter) && (
                    <Button
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={() => {
                        setFilterStatus("");
                        setFilterUserId("");
                        setDateFilter("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Space>
                <TodoTaskTable
                  viewType="my"
                  taskData={getFilteredTaskData()}
                  isPending={isLoading}
                  searchQuery={searchQuery}
                  onViewTask={handleViewTask}
                  onEditTask={handleEditTask}
                  onStatusChange={handleStatusChange}
                  onDeleteTask={
                    hasDeletePermission ? handleDeleteTask : undefined
                  }
                />
              </TabPane>
              {shouldShowAllTasksTab && (
                <TabPane tab="All Tasks" key="all-tasks">
                  <Space style={{ marginBottom: 16 }} wrap className="flex flex-wrap gap-2">
                    <Select
                      placeholder="Filter by status"
                      style={{ width: "100%", maxWidth: 200 }}
                      allowClear
                      value={filterStatus || undefined}
                      onChange={(val) => setFilterStatus(val || "")}
                    >
                      <Option value={TodoTaskStatus.OPEN}>Open</Option>
                      <Option value={TodoTaskStatus.ACKNOWLEDGED}>
                        Acknowledged
                      </Option>
                      <Option value={TodoTaskStatus.PENDING}>Pending</Option>
                      <Option value={TodoTaskStatus.COMPLETED}>
                        Completed
                      </Option>
                      <Option value={TodoTaskStatus.DROPPED}>Dropped</Option>
                    </Select>
                    <Select
                      placeholder="Filter by user"
                      style={{ width: "100%", maxWidth: 250 }}
                      allowClear
                      value={filterUserId || undefined}
                      onChange={(val) => setFilterUserId(val || "")}
                      showSearch
                      optionFilterProp="children"
                    >
                      <Option value="">All Users</Option>
                      {users.map((user: any) => (
                        <Option key={user.id} value={user.id}>
                          {user.name || user.username || user.email}
                          {user.role && user.role.name && (
                            <span
                              style={{
                                color: "#999",
                                marginLeft: 4,
                                fontSize: "12px",
                              }}
                            >
                              ({user.role.name})
                            </span>
                          )}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      type={dateFilter === "day" ? "primary" : "default"}
                      size="small"
                      onClick={() =>
                        setDateFilter(dateFilter === "day" ? "" : "day")
                      }
                    >
                      Day
                    </Button>
                    <Button
                      type={dateFilter === "week" ? "primary" : "default"}
                      size="small"
                      onClick={() =>
                        setDateFilter(dateFilter === "week" ? "" : "week")
                      }
                    >
                      Week
                    </Button>
                    <Button
                      type={dateFilter === "month" ? "primary" : "default"}
                      size="small"
                      onClick={() =>
                        setDateFilter(dateFilter === "month" ? "" : "month")
                      }
                    >
                      Month
                    </Button>
                    {(filterStatus || filterUserId || dateFilter) && (
                      <Button
                        size="small"
                        icon={<ClearOutlined />}
                        onClick={() => {
                          setFilterStatus("");
                          setFilterUserId("");
                          setDateFilter("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </Space>
                  <TodoTaskTable
                    viewType="all"
                    taskData={getFilteredTaskData()}
                    isPending={isLoading}
                    searchQuery={searchQuery}
                    onViewTask={handleViewTask}
                    onEditTask={handleEditTask}
                    onStatusChange={handleStatusChange}
                    onDeleteTask={
                      hasDeletePermission ? handleDeleteTask : undefined
                    }
                  />
                </TabPane>
              )}
            </Tabs>
          </>
        )}
        {viewMode === "create" && (
          <TodoTaskForm
            taskTypes={taskTypes}
            titles={titles}
            users={users}
            isSubmitting={isLoading}
            isTaskTypesLoading={isTaskTypesLoading}
            isTitlesLoading={isTitlesLoading}
            isUsersLoading={isUsersLoading}
            mode="create"
            currentUserId={(profile as any)?.id}
            onSubmit={handleCreateTask}
            onCancel={() => setViewMode("list")}
          />
        )}
        {viewMode === "edit" && selectedTask && (
          <TodoTaskForm
            initialValues={selectedTask}
            taskTypes={taskTypes}
            titles={titles}
            users={users}
            isSubmitting={isLoading}
            isTaskTypesLoading={isTaskTypesLoading}
            isTitlesLoading={isTitlesLoading}
            isUsersLoading={isUsersLoading}
            mode="edit"
            currentUserId={(profile as any)?.id}
            onSubmit={handleUpdateTask}
            onCancel={() => setViewMode("list")}
          />
        )}
        {viewMode === "view" && selectedTask && (
          <TodoTaskDetails
            task={selectedTask}
            loading={isLoading}
            canEdit={canEditSelectedTask()}
            canChangeStatus={canChangeSelectedTaskStatus()}
            canDrop={canDropSelectedTask()}
            onBack={() => setViewMode("list")}
            onEdit={() => setViewMode("edit")}
            onStatusChange={handleTaskStatusChange}
          />
        )}
      </Card>

      {/* Floating Action Buttons for Mobile */}
      {isMobile && viewMode === "list" && (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-lg active:scale-95 transition-all"
            aria-label="Search Tasks"
          >
            {showMobileSearch ? <CloseOutlined /> : <SearchOutlined />}
          </button>
          {hasCreatePermission && (
            <button
              onClick={() => setViewMode("create")}
              className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all hover:bg-blue-700"
              aria-label="Create Task"
            >
              <PlusOutlined />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export default TodoTaskPage;

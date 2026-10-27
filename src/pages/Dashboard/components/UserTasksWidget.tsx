import React, { useState, useMemo } from "react";
import {
  Card,
  Tabs,
  Tag,
  Button,
  Input,
  Space,
  Empty,
  Tooltip,
  Modal,
  message,
  Popconfirm,
  Badge,
  Segmented,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CheckSquareOutlined,
  ProjectOutlined,
  EyeOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { useCurrentUserTasks } from "@/hooks/task/useCurrentUserTasks";
import { useMarkTasksComplete } from "@/hooks/task/useMarkTasksComplete";
import { useSession } from "@/context/SessionContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTodoTasksByAssignedUser,
  completeTodoTask,
  acknowledgeTodoTask,
} from "@/service/todoTask.service";
import { TodoTaskStatus } from "@/types/todoTask";

const { Search } = Input;

export const UserTasksWidget: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useSession();

  // Mode: Project Tasks vs Todo Tasks
  const [taskSource, setTaskSource] = useState<"project" | "todo">("project");

  // 1. Project Tasks Hook
  const { data: rawTasks, isPending: tasksLoading } = useCurrentUserTasks(true);
  const { mutate: markTasksComplete, isPending: isCompleting } = useMarkTasksComplete();

  // 2. Todo Tasks Query
  const userId = profile?.id ? String(profile.id) : "";
  const { data: rawTodoTasks, isPending: todoTasksLoading } = useQuery({
    queryKey: ["my-todo-tasks", userId],
    queryFn: async () => {
      if (!userId) return [];
      return fetchTodoTasksByAssignedUser(userId);
    },
    enabled: !!userId,
  });

  const [activeProjectTab, setActiveProjectTab] = useState<string>("all_active");
  const [activeTodoTab, setActiveTodoTab] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [completingTaskId, setCompletingTaskId] = useState<string | number | null>(null);

  // Normalize Project Tasks
  const projectTasks = useMemo(() => {
    if (!rawTasks || !Array.isArray(rawTasks)) return [];
    const map = new Map<string, any>();
    rawTasks.forEach((t: any) => {
      if (t && t.id != null) {
        map.set(String(t.id), t);
      }
    });
    return Array.from(map.values());
  }, [rawTasks]);

  // Normalize Todo Tasks
  const todoTasks = useMemo(() => {
    if (!rawTodoTasks || !Array.isArray(rawTodoTasks)) return [];
    return rawTodoTasks;
  }, [rawTodoTasks]);

  // Priority metadata helper
  const getPriorityTag = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <Tag color="error" className="m-0 text-xs font-semibold">Urgent</Tag>;
      case "high":
        return <Tag color="warning" className="m-0 text-xs font-medium">High</Tag>;
      case "medium":
        return <Tag color="processing" className="m-0 text-xs font-medium">Medium</Tag>;
      case "low":
        return <Tag color="default" className="m-0 text-xs">Low</Tag>;
      default:
        return <Tag color="default" className="m-0 text-xs">Normal</Tag>;
    }
  };

  // Due date indicator
  const renderDueDate = (dueDate?: string) => {
    if (!dueDate) return <span className="text-slate-500 text-xs">-</span>;

    const due = moment(dueDate).startOf("day");
    const today = moment().startOf("day");
    const diffDays = due.diff(today, "days");

    if (diffDays < 0) {
      return (
        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
          <ExclamationCircleOutlined />
          Overdue ({due.format("MMM DD")})
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-semibold">
          Due Today
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="text-amber-700 bg-amber-50/60 px-2 py-0.5 rounded text-xs font-medium">
          Due Tomorrow
        </span>
      );
    }
    return (
      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
        {due.format("MMM DD")}
      </span>
    );
  };

  // Filter Project Tasks
  const filteredProjectTasks = useMemo(() => {
    return projectTasks.filter((task: any) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = task.name?.toLowerCase().includes(query);
        const matchesProject = task.project?.name?.toLowerCase().includes(query);
        if (!matchesName && !matchesProject) return false;
      }

      const status = task.status?.toLowerCase();
      const isDone = status === "done" || status === "completed";

      if (activeProjectTab === "all_active") return !isDone;
      if (activeProjectTab === "due_soon") {
        if (isDone) return false;
        if (!task.dueDate) return false;
        const due = moment(task.dueDate).startOf("day");
        const threshold = moment().add(2, "days").endOf("day");
        return due.isSameOrBefore(threshold);
      }
      if (activeProjectTab === "in_progress") return status === "in_progress";
      if (activeProjectTab === "completed") return isDone;
      return true;
    });
  }, [projectTasks, activeProjectTab, searchQuery]);

  // Project Tab Counts
  const projectTabCounts = useMemo(() => {
    let allActive = 0;
    let dueSoon = 0;
    let inProgress = 0;
    let completed = 0;

    projectTasks.forEach((t: any) => {
      const isDone = t.status === "done" || t.status === "completed";
      if (!isDone) {
        allActive++;
        if (t.status === "in_progress") inProgress++;
        if (t.dueDate) {
          const due = moment(t.dueDate).startOf("day");
          if (due.isSameOrBefore(moment().add(2, "days").endOf("day"))) {
            dueSoon++;
          }
        }
      } else {
        completed++;
      }
    });

    return { allActive, dueSoon, inProgress, completed };
  }, [projectTasks]);

  // Filter Todo Tasks
  const filteredTodoTasks = useMemo(() => {
    return todoTasks.filter((task: any) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleText = task.title || task.todoTaskTitle?.name || "";
        const descText = task.description || "";
        if (!titleText.toLowerCase().includes(query) && !descText.toLowerCase().includes(query)) {
          return false;
        }
      }

      const status = task.status?.toLowerCase();
      const isCompleted = status === "completed";
      const isDropped = status === "dropped";

      if (activeTodoTab === "pending") return !isCompleted && !isDropped;
      if (activeTodoTab === "due_soon") {
        if (isCompleted || isDropped) return false;
        if (!task.dueDate) return false;
        const due = moment(task.dueDate).startOf("day");
        const threshold = moment().add(2, "days").endOf("day");
        return due.isSameOrBefore(threshold);
      }
      if (activeTodoTab === "completed") return isCompleted;
      return true;
    });
  }, [todoTasks, activeTodoTab, searchQuery]);

  // Todo Tab Counts
  const todoTabCounts = useMemo(() => {
    let pending = 0;
    let dueSoon = 0;
    let completed = 0;

    todoTasks.forEach((t: any) => {
      const isCompleted = t.status === "completed";
      const isDropped = t.status === "dropped";
      if (!isCompleted && !isDropped) {
        pending++;
        if (t.dueDate) {
          const due = moment(t.dueDate).startOf("day");
          if (due.isSameOrBefore(moment().add(2, "days").endOf("day"))) {
            dueSoon++;
          }
        }
      } else if (isCompleted) {
        completed++;
      }
    });

    return { pending, dueSoon, completed, total: todoTasks.length };
  }, [todoTasks]);

  // Mark Project Task complete handler
  const handleMarkProjectComplete = (task: any) => {
    if (!profile?.id) return;
    setCompletingTaskId(task.id);

    markTasksComplete(
      {
        taskIds: [String(task.id)],
        completedBy: String(profile.id),
      },
      {
        onSuccess: () => {
          message.success(`Task "${task.name}" marked as complete!`);
          setCompletingTaskId(null);
        },
        onError: (err: any) => {
          message.error(err?.response?.data?.message || "Failed to mark task complete");
          setCompletingTaskId(null);
        },
      }
    );
  };

  // Complete Todo Task handler
  const handleCompleteTodo = async (todoId: string) => {
    try {
      setCompletingTaskId(todoId);
      await completeTodoTask({ id: todoId, payload: { completionRemark: "Completed via dashboard" } });
      message.success("Todo task marked as completed!");
      queryClient.invalidateQueries({ queryKey: ["my-todo-tasks", userId] });
    } catch (err: any) {
      message.error(err?.message || "Failed to complete todo task");
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Acknowledge Todo Task handler
  const handleAcknowledgeTodo = async (todoId: string) => {
    try {
      await acknowledgeTodoTask({ id: todoId, payload: { acknowledgeRemark: "Acknowledged via dashboard" } });
      message.success("Todo task acknowledged!");
      queryClient.invalidateQueries({ queryKey: ["my-todo-tasks", userId] });
    } catch (err: any) {
      message.error(err?.message || "Failed to acknowledge todo task");
    }
  };

  // Todo Status Tag
  const getTodoStatusTag = (status?: string) => {
    switch (status) {
      case TodoTaskStatus.OPEN:
        return <Tag color="blue" className="text-xs m-0">Open</Tag>;
      case TodoTaskStatus.ACKNOWLEDGED:
        return <Tag color="cyan" className="text-xs m-0">Acknowledged</Tag>;
      case TodoTaskStatus.PENDING:
        return <Tag color="gold" className="text-xs m-0">Pending</Tag>;
      case TodoTaskStatus.COMPLETED:
        return <Tag color="green" className="text-xs m-0">Completed</Tag>;
      case TodoTaskStatus.DROPPED:
        return <Tag color="default" className="text-xs m-0">Dropped</Tag>;
      default:
        return <Tag className="text-xs m-0">{status}</Tag>;
    }
  };

  return (
    <Card
      className="border border-slate-200 shadow-2xs rounded-xl"
      title={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
            {taskSource === "project" ? (
              <ProjectOutlined className="text-blue-600" />
            ) : (
              <CheckSquareOutlined className="text-indigo-600" />
            )}
            <span>Tasks & Action Items</span>
          </div>

          <Segmented
            value={taskSource}
            onChange={(val) => setTaskSource(val as any)}
            options={[
              {
                label: `Project Tasks (${projectTabCounts.allActive})`,
                value: "project",
                icon: <ProjectOutlined />,
              },
              {
                label: `Todo Tasks (${todoTabCounts.pending})`,
                value: "todo",
                icon: <CheckSquareOutlined />,
              },
            ]}
            className="bg-slate-100 text-xs font-medium"
          />
        </div>
      }
      extra={
        taskSource === "project" ? (
          <Link
            to="/tasks"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Project Tasks <ArrowRightOutlined className="text-[10px]" />
          </Link>
        ) : (
          <Link
            to="/todotask"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            All Todo Tasks <ArrowRightOutlined className="text-[10px]" />
          </Link>
        )
      }
      styles={{
        header: { borderBottom: "1px solid #f1f5f9", padding: "12px 20px" },
        body: { padding: "16px 20px" },
      }}
    >
      {/* Search & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {taskSource === "project" ? (
          <Tabs
            activeKey={activeProjectTab}
            onChange={setActiveProjectTab}
            items={[
              {
                key: "all_active",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span>Active Tasks</span>
                    <Badge
                      count={projectTabCounts.allActive}
                      overflowCount={99}
                      style={{ backgroundColor: "#2563eb", fontSize: "11px" }}
                    />
                  </span>
                ),
              },
              {
                key: "due_soon",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span>Due Soon / Overdue</span>
                    {projectTabCounts.dueSoon > 0 && (
                      <Badge
                        count={projectTabCounts.dueSoon}
                        style={{ backgroundColor: "#ef4444", fontSize: "11px" }}
                      />
                    )}
                  </span>
                ),
              },
              {
                key: "in_progress",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span>In Progress</span>
                    <Badge
                      count={projectTabCounts.inProgress}
                      style={{ backgroundColor: "#0284c7", fontSize: "11px" }}
                    />
                  </span>
                ),
              },
              {
                key: "completed",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span>Completed</span>
                    <Badge
                      count={projectTabCounts.completed}
                      style={{ backgroundColor: "#64748b", fontSize: "11px" }}
                    />
                  </span>
                ),
              },
            ]}
            className="flex-1"
            style={{ marginBottom: 0 }}
          />
        ) : (
          <Tabs
            activeKey={activeTodoTab}
            onChange={setActiveTodoTab}
            items={[
              {
                key: "pending",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span>Pending Todos</span>
                    <Badge
                      count={todoTabCounts.pending}
                      overflowCount={99}
                      style={{ backgroundColor: "#4f46e5", fontSize: "11px" }}
                    />
                  </span>
                ),
              },
              {
                key: "due_soon",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span>Due Soon / Overdue</span>
                    {todoTabCounts.dueSoon > 0 && (
                      <Badge
                        count={todoTabCounts.dueSoon}
                        style={{ backgroundColor: "#ef4444", fontSize: "11px" }}
                      />
                    )}
                  </span>
                ),
              },
              {
                key: "completed",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span>Completed</span>
                    <Badge
                      count={todoTabCounts.completed}
                      style={{ backgroundColor: "#64748b", fontSize: "11px" }}
                    />
                  </span>
                ),
              },
            ]}
            className="flex-1"
            style={{ marginBottom: 0 }}
          />
        )}

        <div className="w-full sm:w-64">
          <Search
            placeholder="Search tasks..."
            allowClear
            size="middle"
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Content Stream: Project Tasks vs Todo Tasks */}
      {taskSource === "project" ? (
        tasksLoading ? (
          <div className="py-12 text-center text-slate-500">Loading your project tasks...</div>
        ) : filteredProjectTasks.length === 0 ? (
          <div className="py-12">
            <Empty
              description={
                <span className="text-slate-500 text-sm">
                  {searchQuery
                    ? "No project tasks match your search."
                    : activeProjectTab === "completed"
                    ? "No completed tasks yet."
                    : "All caught up! No pending project tasks. 🎉"}
                </span>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {filteredProjectTasks.slice(0, 15).map((task: any) => {
              const isDone = task.status === "done" || task.status === "completed";
              const isTaskCompleting = completingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="py-3 px-2 rounded-lg hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="pt-0.5">{getPriorityTag(task.priority)}</div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={
                            task.project?.id
                              ? `/projects/${task.project.id}/tasks/${task.id}`
                              : `/tasks`
                          }
                          className={`font-medium text-sm hover:underline truncate ${
                            isDone
                              ? "text-slate-500 line-through"
                              : "text-slate-800 hover:text-blue-600"
                          }`}
                        >
                          {task.name}
                        </Link>

                        {task.status === "in_progress" && (
                          <Tag color="cyan" className="text-[11px] m-0 border-0 bg-cyan-50 text-cyan-700">
                            In Progress
                          </Tag>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                        {task.project?.name && (
                          <Link
                            to={`/projects/${task.project.id}`}
                            className="text-slate-600 hover:text-blue-600 font-medium"
                          >
                            📂 {task.project.name}
                          </Link>
                        )}

                        {(task.estimatedHours != null || task.loggedHours != null) && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                              ⏱️ {task.loggedHours || 0}h logged
                              {task.estimatedHours ? ` / ${task.estimatedHours}h est.` : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:self-center self-end pl-8 sm:pl-0 flex-shrink-0">
                    {renderDueDate(task.dueDate)}

                    <Space size={4}>
                      <Tooltip title="Log time for this task">
                        <Button
                          size="small"
                          icon={<ClockCircleOutlined />}
                          onClick={() =>
                            navigate(
                              `/worklogs/new?projectId=${task.project?.id || ""}&taskId=${task.id}`
                            )
                          }
                          className="text-slate-600 hover:text-blue-600"
                        />
                      </Tooltip>

                      {!isDone && (
                        <Popconfirm
                          title="Mark task as complete?"
                          description="This will mark the task as done."
                          okText="Complete"
                          cancelText="Cancel"
                          onConfirm={() => handleMarkProjectComplete(task)}
                        >
                          <Tooltip title="Mark Complete">
                            <Button
                              size="small"
                              type="primary"
                              icon={<CheckOutlined />}
                              loading={isTaskCompleting}
                              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                            />
                          </Tooltip>
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Todo Tasks View */
        todoTasksLoading ? (
          <div className="py-12 text-center text-slate-500">Loading your todo tasks...</div>
        ) : filteredTodoTasks.length === 0 ? (
          <div className="py-12 text-center">
            <Empty
              description={
                <span className="text-slate-500 text-sm">
                  {searchQuery
                    ? "No todo tasks match your search."
                    : activeTodoTab === "completed"
                    ? "No completed todo tasks yet."
                    : "All caught up! No pending todo tasks. 🎉"}
                </span>
              }
            >
              <Button
                type="primary"
                onClick={() => navigate("/todotask")}
                className="bg-indigo-600 hover:bg-indigo-700 mt-2"
              >
                Go to Todo Board
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {filteredTodoTasks.slice(0, 15).map((todo: any) => {
              const isCompleted = todo.status === TodoTaskStatus.COMPLETED;
              const isOpen = todo.status === TodoTaskStatus.OPEN;
              const isTodoCompleting = completingTaskId === todo.id;
              const taskTitle = todo.title || todo.todoTaskTitle?.name || "Todo Item";

              return (
                <div
                  key={todo.id}
                  className="py-3 px-2 rounded-lg hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="pt-0.5">{getTodoStatusTag(todo.status)}</div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/todotask/${todo.id}`}
                          className={`font-medium text-sm hover:underline truncate ${
                            isCompleted
                              ? "text-slate-500 line-through"
                              : "text-slate-800 hover:text-indigo-600"
                          }`}
                        >
                          {taskTitle}
                        </Link>

                        {todo.taskType?.name && (
                          <Tag className="text-[11px] m-0 border-0 bg-slate-100 text-slate-700">
                            {todo.taskType.name}
                          </Tag>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                        {todo.createdByUser?.name && (
                          <span>Assigned by {todo.createdByUser.name}</span>
                        )}
                        {todo.description && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-xs">{todo.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:self-center self-end pl-8 sm:pl-0 flex-shrink-0">
                    {renderDueDate(todo.dueDate)}

                    <Space size={4}>
                      {isOpen && (
                        <Tooltip title="Acknowledge Task">
                          <Button
                            size="small"
                            icon={<LikeOutlined />}
                            onClick={() => handleAcknowledgeTodo(todo.id)}
                            className="text-cyan-700 hover:text-cyan-800 border-cyan-300"
                          />
                        </Tooltip>
                      )}

                      {!isCompleted && todo.status !== TodoTaskStatus.DROPPED && (
                        <Popconfirm
                          title="Complete todo task?"
                          okText="Complete"
                          cancelText="Cancel"
                          onConfirm={() => handleCompleteTodo(todo.id)}
                        >
                          <Tooltip title="Mark Complete">
                            <Button
                              size="small"
                              type="primary"
                              icon={<CheckOutlined />}
                              loading={isTodoCompleting}
                              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                            />
                          </Tooltip>
                        </Popconfirm>
                      )}

                      <Tooltip title="View Details">
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/todotask/${todo.id}`)}
                          className="text-slate-600 hover:text-indigo-600"
                        />
                      </Tooltip>
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </Card>
  );
};

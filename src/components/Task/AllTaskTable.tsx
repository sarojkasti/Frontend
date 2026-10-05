import { useCurrentUserTasks } from "@/hooks/task/useCurrentUserTasks";
import { useMarkTasksComplete } from "@/hooks/task/useMarkTasksComplete";
import { useFirstVerifyTasks, useSecondVerifyTasks } from "@/hooks/task/useVerifyTasks";
import { TaskType } from "@/types/task";
import { useSession } from "@/context/SessionContext";
import {
  EditOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  FolderOutlined,
  EyeOutlined,
  DownOutlined,
  UpOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Col,
  Row,
  Button,
  Space,
  Card,
  message,
  Tooltip,
  Tag,
  Collapse,
  Empty,
  Typography,
  Checkbox,
} from "antd";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ResponsiveTable from "@/components/ui/MobileCardList";
import moment from "moment";
import TaskDeadlineTag from "./TaskDeadlineTag";
import TaskQuickViewModal from "./TaskQuickViewModal";

const priorityColorMap: Record<string, string> = {
  critical: "red",
  urgent: "red",
  high: "volcano",
  medium: "orange",
  low: "green",
};

const statusColorMap: Record<string, string> = {
  open: "default",
  in_progress: "processing",
  done: "success",
  first_verified: "blue",
  second_verified: "purple",
};

const statusLabelMap: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
  first_verified: "1st Verified",
  second_verified: "2nd Verified",
};

const AllTaskTable = ({
  status,
  userRole,
  onEdit,
  externalSearchText = "",
}: {
  status: string;
  userRole?: string;
  onEdit?: (task: TaskType) => void;
  externalSearchText?: string;
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [quickViewTask, setQuickViewTask] = useState<any | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const toggleExpand = (id: string | number) => {
    const sId = String(id);
    setExpandedIds((prev) => ({ ...prev, [sId]: !prev[sId] }));
  };

  const handleOpenQuickView = (task: any) => {
    setQuickViewTask(task);
    setQuickViewOpen(true);
  };

  // Hooks
  const { data: currentUserData, isPending } = useCurrentUserTasks(true);
  const { mutate: markTasksComplete, isPending: isMarkingComplete } = useMarkTasksComplete();
  const { mutate: firstVerifyTasks, isPending: isFirstVerifying } = useFirstVerifyTasks();
  const { mutate: secondVerifyTasks, isPending: isSecondVerifying } = useSecondVerifyTasks();
  const { profile } = useSession();

  // 1. Raw deduplication by task ID to prevent duplicate items from API
  const uniqueRawTasks = useMemo(() => {
    if (!currentUserData || !Array.isArray(currentUserData)) return [];
    const map = new Map<string, any>();
    currentUserData.forEach((task: any) => {
      if (task && task.id != null) {
        map.set(String(task.id), task);
      }
    });
    return Array.from(map.values());
  }, [currentUserData]);

  // 2. Identify all subtask IDs across stories
  const subTaskIdsInStories = useMemo(() => {
    const ids = new Set<string>();
    uniqueRawTasks.forEach((task: any) => {
      if (task.taskType === "story" && Array.isArray(task.subTasks)) {
        task.subTasks.forEach((sub: any) => {
          if (sub?.id != null) {
            ids.add(String(sub.id));
          }
        });
      }
    });
    return ids;
  }, [uniqueRawTasks]);

  // 3. Build true hierarchy: stories with nested children, and standalone tasks (excluding duplicate subtasks)
  const hierarchicalTasks = useMemo(() => {
    // Process stories
    const stories = uniqueRawTasks
      .filter((task: any) => task.taskType === "story")
      .map((story: any) => {
        const rawSubs = Array.isArray(story.subTasks) ? story.subTasks : [];
        const matchingSubs = rawSubs
          .filter((sub: any) => !status || sub.status === status)
          .map((sub: any) => ({
            ...sub,
            key: `${story.id}-${sub.id}`,
            isSubTask: true,
            parentTaskName: story.name,
            projectId: sub.projectId || story.projectId || story.project?.id,
            project: sub.project || story.project,
            groupProject: sub.groupProject || story.groupProject,
            group: sub.group || story.group,
          }));

        const storyMatchesStatus = !status || story.status === status;
        const hasMatchingSubs = matchingSubs.length > 0;

        if (!storyMatchesStatus && !hasMatchingSubs) {
          return null;
        }

        return {
          ...story,
          key: String(story.id),
          children: matchingSubs.length > 0 ? matchingSubs : undefined,
        };
      })
      .filter(Boolean);

    // Process standalone tasks (tasks that are not stories AND not nested inside a story in this list)
    const standalones = uniqueRawTasks
      .filter((task: any) => {
        if (task.taskType === "story") return false;
        if (subTaskIdsInStories.has(String(task.id))) return false;
        if (status && task.status !== status) return false;
        return true;
      })
      .map((task: any) => ({
        ...task,
        key: String(task.id),
        isStandalone: true,
      }));

    return [...stories, ...standalones];
  }, [uniqueRawTasks, subTaskIdsInStories, status]);

  // 4. Search filter using externalSearchText
  const filteredData = useMemo(() => {
    if (!externalSearchText || !externalSearchText.trim()) {
      return hierarchicalTasks;
    }
    const q = externalSearchText.trim().toLowerCase();

    return hierarchicalTasks.filter((task: any) => {
      const matchText = (val: any) => val && String(val).toLowerCase().includes(q);

      const nameMatch = matchText(task.name);
      const codeMatch = matchText(task.tcode);
      const descMatch = matchText(task.description);
      const projMatch = matchText(task.project?.name);
      const superMatch = matchText(
        task.groupProject?.taskSuper?.name || task.group?.taskSuper?.name
      );
      const groupMatch = matchText(task.groupProject?.name || task.group?.name);
      const priorityMatch = matchText(task.priority);
      const statusMatch = matchText(task.status);
      const dateMatch = matchText(task.dueDate);

      const assigneesMatch =
        Array.isArray(task.assignees) &&
        task.assignees.some((a: any) => {
          const uName = a?.username || a?.name || (typeof a === "string" ? a : "");
          return matchText(uName);
        });

      if (
        nameMatch ||
        codeMatch ||
        descMatch ||
        projMatch ||
        superMatch ||
        groupMatch ||
        priorityMatch ||
        statusMatch ||
        dateMatch ||
        assigneesMatch
      ) {
        return true;
      }

      if (Array.isArray(task.children)) {
        return task.children.some(
          (child: any) =>
            matchText(child.name) ||
            matchText(child.tcode) ||
            matchText(child.description) ||
            matchText(child.dueDate)
        );
      }

      return false;
    });
  }, [hierarchicalTasks, externalSearchText]);

  // Flatten all tasks for selection/batch actions
  const allFlattenedTasks = useMemo(() => {
    const list: any[] = [];
    const traverse = (items: any[]) => {
      items.forEach((item) => {
        list.push(item);
        if (Array.isArray(item.children)) {
          traverse(item.children);
        }
      });
    };
    traverse(filteredData);
    return list;
  }, [filteredData]);

  const selectedTasks = useMemo(() => {
    return allFlattenedTasks.filter((task: any) => selectedRowKeys.includes(task.id));
  }, [allFlattenedTasks, selectedRowKeys]);

  const hasInProgressTasks = selectedTasks.some((task: any) => task.status === "in_progress");
  const hasDoneTasks = selectedTasks.some((task: any) => task.status === "done");

  // Verification permissions
  const permissionsArr = (profile as any)?.role?.permission;
  const hasFirstVerifyPermission =
    Array.isArray(permissionsArr) &&
    permissionsArr.some(
      (perm: any) =>
        perm.resource === "tasks" &&
        perm.path === "/tasks/first-verify" &&
        perm.method?.toLowerCase() === "patch"
    );

  const hasSecondVerifyPermission =
    Array.isArray(permissionsArr) &&
    permissionsArr.some(
      (perm: any) =>
        perm.resource === "tasks" &&
        perm.path === "/tasks/second-verify" &&
        perm.method?.toLowerCase() === "patch"
    );

  const handleMarkComplete = () => {
    if (selectedRowKeys.length === 0) return;
    const userIdForComplete = (profile as any)?.id;
    if (!userIdForComplete) return;

    markTasksComplete(
      {
        taskIds: selectedTasks.map((t: any) => t.id),
        completedBy: userIdForComplete,
      },
      {
        onSuccess: () => {
          message.success("Tasks marked complete");
          setSelectedRowKeys([]);
        },
      }
    );
  };

  const handleFirstVerify = () => {
    if (selectedRowKeys.length === 0) return;
    const userId = (profile as any)?.id;
    if (!userId) return;

    firstVerifyTasks(
      {
        taskIds: selectedRowKeys.map((k) => Number(k)),
        firstVerifiedBy: userId,
      },
      {
        onSuccess: () => {
          message.success("Tasks first verified");
          setSelectedRowKeys([]);
        },
      }
    );
  };

  const handleSecondVerify = () => {
    if (selectedRowKeys.length === 0) return;
    const userId = (profile as any)?.id;
    if (!userId) return;

    secondVerifyTasks(
      {
        taskIds: selectedRowKeys.map((k) => Number(k)),
        secondVerifiedBy: userId,
      },
      {
        onSuccess: () => {
          message.success("Tasks second verified");
          setSelectedRowKeys([]);
        },
      }
    );
  };

  // Grouping by Project -> TaskSuper -> TaskGroup (with duplicate header flattening)
  const projectContainers = useMemo(() => {
    const projectMap = new Map<
      string,
      {
        id: string;
        name: string;
        supersMap: Map<
          string,
          {
            id: string;
            name: string;
            groupsMap: Map<string, { id: string; name: string; tasks: any[] }>;
          }
        >;
      }
    >();

    (filteredData || []).forEach((task: any) => {
      const pId = task.project?.id?.toString() || "standalone-project";
      const pName = task.project?.name || "General / Unassigned Project";

      const gObj = task.groupProject || task.group;
      const sObj = gObj?.taskSuper || gObj?.taskSuperProject;

      const sId = sObj?.id?.toString() || "standalone-super";
      const sName = sObj?.name || "General Tasks";

      const gId = gObj?.id?.toString() || "standalone-group";
      const gName =
        gObj?.name || (sId === "standalone-super" ? "General Tasks" : "Uncategorized Group");

      if (!projectMap.has(pId)) {
        projectMap.set(pId, {
          id: pId,
          name: pName,
          supersMap: new Map(),
        });
      }

      const pEntry = projectMap.get(pId)!;
      if (!pEntry.supersMap.has(sId)) {
        pEntry.supersMap.set(sId, {
          id: sId,
          name: sName,
          groupsMap: new Map(),
        });
      }

      const sEntry = pEntry.supersMap.get(sId)!;
      if (!sEntry.groupsMap.has(gId)) {
        sEntry.groupsMap.set(gId, {
          id: gId,
          name: gName,
          tasks: [],
        });
      }

      sEntry.groupsMap.get(gId)!.tasks.push(task);
    });

    const result: any[] = [];
    const sortedProjects = Array.from(projectMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    sortedProjects.forEach((p) => {
      const superContainers: any[] = [];
      const sortedSupers = Array.from(p.supersMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      sortedSupers.forEach((s) => {
        const groupContainers: any[] = [];
        const sortedGroups = Array.from(s.groupsMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        sortedGroups.forEach((g) => {
          groupContainers.push({
            groupId: g.id,
            groupName: g.name,
            tasks: g.tasks,
          });
        });

        const superTotal = groupContainers.reduce((acc, g) => acc + g.tasks.length, 0);

        // Deduplication: if super has only 1 group that shares name or is default, collapse it!
        const isSingleGroup =
          groupContainers.length === 1 &&
          (groupContainers[0].groupName.trim().toLowerCase() === s.name.trim().toLowerCase() ||
            groupContainers[0].groupName === "General Tasks" ||
            groupContainers[0].groupName === "Uncategorized Group" ||
            s.id === "standalone-super");

        superContainers.push({
          superId: s.id,
          superName: s.name,
          groups: groupContainers,
          isSingleGroup,
          tasks: isSingleGroup ? groupContainers[0].tasks : [],
          totalTasks: superTotal,
        });
      });

      const projectTotal = superContainers.reduce((acc, s) => acc + s.totalTasks, 0);

      // Deduplication: if project has only 1 standalone super with single group, flatten project!
      const isFlatProject =
        superContainers.length === 1 &&
        superContainers[0].isSingleGroup &&
        superContainers[0].superId === "standalone-super";

      result.push({
        projectId: p.id,
        projectName: p.name,
        supers: superContainers,
        isFlat: isFlatProject,
        tasks: isFlatProject ? superContainers[0].tasks : [],
        totalTasks: projectTotal,
      });
    });

    return result;
  }, [filteredData]);

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        render: (name: string, record: any) => (
          <div className="flex items-center gap-1.5 min-w-0">
            {record.isSubTask && <span style={{ color: "#999", marginRight: 2 }}>↳</span>}
            <span
              onClick={() => handleOpenQuickView(record)}
              className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-medium break-words"
              style={{
                fontWeight: record.isSubTask ? "normal" : "500",
                color: record.isSubTask ? "#334155" : "#0f172a",
              }}
            >
              {name}
            </span>
            {record.tcode && (
              <Tag color="cyan" style={{ fontSize: 10, lineHeight: "16px", padding: "0 4px", margin: 0 }}>
                {record.tcode}
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: "Task Type",
        dataIndex: "taskType",
        key: "taskType",
        width: 100,
        render: (_: any, record: any) => {
          const isStory = record?.taskType === "story";
          return (
            <Tag color={isStory ? "blue" : "green"} style={{ margin: 0 }}>
              {isStory ? "Task" : "Subtask"}
            </Tag>
          );
        },
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        width: 100,
        render: (priority: string) => {
          const p = (priority || "normal").toLowerCase();
          return (
            <Tag color={priorityColorMap[p] || "default"} style={{ margin: 0 }}>
              {p.toUpperCase()}
            </Tag>
          );
        },
      },
      {
        title: "Deadline",
        dataIndex: "dueDate",
        key: "dueDate",
        width: 160,
        sorter: (a: any, b: any) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return moment(a.dueDate).unix() - moment(b.dueDate).unix();
        },
        render: (dueDate: string | null, record: any) => (
          <TaskDeadlineTag dueDate={dueDate} status={record.status} />
        ),
      },
      {
        title: "Assignee",
        dataIndex: "assignees",
        key: "assignees",
        width: 140,
        render: (_: any, record: any) => {
          const assignees = record.assignees;
          if (!assignees || !Array.isArray(assignees) || assignees.length === 0) {
            return <span className="text-gray-400 text-xs italic">Unassigned</span>;
          }
          return (
            <Avatar.Group max={{ count: 2 }}>
              {assignees.map((user: any) => {
                const uName = user?.username || user?.name || (typeof user === "string" ? user : "?");
                const uId = user?.id || uName;
                return (
                  <Tooltip key={uId} title={uName}>
                    <Avatar style={{ backgroundColor: "#87d068" }} size="small">
                      {uName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </Avatar.Group>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (taskStatus: string) => (
          <Tag color={statusColorMap[taskStatus] || "default"} style={{ margin: 0 }}>
            {statusLabelMap[taskStatus] || taskStatus}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 90,
        render: (_: any, record: any) => (
          <Space size={4}>
            <Tooltip title="View Details">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleOpenQuickView(record)}
              />
            </Tooltip>
            <Tooltip title="Edit Task">
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => onEdit?.(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [onEdit]
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const renderTable = (tasks: any[]) => (
    <ResponsiveTable
      tableProps={{
        columns: columns,
        dataSource: tasks,
        rowSelection: rowSelection,
        rowKey: "id",
        size: "small",
        bordered: false,
        pagination: false,
        expandable: {
          defaultExpandAllRows: true,
          expandRowByClick: false,
          indentSize: 20,
          rowExpandable: (record: any) =>
            Array.isArray(record.children) && record.children.length > 0,
        },
      }}
      renderMobileCard={(record: any) => {
        const isExpanded = !!expandedIds[record.id];
        const projId = record.projectId || record.project?.id;
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Checkbox
                  checked={selectedRowKeys.includes(record.id)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedRowKeys, record.id]
                      : selectedRowKeys.filter((k) => k !== record.id);
                    setSelectedRowKeys(next);
                  }}
                />
                <div className="font-semibold text-gray-900 text-sm break-words">
                  {record.isSubTask && <span className="text-gray-400 mr-1">↳</span>}
                  <span
                    onClick={() => handleOpenQuickView(record)}
                    className="cursor-pointer text-blue-600 hover:underline"
                  >
                    {record.name}
                  </span>
                  {record.tcode && (
                    <Tag color="cyan" className="ml-1.5 text-[10px] leading-4 py-0 px-1">
                      {record.tcode}
                    </Tag>
                  )}
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined style={{ fontSize: "15px", color: "#0c66e4" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenQuickView(record);
                  }}
                  className="flex items-center justify-center h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600"
                  title="View Details"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: "15px", color: "#0c66e4" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(record);
                  }}
                  className="flex items-center justify-center h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600"
                  title="Edit Task"
                />
                <Button
                  type="text"
                  size="small"
                  icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(record.id);
                  }}
                  className="text-gray-500 hover:text-blue-600 flex items-center justify-center h-7 w-7 rounded-full hover:bg-gray-100"
                  title="Toggle Details"
                />
              </div>
            </div>

            {/* Always visible metadata badges */}
            <div className="flex items-center gap-2 flex-wrap pl-6">
              <Tag color={record.taskType === "story" ? "blue" : "green"} className="m-0 text-[10px]">
                {record.taskType === "story" ? "Task" : "Subtask"}
              </Tag>
              <Tag
                color={priorityColorMap[record.priority] || "default"}
                className="m-0 text-[10px]"
              >
                {(record.priority || "NORMAL").toUpperCase()}
              </Tag>
              <TaskDeadlineTag dueDate={record.dueDate} status={record.status} />
              <Tag color={statusColorMap[record.status] || "default"} className="m-0 text-[10px]">
                {statusLabelMap[record.status] || record.status}
              </Tag>
            </div>

            {/* Revealed Detail Card */}
            {isExpanded && (
              <div className="mt-2 pt-2.5 border-t border-dashed border-gray-200 flex flex-col gap-2 bg-gray-50/80 rounded-lg p-3 text-xs text-gray-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Deadline:</span>
                  <div className="flex items-center gap-1.5">
                    <TaskDeadlineTag dueDate={record.dueDate} status={record.status} />
                    {record.dueDate && (
                      <span className="text-[11px] text-gray-500">
                        {moment(record.dueDate).format("YYYY-MM-DD")}
                      </span>
                    )}
                  </div>
                </div>

                {record.assignees && record.assignees.length > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 font-medium shrink-0">Assignees:</span>
                    <Avatar.Group max={{ count: 3 }}>
                      {record.assignees.map((user: any) => {
                        const uName =
                          user?.username || user?.name || (typeof user === "string" ? user : "?");
                        const uId = user?.id || uName;
                        return (
                          <Tooltip key={uId} title={uName}>
                            <Avatar size="small" style={{ backgroundColor: "#87d068" }}>
                              {uName.charAt(0).toUpperCase()}
                            </Avatar>
                          </Tooltip>
                        );
                      })}
                    </Avatar.Group>
                  </div>
                )}

                {record.description && (
                  <div className="pt-1.5 border-t border-gray-200/60">
                    <span className="text-gray-500 font-medium block mb-1">Description:</span>
                    <div className="text-gray-700 bg-white p-2 rounded border border-gray-100 break-words">
                      {record.description}
                    </div>
                  </div>
                )}

                {Array.isArray(record.children) && record.children.length > 0 && (
                  <div className="pt-1.5 border-t border-gray-200/60">
                    <span className="text-gray-500 font-medium block mb-1">
                      Subtasks ({record.children.length}):
                    </span>
                    <div className="flex flex-col gap-1 pl-2 border-l-2 border-blue-200">
                      {record.children.map((sub: any) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span
                            onClick={() => handleOpenQuickView(sub)}
                            className="cursor-pointer text-blue-600 hover:underline"
                          >
                            ↳ {sub.name}
                          </span>
                          <TaskDeadlineTag dueDate={sub.dueDate} status={sub.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    />
  );

  return (
    <Row style={{ width: "100%" }}>
      <Col span={24}>
        <Card bordered={false} bodyStyle={{ padding: 0 }}>
          {selectedRowKeys.length > 0 && (
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 500 }}>{selectedRowKeys.length} task(s) selected</span>
              {hasInProgressTasks && (
                <Button type="primary" onClick={handleMarkComplete} loading={isMarkingComplete}>
                  Mark Complete
                </Button>
              )}
              {hasDoneTasks && hasFirstVerifyPermission && (
                <Button type="primary" onClick={handleFirstVerify} loading={isFirstVerifying}>
                  1st Verify
                </Button>
              )}
              {hasDoneTasks && hasSecondVerifyPermission && (
                <Button type="primary" onClick={handleSecondVerify} loading={isSecondVerifying}>
                  2nd Verify
                </Button>
              )}
            </div>
          )}

          {projectContainers.length === 0 ? (
            <Empty description="No tasks found matching criteria" style={{ margin: "30px 0" }} />
          ) : (
            <Collapse
              defaultActiveKey={projectContainers.map((p: any) => p.projectId)}
              style={{ background: "transparent", border: "none" }}
            >
              {projectContainers.map((pItem: any) => (
                <Collapse.Panel
                  key={pItem.projectId}
                  header={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        paddingRight: 12,
                      }}
                    >
                      <Tooltip title="Project" placement="top">
                        <Space align="center" style={{ cursor: "pointer" }}>
                          <ProjectOutlined style={{ color: "#475569", fontSize: 16 }} />
                          <Typography.Text style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                            {pItem.projectName}
                          </Typography.Text>
                        </Space>
                      </Tooltip>
                      <Tag
                        style={{
                          borderRadius: 12,
                          fontWeight: 500,
                          color: "#475569",
                          backgroundColor: "#e2e8f0",
                          borderColor: "#cbd5e1",
                        }}
                      >
                        {pItem.totalTasks} tasks
                      </Tag>
                    </div>
                  }
                  style={{
                    marginBottom: 12,
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                  }}
                >
                  {/* If flat project (no custom supers/groups), render table directly! */}
                  {pItem.isFlat ? (
                    renderTable(pItem.tasks)
                  ) : (
                    <Collapse
                      defaultActiveKey={pItem.supers.map((s: any) => s.superId)}
                      style={{ background: "transparent", border: "none" }}
                    >
                      {pItem.supers.map((superItem: any) => (
                        <Collapse.Panel
                          key={superItem.superId}
                          header={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                paddingRight: 12,
                              }}
                            >
                              <Tooltip title="Super Project" placement="top">
                                <Space align="center" style={{ cursor: "pointer" }}>
                                  <AppstoreOutlined style={{ color: "#3b82f6", fontSize: 15 }} />
                                  <Typography.Text
                                    style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}
                                  >
                                    {superItem.superName}
                                  </Typography.Text>
                                </Space>
                              </Tooltip>
                              <Tag
                                style={{
                                  borderRadius: 12,
                                  fontWeight: 500,
                                  color: "#2563eb",
                                  backgroundColor: "#eff6ff",
                                  borderColor: "#dbeafe",
                                }}
                              >
                                {superItem.totalTasks} tasks
                              </Tag>
                            </div>
                          }
                          style={{
                            marginBottom: 8,
                            background: "#ffffff",
                            borderRadius: 6,
                            border: "1px solid #f1f5f9",
                            overflow: "hidden",
                          }}
                        >
                          {/* If single group with matching/default name, render table directly! */}
                          {superItem.isSingleGroup ? (
                            renderTable(superItem.tasks)
                          ) : (
                            <Collapse
                              defaultActiveKey={superItem.groups.map((g: any) => g.groupId)}
                              style={{ background: "transparent", border: "none" }}
                            >
                              {superItem.groups.map((groupItem: any) => (
                                <Collapse.Panel
                                  key={groupItem.groupId}
                                  header={
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        paddingRight: 12,
                                      }}
                                    >
                                      <Tooltip title="Task Group" placement="top">
                                        <Space align="center" style={{ cursor: "pointer" }}>
                                          <FolderOutlined style={{ color: "#64748b", fontSize: 14 }} />
                                          <Typography.Text
                                            style={{
                                              fontSize: 13,
                                              fontWeight: 500,
                                              color: "#334155",
                                            }}
                                          >
                                            {groupItem.groupName}
                                          </Typography.Text>
                                        </Space>
                                      </Tooltip>
                                      <Tag
                                        style={{
                                          borderRadius: 12,
                                          fontWeight: 500,
                                          color: "#64748b",
                                          backgroundColor: "#fafafa",
                                          borderColor: "#f0f0f0",
                                        }}
                                      >
                                        {groupItem.tasks.length} tasks
                                      </Tag>
                                    </div>
                                  }
                                  style={{
                                    marginBottom: 6,
                                    background: "#fafafa",
                                    borderRadius: 6,
                                    border: "1px solid #f0f0f0",
                                    overflow: "hidden",
                                  }}
                                >
                                  {renderTable(groupItem.tasks)}
                                </Collapse.Panel>
                              ))}
                            </Collapse>
                          )}
                        </Collapse.Panel>
                      ))}
                    </Collapse>
                  )}
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </Card>

        {/* Quick View Task Modal */}
        <TaskQuickViewModal
          task={quickViewTask}
          open={quickViewOpen}
          onClose={() => {
            setQuickViewOpen(false);
            setQuickViewTask(null);
          }}
          onEdit={(task) => {
            setQuickViewOpen(false);
            onEdit?.(task);
          }}
        />
      </Col>
    </Row>
  );
};

export default AllTaskTable;

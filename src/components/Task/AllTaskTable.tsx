import { useCurrentUserTasks } from "@/hooks/task/useCurrentUserTasks";
import { useMarkTasksComplete } from "@/hooks/task/useMarkTasksComplete";
import { useFirstVerifyTasks, useSecondVerifyTasks } from "@/hooks/task/useVerifyTasks";
import { TaskType } from "@/types/task";
import { useSession } from "@/context/SessionContext";
import { EditOutlined, SearchOutlined, CheckOutlined, CheckCircleOutlined, ProjectOutlined, AppstoreOutlined, FolderOutlined, EyeOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import {
  Avatar,
  Col,
  Row,
  Table,
  Input,
  Button,
  Space,
  Badge,
  Card,
  message,
  notification,
  Tooltip,
  Tag,
  Modal,
  Collapse,
  Empty,
  Typography,
  Checkbox
} from "antd";
import { useMemo, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ResponsiveTable from "@/components/ui/MobileCardList";
import _ from "lodash";

const AllTaskTable = ({ status, userRole, onEdit, externalSearchText = '' }: { status: string, userRole?: string, onEdit?: (task: TaskType) => void, externalSearchText?: string }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string | number) => {
    const sId = String(id);
    setExpandedIds((prev) => ({ ...prev, [sId]: !prev[sId] }));
  };

  // Hooks
  const { data: currentUserData, isPending } = useCurrentUserTasks(true);
  const { mutate: markTasksComplete, isPending: isMarkingComplete } = useMarkTasksComplete();
  const { mutate: firstVerifyTasks, isPending: isFirstVerifying } = useFirstVerifyTasks();
  const { mutate: secondVerifyTasks, isPending: isSecondVerifying } = useSecondVerifyTasks();
  const { profile } = useSession();

  // Filter by status
  const filteredData = useMemo(() => {
    if (!currentUserData || !status) return currentUserData;
    return currentUserData
      .map((task: TaskType) => {
        if (task.subTasks && task.subTasks.length > 0) {
          const matchingSubtasks = task.subTasks.filter((subtask: any) => subtask.status === status);
          if (matchingSubtasks.length > 0) {
            return {
              ...task,
              subTasks: matchingSubtasks
            };
          }
          if (task.status === status) {
            return {
              ...task,
              subTasks: []
            };
          }
          return null;
        }
        if (task.status === status) {
          return task;
        }
        return null;
      })
      .filter((task: any) => task !== null);
  }, [currentUserData, status]);

  const selectedTasks = (filteredData || []).filter((task: TaskType) =>
    selectedRowKeys.includes(task.id)
  );

  const hasInProgressTasks = selectedTasks.some((task: TaskType) => task.status === 'in_progress');
  const hasDoneTasks = selectedTasks.some((task: TaskType) => task.status === 'done');

  // Check verification permissions
  const permissionsArr = (profile as any)?.role?.permission;
  const hasFirstVerifyPermission = Array.isArray(permissionsArr) &&
    permissionsArr.some(
      (perm: any) =>
        perm.resource === "tasks" &&
        perm.path === "/tasks/first-verify" &&
        perm.method?.toLowerCase() === "patch"
    );

  const hasSecondVerifyPermission = Array.isArray(permissionsArr) &&
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

    markTasksComplete({
      taskIds: selectedTasks.map((t: any) => t.id),
      completedBy: userIdForComplete
    }, {
      onSuccess: () => {
        message.success("Tasks marked complete");
        setSelectedRowKeys([]);
      }
    });
  };

  const handleFirstVerify = () => {
    if (selectedRowKeys.length === 0) return;
    const userId = (profile as any)?.id;
    if (!userId) return;

    firstVerifyTasks({
      taskIds: selectedRowKeys.map(k => Number(k)),
      firstVerifiedBy: userId
    }, {
      onSuccess: () => {
        message.success("Tasks first verified");
        setSelectedRowKeys([]);
      }
    });
  };

  const handleSecondVerify = () => {
    if (selectedRowKeys.length === 0) return;
    const userId = (profile as any)?.id;
    if (!userId) return;

    secondVerifyTasks({
      taskIds: selectedRowKeys.map(k => Number(k)),
      secondVerifiedBy: userId
    }, {
      onSuccess: () => {
        message.success("Tasks second verified");
        setSelectedRowKeys([]);
      }
    });
  };

  // Grouping by Project -> TaskSuper -> TaskGroup
  const projectContainers = useMemo(() => {
    const projectMap = new Map<string, { id: string; name: string; supersMap: Map<string, { id: string; name: string; groupsMap: Map<string, { id: string; name: string; tasks: any[] }> }> }>();

    (filteredData || []).forEach((task: any) => {
      const pId = task.project?.id?.toString() || 'standalone-project';
      const pName = task.project?.name || 'General / Unassigned Project';

      const gObj = task.groupProject || task.group;
      const sObj = gObj?.taskSuper || gObj?.taskSuperProject;

      const sId = sObj?.id?.toString() || 'standalone-super';
      const sName = sObj?.name || 'General Tasks';

      const gId = gObj?.id?.toString() || 'standalone-group';
      const gName = gObj?.name || (sId === 'standalone-super' ? 'General Tasks' : 'Uncategorized Group');

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

    const sortedProjects = Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    sortedProjects.forEach((p) => {
      const superContainers: any[] = [];

      const sortedSupers = Array.from(p.supersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

      sortedSupers.forEach((s) => {
        const groupContainers: any[] = [];

        const sortedGroups = Array.from(s.groupsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        sortedGroups.forEach((g) => {
          groupContainers.push({
            groupId: g.id,
            groupName: g.name,
            tasks: g.tasks,
          });
        });

        const superTotal = groupContainers.reduce((acc, g) => acc + g.tasks.length, 0);

        superContainers.push({
          superId: s.id,
          superName: s.name,
          groups: groupContainers,
          totalTasks: superTotal,
        });
      });

      const projectTotal = superContainers.reduce((acc, s) => acc + s.totalTasks, 0);

      result.push({
        projectId: p.id,
        projectName: p.name,
        supers: superContainers,
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
        sorter: (a: TaskType, b: TaskType) => a.name.localeCompare(b.name),
        render: (name: string, record: any) => (
          <span style={{ fontWeight: record.isSubTask ? 'normal' : '500', color: record.isSubTask ? '#666' : '#000', paddingLeft: record.isSubTask ? '16px' : '0' }}>
            {record.isSubTask && <span style={{ color: '#999', marginRight: '4px' }}>↳</span>}
            {name}
          </span>
        ),
      },
      {
        title: "Task Type",
        dataIndex: "taskType",
        key: "taskType",
        render: (_: any, record: any) => {
          const displayType = record?.taskType === 'story' ? 'Task' : 'Subtask';
          const badgeColor = record?.taskType === 'story' ? 'blue' : 'green';
          const badgeText = record?.taskType === 'story' ? 'T' : 'S';
          return (
            <>
              <Badge color={badgeColor} count={badgeText} /> &nbsp;
              {displayType}
            </>
          );
        },
      },
      {
        title: "Assignee",
        dataIndex: "assignees",
        key: "assignees",
        render: (_: any, record: TaskType) => {
          const assignees = record.assignees;
          if (!assignees || !Array.isArray(assignees) || assignees.length === 0) return null;
          return (
            <Avatar.Group max={{ count: 2 }}>
              {assignees.map((user: any) => (
                <Avatar key={user.id} style={{ backgroundColor: "#87d068" }}>
                  {user.username ? user.username.charAt(0).toUpperCase() : "?"}
                </Avatar>
              ))}
            </Avatar.Group>
          );
        },
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: TaskType) => (
          <Button icon={<EditOutlined />} size="small" onClick={() => onEdit?.(record)} />
        )
      }
    ],
    [onEdit]
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <Row style={{ width: '100%' }}>
      <Col span={24}>
        <Card bordered={false} bodyStyle={{ padding: 0 }}>
          {selectedRowKeys.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <Empty description="No tasks found matching criteria" style={{ margin: '30px 0' }} />
          ) : (
            <Collapse
              defaultActiveKey={projectContainers.map((p: any) => p.projectId)}
              style={{ background: 'transparent', border: 'none' }}
            >
              {projectContainers.map((pItem: any) => (
                <Collapse.Panel
                  key={pItem.projectId}
                  header={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 12 }}>
                      <Tooltip title="Project" placement="top">
                        <Space align="center" style={{ cursor: 'pointer' }}>
                          <ProjectOutlined style={{ color: '#475569', fontSize: 16 }} />
                          <Typography.Text style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                            {pItem.projectName}
                          </Typography.Text>
                        </Space>
                      </Tooltip>
                      <Tag style={{ borderRadius: 12, fontWeight: 500, color: '#475569', backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }}>
                        {pItem.totalTasks} tasks
                      </Tag>
                    </div>
                  }
                  style={{
                    marginBottom: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                  }}
                >
                  <Collapse
                    defaultActiveKey={pItem.supers.map((s: any) => s.superId)}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    {pItem.supers.map((superItem: any) => (
                      <Collapse.Panel
                        key={superItem.superId}
                        header={
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 12 }}>
                            <Tooltip title="Super Project" placement="top">
                              <Space align="center" style={{ cursor: 'pointer' }}>
                                <AppstoreOutlined style={{ color: '#3b82f6', fontSize: 15 }} />
                                <Typography.Text style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                                  {superItem.superName}
                                </Typography.Text>
                              </Space>
                            </Tooltip>
                            <Tag style={{ borderRadius: 12, fontWeight: 500, color: '#2563eb', backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
                              {superItem.totalTasks} tasks
                            </Tag>
                          </div>
                        }
                        style={{
                          marginBottom: 8,
                          background: '#ffffff',
                          borderRadius: 6,
                          border: '1px solid #f1f5f9',
                          overflow: 'hidden',
                        }}
                      >
                        <Collapse
                          defaultActiveKey={superItem.groups.map((g: any) => g.groupId)}
                          style={{ background: 'transparent', border: 'none' }}
                        >
                          {superItem.groups.map((groupItem: any) => (
                            <Collapse.Panel
                              key={groupItem.groupId}
                              header={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 12 }}>
                                  <Tooltip title="Task Group" placement="top">
                                    <Space align="center" style={{ cursor: 'pointer' }}>
                                      <FolderOutlined style={{ color: '#64748b', fontSize: 14 }} />
                                      <Typography.Text style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                                        {groupItem.groupName}
                                      </Typography.Text>
                                    </Space>
                                  </Tooltip>
                                  <Tag style={{ borderRadius: 12, fontWeight: 500, color: '#64748b', backgroundColor: '#fafafa', borderColor: '#f0f0f0' }}>
                                    {groupItem.tasks.length} tasks
                                  </Tag>
                                </div>
                              }
                              style={{
                                marginBottom: 6,
                                background: '#fafafa',
                                borderRadius: 6,
                                border: '1px solid #f0f0f0',
                                overflow: 'hidden',
                              }}
                            >
                              <ResponsiveTable
                                tableProps={{
                                  columns: columns,
                                  dataSource: groupItem.tasks,
                                  rowSelection: rowSelection,
                                  rowKey: "id",
                                  size: "small",
                                  bordered: false,
                                  pagination: false,
                                  expandable: {
                                    defaultExpandAllRows: true,
                                    expandRowByClick: false,
                                    indentSize: 20,
                                    rowExpandable: (record: any) => Array.isArray(record.children) && record.children.length > 0
                                  }
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
                                            {record.name}
                                          </div>
                                        </div>
                                        {/* Action Icons: Detailed View, Edit, Dropdown Toggle */}
                                        <div className="flex items-center gap-1 shrink-0">
                                          {projId && (
                                            <Link to={`/projects/${projId}/tasks/${record.id}`}>
                                              <Button
                                                type="text"
                                                size="small"
                                                icon={<EyeOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
                                                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
                                                title="View Details"
                                                aria-label="View Details"
                                              />
                                            </Link>
                                          )}
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined style={{ fontSize: "16px", color: "#0c66e4" }} />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEdit?.(record);
                                            }}
                                            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"
                                            title="Edit Task"
                                            aria-label="Edit Task"
                                          />
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleExpand(record.id);
                                            }}
                                            className="text-gray-500 hover:text-blue-600 flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
                                            title="Toggle Details"
                                            aria-label="Toggle Details"
                                          />
                                        </div>
                                      </div>

                                      {/* Revealed Detail Card (when dropdown button clicked) */}
                                      {isExpanded && (
                                        <div className="mt-2 pt-2.5 border-t border-dashed border-gray-200 flex flex-col gap-2 bg-gray-50/80 rounded-lg p-3 text-xs text-gray-600">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-gray-500 font-medium shrink-0">Task Type:</span>
                                            <Tag color={record.taskType === 'story' ? 'blue' : 'green'} className="m-0 text-[10px]">
                                              {record.taskType === 'story' ? 'Task' : 'Subtask'}
                                            </Tag>
                                          </div>
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-gray-500 font-medium shrink-0">Priority:</span>
                                            <Tag color={record.priority === 'high' ? 'red' : record.priority === 'medium' ? 'orange' : 'default'} className="m-0 text-[10px]">
                                              {record.priority ? record.priority.toUpperCase() : 'NORMAL'}
                                            </Tag>
                                          </div>
                                          {record.assignees && record.assignees.length > 0 && (
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-gray-500 font-medium shrink-0">Assignees:</span>
                                              <Avatar.Group max={{ count: 3 }}>
                                                {record.assignees.map((user: any) => (
                                                  <Avatar key={user.id} size="small" style={{ backgroundColor: "#87d068" }}>
                                                    {user.username ? user.username.charAt(0).toUpperCase() : "?"}
                                                  </Avatar>
                                                ))}
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
                                        </div>
                                      )}
                                    </div>
                                  );
                                }}
                              />
                            </Collapse.Panel>
                          ))}
                        </Collapse>
                      </Collapse.Panel>
                    ))}
                  </Collapse>
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default AllTaskTable;

import { useMemo } from "react";
import { Card, Col, Row, Progress, Button, Alert, Table, Tag, Space, Typography, message, Modal } from "antd";
import { CheckCircleOutlined, FolderOutlined, AppstoreOutlined } from "@ant-design/icons";
import { ProjectType } from "@/types/project";
import { TaskType } from "@/types/task";
import { useSession } from "@/context/SessionContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { completeProject } from "@/service/project.service";
import { fetchProjectTaskGroups } from "@/service/taskgroup.service";
import useIsMobile from "@/hooks/useIsMobile";

const { Text } = Typography;

interface ProjectSummaryProps {
  project: ProjectType;
}

interface SummaryRow {
  key: string;
  name: string;
  isSuper?: boolean;
  total: number;
  completed: number;
  inProgress: number;
  open: number;
  other: number;
  percent: number;
  children?: SummaryRow[];
}

const ProjectSummary = ({ project }: ProjectSummaryProps) => {
  const { isMobile } = useIsMobile();
  const { profile } = useSession();
  const queryClient = useQueryClient();

  const projectIdStr = project?.id?.toString();

  // Fetch project-scoped task groups
  const { data: taskGroupsData } = useQuery({
    queryKey: ["projectTaskGroups", projectIdStr],
    queryFn: () => fetchProjectTaskGroups(projectIdStr!),
    enabled: !!projectIdStr,
  });

  const tasks: TaskType[] = project?.tasks || [];
  // Main tasks (excluding subtasks)
  const mainTasks: TaskType[] = tasks.filter((task) => !task.parentTask);

  const total = mainTasks.length;
  const completed = mainTasks.filter(
    (t: TaskType) =>
      t.status === "done" ||
      t.status === "second_verified" ||
      t.status === "first_verified"
  ).length;
  const inProgress = mainTasks.filter((t: TaskType) => t.status === "in_progress").length;
  const open = mainTasks.filter((t: TaskType) => t.status === "open").length;
  const other = total - completed - inProgress - open;

  const percentCompleted = total ? ((completed / total) * 100).toFixed(1) : "0";
  const percentInProgress = total ? ((inProgress / total) * 100).toFixed(1) : "0";
  const percentOpen = total ? ((open / total) * 100).toFixed(1) : "0";
  const percentOther = total ? ((other / total) * 100).toFixed(1) : "0";

  const allTasksCompleted = total > 0 && completed === total;
  const isProjectLead = project?.projectLead?.id === profile?.id;
  const isProjectManager = project?.projectManager?.id === profile?.id;
  const isSuperUser = (profile as any)?.role?.name?.toLowerCase() === "superuser";
  const canCompleteProject =
    (isProjectLead || isProjectManager || isSuperUser) && project?.status === "active";

  const completeMutation = useMutation({
    mutationFn: () => completeProject(projectIdStr),
    onSuccess: () => {
      message.success("Project marked as completed successfully");
      queryClient.invalidateQueries({ queryKey: ["project", projectIdStr] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Failed to complete project");
    },
  });

  const handleCompleteProject = () => {
    Modal.confirm({
      title: "Complete Project",
      content:
        "Are you sure you want to mark this project as completed? All tasks must be finished before completion.",
      okText: "Yes, Complete",
      cancelText: "Cancel",
      onOk: () => completeMutation.mutate(),
    });
  };

  // Build Hierarchical Task Super -> Task Group Progress Tree
  const hierarchicalSummaries = useMemo(() => {
    // Map of superProjectId -> { name, groups: Map<groupId, SummaryRow> }
    const superMap = new Map<
      string,
      {
        superId: string;
        superName: string;
        groupsMap: Map<string, SummaryRow>;
      }
    >();

    // Helper to get or create Super Project entry
    const getSuperEntry = (sId: string, sName: string) => {
      if (!superMap.has(sId)) {
        superMap.set(sId, {
          superId: sId,
          superName: sName,
          groupsMap: new Map<string, SummaryRow>(),
        });
      }
      return superMap.get(sId)!;
    };

    // 1. Initialize from taskGroupsData API if available
    if (Array.isArray(taskGroupsData)) {
      taskGroupsData.forEach((group: any) => {
        const sObj = group.taskSuper || group.taskSuperProject;
        const sId = sObj?.id?.toString() || "uncategorized-super";
        const sName = sObj?.name || "General Super Project";
        const gId = group.id?.toString();
        const gName = group.name || "Task Group";

        if (gId) {
          const superEntry = getSuperEntry(sId, sName);
          if (!superEntry.groupsMap.has(gId)) {
            superEntry.groupsMap.set(gId, {
              key: `group-${gId}`,
              name: gName,
              isSuper: false,
              total: 0,
              completed: 0,
              inProgress: 0,
              open: 0,
              other: 0,
              percent: 0,
            });
          }
        }
      });
    }

    // 2. Aggregate tasks into Super Project -> Task Group structure
    mainTasks.forEach((task: any) => {
      const gObj = task.groupProject || task.group;
      const sObj = gObj?.taskSuper || gObj?.taskSuperProject;

      const sId = sObj?.id?.toString() || "uncategorized-super";
      const sName = sObj?.name || "General Super Project";

      const gId = gObj?.id?.toString() || "uncategorized-group";
      const gName = gObj?.name || "General Group";

      const superEntry = getSuperEntry(sId, sName);
      if (!superEntry.groupsMap.has(gId)) {
        superEntry.groupsMap.set(gId, {
          key: `group-${gId}`,
          name: gName,
          isSuper: false,
          total: 0,
          completed: 0,
          inProgress: 0,
          open: 0,
          other: 0,
          percent: 0,
        });
      }

      const groupRow = superEntry.groupsMap.get(gId)!;
      groupRow.total += 1;

      if (
        task.status === "done" ||
        task.status === "second_verified" ||
        task.status === "first_verified"
      ) {
        groupRow.completed += 1;
      } else if (task.status === "in_progress") {
        groupRow.inProgress += 1;
      } else if (task.status === "open") {
        groupRow.open += 1;
      } else {
        groupRow.other += 1;
      }
    });

    // 3. Construct tree rows
    const treeRows: SummaryRow[] = [];

    superMap.forEach((superEntry) => {
      const childGroups: SummaryRow[] = [];
      let superTotal = 0;
      let superCompleted = 0;
      let superInProgress = 0;
      let superOpen = 0;
      let superOther = 0;

      superEntry.groupsMap.forEach((groupRow) => {
        groupRow.percent =
          groupRow.total > 0
            ? Math.round((groupRow.completed / groupRow.total) * 100)
            : 0;

        superTotal += groupRow.total;
        superCompleted += groupRow.completed;
        superInProgress += groupRow.inProgress;
        superOpen += groupRow.open;
        superOther += groupRow.other;

        childGroups.push(groupRow);
      });

      const superPercent =
        superTotal > 0
          ? Math.round((superCompleted / superTotal) * 100)
          : 0;

      treeRows.push({
        key: `super-${superEntry.superId}`,
        name: superEntry.superName,
        isSuper: true,
        total: superTotal,
        completed: superCompleted,
        inProgress: superInProgress,
        open: superOpen,
        other: superOther,
        percent: superPercent,
        children: childGroups.length > 0 ? childGroups : undefined,
      });
    });

    return treeRows;
  }, [mainTasks, taskGroupsData]);

  const groupColumns = [
    {
      title: "Task Hierarchy",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: SummaryRow) => (
        <Space align="center">
          {record.isSuper ? (
            <Text strong style={{ fontSize: 15, color: "#1890ff" }}>
              {name}
            </Text>
          ) : (
            <>
              <FolderOutlined style={{ color: "#fa8c16", marginLeft: 8 }} />
              <Text>{name}</Text>
            </>
          )}
        </Space>
      ),
    },
    {
      title: "Progress",
      dataIndex: "percent",
      key: "percent",
      width: 220,
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          strokeColor={percent === 100 ? "#52c41a" : "#1890ff"}
        />
      ),
    },
    {
      title: "Total Tasks",
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      render: (t: number) => <Text strong>{t}</Text>,
    },
    {
      title: "Completed",
      dataIndex: "completed",
      key: "completed",
      align: "center" as const,
      render: (comp: number, record: SummaryRow) => (
        <Tag color={comp === record.total && record.total > 0 ? "success" : "green"}>
          {comp} / {record.total}
        </Tag>
      ),
    },
    {
      title: "In Progress",
      dataIndex: "inProgress",
      key: "inProgress",
      align: "center" as const,
      render: (inProg: number) => (
        <Tag color={inProg > 0 ? "processing" : "default"}>{inProg}</Tag>
      ),
    },
    {
      title: "Open",
      dataIndex: "open",
      key: "open",
      align: "center" as const,
      render: (op: number) => (
        <Tag color={op > 0 ? "warning" : "default"}>{op}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      align: "center" as const,
      render: (_: any, record: SummaryRow) => {
        if (record.total === 0) return <Tag color="default">No Tasks</Tag>;
        if (record.completed === record.total) return <Tag color="success">Completed</Tag>;
        if (record.inProgress > 0 || record.completed > 0)
          return <Tag color="processing">In Progress</Tag>;
        return <Tag color="warning">Pending</Tag>;
      },
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {/* Overall Progress Card */}
      <Col span={24}>
        <Card
          title="Overall Project Task Progress"
          extra={
            canCompleteProject &&
            allTasksCompleted && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleCompleteProject}
                loading={completeMutation.isPending}
              >
                Mark as Completed
              </Button>
            )
          }
        >
          {canCompleteProject && allTasksCompleted && (
            <Alert
              message="Ready for Completion"
              description="All tasks are completed. You can now mark this project as completed."
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {canCompleteProject && !allTasksCompleted && (
            <Alert
              message="Cannot Complete Yet"
              description={`${total - completed} task(s) still pending. All tasks must be completed before project completion.`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ marginBottom: 16 }}>
            <Progress
              percent={Number(percentCompleted)}
              status="active"
              strokeColor="#52c41a"
            />
            <div>
              <b>{percentCompleted}%</b> Completed
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: "#1890ff" }}>{percentInProgress}% In Progress</span> |{" "}
            <span style={{ color: "#faad14" }}>{percentOpen}% Open</span> |{" "}
            <span style={{ color: "#d9d9d9" }}>{percentOther}% Other</span>
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            <b>{total}</b> main tasks: {completed} completed, {inProgress} in progress, {open} open,{" "}
            {other} other
          </div>
        </Card>
      </Col>

      {/* Task Super -> Task Group Progress Hierarchy Table Card */}
      <Col span={24}>
        <Card 
          title="Task Super & Group Progress Breakdown"
          bodyStyle={{ padding: isMobile ? '12px 8px' : '24px' }}
        >
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {hierarchicalSummaries.map((superItem) => (
                <div
                  key={superItem.key}
                  className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOutlined style={{ color: "#1677ff", fontSize: 16 }} />
                      <span className="font-semibold text-gray-800 text-sm truncate">
                        {superItem.name}
                      </span>
                    </div>
                    {superItem.total === 0 ? (
                      <Tag color="default">No Tasks</Tag>
                    ) : superItem.completed === superItem.total ? (
                      <Tag color="success">Completed</Tag>
                    ) : superItem.inProgress > 0 || superItem.completed > 0 ? (
                      <Tag color="processing">In Progress</Tag>
                    ) : (
                      <Tag color="warning">Pending</Tag>
                    )}
                  </div>

                  <div className="mb-2">
                    <Progress
                      percent={superItem.percent}
                      size="small"
                      status={superItem.completed === superItem.total && superItem.total > 0 ? "success" : "active"}
                    />
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span>{superItem.completed} / {superItem.total} completed</span>
                      <span>{superItem.inProgress} in progress</span>
                    </div>
                  </div>

                  {superItem.children && superItem.children.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col gap-2">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Task Groups ({superItem.children.length})
                      </div>
                      {superItem.children.map((group) => (
                        <div
                          key={group.key}
                          className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <AppstoreOutlined style={{ color: "#64748b" }} />
                              <span className="font-medium text-gray-700 truncate">
                                {group.name}
                              </span>
                            </div>
                            {group.total === 0 ? (
                              <Tag color="default" style={{ margin: 0 }}>No Tasks</Tag>
                            ) : group.completed === group.total ? (
                              <Tag color="success" style={{ margin: 0 }}>Completed</Tag>
                            ) : group.inProgress > 0 || group.completed > 0 ? (
                              <Tag color="processing" style={{ margin: 0 }}>In Progress</Tag>
                            ) : (
                              <Tag color="warning" style={{ margin: 0 }}>Pending</Tag>
                            )}
                          </div>
                          <Progress
                            percent={group.percent}
                            size="small"
                            strokeWidth={6}
                            status={group.completed === group.total && group.total > 0 ? "success" : "normal"}
                          />
                          <div className="flex items-center justify-between text-gray-500 mt-1">
                            <span>Total: {group.total}</span>
                            <span>Done: {group.completed}</span>
                            <span>In Prog: {group.inProgress}</span>
                            <span>Open: {group.open}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Table
              columns={groupColumns}
              dataSource={hierarchicalSummaries}
              pagination={false}
              rowKey="key"
              defaultExpandAllRows={true}
              size="middle"
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default ProjectSummary;
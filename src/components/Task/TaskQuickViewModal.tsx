import React from "react";
import {
  Modal,
  Tag,
  Typography,
  Descriptions,
  Avatar,
  Space,
  Button,
  Divider,
  Card,
  List,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  ProjectOutlined,
  FolderOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import moment from "moment";
import TaskDeadlineTag from "./TaskDeadlineTag";

const { Title, Text, Paragraph } = Typography;

interface TaskQuickViewModalProps {
  task: any | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (task: any) => void;
}

export const TaskQuickViewModal: React.FC<TaskQuickViewModalProps> = ({
  task,
  open,
  onClose,
  onEdit,
}) => {
  if (!task) return null;

  const projectId = task.projectId || task.project?.id;
  const projectName = task.project?.name || task.projectName || "General Project";
  const groupObj = task.groupProject || task.group;
  const superObj = groupObj?.taskSuper || groupObj?.taskSuperProject;
  const superName = superObj?.name;
  const groupName = groupObj?.name;

  const priorityColorMap: Record<string, string> = {
    critical: "red",
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

  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  const subTasks = Array.isArray(task.children)
    ? task.children
    : Array.isArray(task.subTasks)
    ? task.subTasks
    : [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        onEdit && (
          <Button
            key="edit"
            icon={<EditOutlined />}
            onClick={() => {
              onClose();
              onEdit(task);
            }}
          >
            Edit Task
          </Button>
        ),
        projectId && (
          <Link
            key="details-page"
            to={`/projects/${projectId}/tasks/${task.id}`}
            onClick={onClose}
          >
            <Button type="primary" icon={<ArrowRightOutlined />}>
              Open Full Task Page
            </Button>
          </Link>
        ),
      ].filter(Boolean)}
      destroyOnClose
    >
      <div className="flex flex-col gap-4 pt-2">
        {/* Header Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {task.taskType && (
            <Tag color={task.taskType === "story" ? "blue" : "green"}>
              {task.taskType === "story" ? "Task" : "Subtask"}
            </Tag>
          )}
          {task.tcode && (
            <Tag color="cyan" style={{ fontWeight: 600 }}>
              {task.tcode}
            </Tag>
          )}
          {task.status && (
            <Tag color={statusColorMap[task.status] || "default"}>
              {statusLabelMap[task.status] || task.status}
            </Tag>
          )}
          {task.priority && (
            <Tag color={priorityColorMap[task.priority] || "default"}>
              {task.priority.toUpperCase()}
            </Tag>
          )}
          <TaskDeadlineTag dueDate={task.dueDate} status={task.status} />
        </div>

        {/* Title */}
        <div>
          <Title level={4} style={{ margin: "4px 0 0 0", color: "#0f172a" }}>
            {task.isSubTask && <span className="text-gray-400 mr-1.5 font-normal">↳</span>}
            {task.name}
          </Title>
          {task.parentTaskName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Parent: <span className="text-slate-700 font-medium">{task.parentTaskName}</span>
            </Text>
          )}
        </div>

        {/* Task Hierarchy & Project Location */}
        <Card size="small" className="bg-slate-50 border-slate-200" bodyStyle={{ padding: "10px 14px" }}>
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600">
            {projectName && (
              <div className="flex items-center gap-1.5">
                <ProjectOutlined className="text-blue-500" />
                <span className="font-semibold text-slate-800">{projectName}</span>
              </div>
            )}
            {superName && (
              <div className="flex items-center gap-1.5">
                <AppstoreOutlined className="text-indigo-500" />
                <span>Super: <strong>{superName}</strong></span>
              </div>
            )}
            {groupName && (
              <div className="flex items-center gap-1.5">
                <FolderOutlined className="text-amber-500" />
                <span>Group: <strong>{groupName}</strong></span>
              </div>
            )}
          </div>
        </Card>

        {/* Main Details Table */}
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Deadline / Due Date">
            <div className="flex items-center gap-2">
              <TaskDeadlineTag dueDate={task.dueDate} status={task.status} />
              {task.dueDate && (
                <span className="text-xs text-gray-500">
                  ({moment(task.dueDate).format("YYYY-MM-DD")})
                </span>
              )}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Assignees">
            {assignees.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Avatar.Group max={{ count: 3 }}>
                  {assignees.map((u: any) => {
                    const uName = u?.username || u?.name || (typeof u === "string" ? u : "U");
                    const uId = u?.id || uName;
                    return (
                      <Tooltip key={uId} title={uName}>
                        <Avatar style={{ backgroundColor: "#87d068" }} size="small">
                          {uName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    );
                  })}
                </Avatar.Group>
                <span className="text-xs text-gray-600">
                  {assignees
                    .map((u: any) => u?.username || u?.name || (typeof u === "string" ? u : "User"))
                    .join(", ")}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Unassigned</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Budgeted Hours">
            <span className="font-medium text-slate-700">
              {task.budgetedHours != null ? `${task.budgetedHours} hrs` : "Not specified"}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Created Date">
            <span className="text-xs text-gray-600">
              {task.createdAt ? moment(task.createdAt).format("YYYY-MM-DD HH:mm") : "-"}
            </span>
          </Descriptions.Item>

          {task.status === "done" && (
            <Descriptions.Item label="Verification" span={2}>
              <div className="flex items-center gap-3 text-xs">
                {task.firstVerifiedBy ? (
                  <Tag color="blue">
                    ✓ 1st Verified {task.firstVerifiedAt ? `(${moment(task.firstVerifiedAt).format("YYYY-MM-DD")})` : ""}
                  </Tag>
                ) : (
                  <Tag color="default">1st Verification Pending</Tag>
                )}
                {task.secondVerifiedBy ? (
                  <Tag color="purple">
                    ✓✓ 2nd Verified {task.secondVerifiedAt ? `(${moment(task.secondVerifiedAt).format("YYYY-MM-DD")})` : ""}
                  </Tag>
                ) : (
                  <Tag color="default">2nd Verification Pending</Tag>
                )}
              </div>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Description Section */}
        <div>
          <Text strong className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
            Description
          </Text>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap min-h-[60px]">
            {task.description ? task.description : <span className="text-gray-400 italic">No description provided for this task.</span>}
          </div>
        </div>

        {/* Subtasks Section if any */}
        {subTasks.length > 0 && (
          <div>
            <Text strong className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
              Subtasks ({subTasks.length})
            </Text>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <List
                size="small"
                dataSource={subTasks}
                renderItem={(st: any) => (
                  <List.Item
                    key={st.id}
                    className="hover:bg-slate-50 transition-colors"
                    extra={<TaskDeadlineTag dueDate={st.dueDate} status={st.status} />}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center gap-2">
                          <Tag color="green" style={{ fontSize: 10, margin: 0 }}>Sub</Tag>
                          <span className="text-xs font-medium text-slate-800">{st.name}</span>
                          {st.tcode && <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{st.tcode}</Tag>}
                        </div>
                      }
                      description={
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Status: {st.status || "open"}</span>
                          {st.priority && <span>• Priority: {st.priority}</span>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskQuickViewModal;

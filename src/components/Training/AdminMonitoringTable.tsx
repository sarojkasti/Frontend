import React, { useMemo, useState } from "react";
import {
  Button,
  Input,
  Popconfirm,
  Progress,
  Select,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { PowerTable, PowerTableColumn, useColumnVisibility } from "@/components/Table";
import {
  useAdminMonitoringEnrollments,
  useAdminRemoveEnrollment,
  useTrainingCourses,
} from "@/hooks/training/useTraining";
import { useSession } from "@/context/SessionContext";
import { AdminMonitoringEnrollment } from "@/types/training";

const { Text } = Typography;

const MONITORING_COLUMNS_DEF = [
  { key: "student", label: "Student", required: true },
  { key: "course", label: "Course", required: true },
  { key: "progress", label: "Progress" },
  { key: "quizScore", label: "Quiz Score" },
  { key: "timeSpent", label: "Time Spent" },
  { key: "status", label: "Status" },
  { key: "dueDate", label: "Due Date" },
  { key: "lastAccessed", label: "Last Accessed" },
  { key: "actions", label: "Actions", required: true },
];

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return "0m";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

const AdminMonitoringTable: React.FC = () => {
  const { profile } = useSession();
  const roleName = (profile?.role?.name || "").toLowerCase().trim();
  const isAdmin = ["superuser", "superadmin", "administrator", "admin"].includes(roleName);

  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data: enrollments = [], isLoading } = useAdminMonitoringEnrollments(true);
  const { data: courses = [] } = useTrainingCourses();
  const { mutateAsync: removeEnrollment } = useAdminRemoveEnrollment();

  const { visibleColumnKeys } = useColumnVisibility({
    persistenceKey: "lms_admin_monitoring",
    columns: MONITORING_COLUMNS_DEF,
  });

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrollments.filter((item) => {
      if (courseFilter && item.courseId !== courseFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (item.student?.name || "").toLowerCase().includes(q) ||
        (item.student?.email || "").toLowerCase().includes(q) ||
        (item.course?.title || "").toLowerCase().includes(q) ||
        (item.course?.code || "").toLowerCase().includes(q)
      );
    });
  }, [enrollments, searchQuery, courseFilter, statusFilter]);

  const columns: PowerTableColumn<AdminMonitoringEnrollment>[] = [
    {
      key: "student",
      title: "Student",
      defaultWidth: 190,
      render: (_val, record) => (
        <div>
          <div className="font-medium text-slate-900">
            {record.student?.name || "—"}
          </div>
          <div className="text-xs text-slate-500">
            {record.student?.role || record.student?.email}
          </div>
        </div>
      ),
    },
    {
      key: "course",
      title: "Course",
      defaultWidth: 210,
      render: (_val, record) => (
        <div>
          <div className="font-medium text-slate-900">
            {record.course?.title || "—"}
          </div>
          <div className="text-xs text-slate-500">
            {record.course?.code}
            {record.course?.category ? ` • ${record.course.category}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "progress",
      title: "Progress",
      defaultWidth: 150,
      render: (_val, record) => (
        <Progress
          percent={Math.round(record.progressPercent || 0)}
          size="small"
        />
      ),
    },
    {
      key: "quizScore",
      title: "Quiz Score",
      defaultWidth: 100,
      render: (_val, record) =>
        record.quizScore !== null && record.quizScore !== undefined ? (
          <Tag color={record.quizScore >= 70 ? "green" : "orange"}>
            {record.quizScore}%
          </Tag>
        ) : (
          <Text type="secondary" className="text-xs">
            —
          </Text>
        ),
    },
    {
      key: "timeSpent",
      title: "Time Spent",
      defaultWidth: 100,
      render: (_val, record) => (
        <span className="text-xs text-slate-700">
          {formatDuration(record.timeSpentSeconds)}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      defaultWidth: 120,
      render: (_val, record) => (
        <div>
          <Tag color={record.status === "completed" ? "green" : "blue"}>
            {record.status}
          </Tag>
          {record.certificateNumber && (
            <div className="text-[11px] text-emerald-700 mt-0.5 flex items-center gap-1">
              <SafetyCertificateOutlined /> {record.certificateNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dueDate",
      title: "Due Date",
      defaultWidth: 115,
      render: (_val, record) =>
        record.dueDate ? (
          <span className="text-xs">{dayjs(record.dueDate).format("YYYY-MM-DD")}</span>
        ) : (
          <Text type="secondary" className="text-xs">
            —
          </Text>
        ),
    },
    {
      key: "lastAccessed",
      title: "Last Accessed",
      defaultWidth: 135,
      render: (_val, record) =>
        record.lastAccessedAt ? (
          <span className="text-xs text-slate-500">
            {dayjs(record.lastAccessedAt).format("YYYY-MM-DD HH:mm")}
          </span>
        ) : (
          <Text type="secondary" className="text-xs">
            Never
          </Text>
        ),
    },
    {
      key: "actions",
      title: "Actions",
      required: true,
      defaultWidth: 90,
      render: (_val, record) =>
        isAdmin ? (
          <Popconfirm
            title="Unenroll this student?"
            onConfirm={() => removeEnrollment(record.id)}
            okText="Unenroll"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Unenroll Student">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        ) : (
          <Text type="secondary" className="text-xs">
            —
          </Text>
        ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search student or course..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          className="sm:max-w-xs"
        />
        <Select
          placeholder="Filter by course"
          allowClear
          showSearch
          optionFilterProp="label"
          value={courseFilter}
          onChange={setCourseFilter}
          className="sm:w-60"
          options={courses.map((c) => ({
            label: `${c.code} - ${c.title}`,
            value: c.id,
          }))}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
          className="sm:w-44"
          options={[
            { label: "Enrolled", value: "enrolled" },
            { label: "Completed", value: "completed" },
          ]}
        />
      </div>

      <PowerTable<AdminMonitoringEnrollment>
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        enableResize
        enableColumnSearch
        visibleColumnKeys={visibleColumnKeys}
        showToolbar={false}
        persistenceKey="lms_admin_monitoring_table"
        pagination={{ pageSize: 15 }}
        emptyTitle="No student enrollments found"
        emptyDescription="Enroll students into courses to monitor their progress."
      />
    </div>
  );
};

export default AdminMonitoringTable;

import React, { useState } from "react";
import { Card, Collapse, Tabs, Tag, Typography } from "antd";
import {
  BarChartOutlined,
  BookOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useSession } from "@/context/SessionContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import CourseCatalog from "@/components/Training/CourseCatalog";
import AdminMonitoringTable from "@/components/Training/AdminMonitoringTable";
import MyLearning from "@/components/Training/MyLearning";

const { Text } = Typography;

const AdminSystemGuide: React.FC = () => (
  <div className="space-y-3 max-w-4xl">
    <Card size="small" title="How to Use the Self-Paced LMS (Admin & Super User Guide)">
      <Collapse
        defaultActiveKey={["1", "2", "3", "4"]}
        items={[
          {
            key: "1",
            label: "1. Manage Course Categories",
            children: (
              <Text className="text-sm text-slate-700">
                Add categories directly inside the <strong>Create Course</strong> modal (via the{" "}
                <Tag>+ New</Tag> button) or from <strong>Settings → LMS Course Categories</strong>.
                Only <strong>Super User</strong> can delete categories.
              </Text>
            ),
          },
          {
            key: "2",
            label: "2. Create Courses, Modules, Lessons & Quizzes",
            children: (
              <Text className="text-sm text-slate-700">
                Managers and above can create courses in <strong>Course Management</strong>, then click{" "}
                <Tag>Content & Timing</Tag> to add modules, upload private videos/PDFs/documents
                (stored securely outside public static paths), write rich-text lessons, and build quizzes.
              </Text>
            ),
          },
          {
            key: "3",
            label: "3. Configure Timing Policies & System-Only Viewing",
            children: (
              <Text className="text-sm text-slate-700">
                In <Tag>Content & Timing → Timing Policy</Tag>, choose <strong>Always Accessible</strong>,{" "}
                <strong>Allow Only During Selected Window</strong>, or{" "}
                <strong>Ban / Block During Selected Window</strong> by day of week and time.
                With <strong>System-Only Viewing</strong> enabled, content streams in-app with no
                download links and displays a user watermark.
              </Text>
            ),
          },
          {
            key: "4",
            label: "4. Enroll Students & Monitor Completion",
            children: (
              <Text className="text-sm text-slate-700">
                Click <Tag>Enroll</Tag> on any course card to assign students with an optional due date
                (or enable <strong>Open Self-Enrollment</strong> on the course). Track progress %,
                quiz scores, time spent, and certificates in the <strong>Admin Monitoring</strong> tab.
              </Text>
            ),
          },
        ]}
      />
    </Card>
  </div>
);

const TrainingPage: React.FC = () => {
  const { profile } = useSession();
  const { isMobile } = useIsMobile();

  const roleName = (profile?.role?.name || "").toLowerCase().trim();
  const isAdmin = ["superuser", "superadmin", "administrator", "admin"].includes(roleName);
  const isTeacher = isAdmin || ["manager", "projectmanager"].includes(roleName);

  const [activeTab, setActiveTab] = useState<string>(
    isTeacher ? "studio" : "my-courses"
  );

  const tabItems = isAdmin
    ? [
        {
          key: "studio",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <SettingOutlined />
              Course Management
            </span>
          ),
          children: <CourseCatalog mode="studio" />,
        },
        {
          key: "monitoring",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <BarChartOutlined />
              Admin Monitoring
            </span>
          ),
          children: <AdminMonitoringTable />,
        },
        {
          key: "guide",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <QuestionCircleOutlined />
              System Guide
            </span>
          ),
          children: <AdminSystemGuide />,
        },
      ]
    : isTeacher
    ? [
        {
          key: "studio",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <SettingOutlined />
              Course Studio
            </span>
          ),
          children: <CourseCatalog mode="studio" />,
        },
        {
          key: "monitoring",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <BarChartOutlined />
              Student Progress
            </span>
          ),
          children: <AdminMonitoringTable />,
        },
        {
          key: "my-learning",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <BookOutlined />
              My Learning
            </span>
          ),
          children: <MyLearning />,
        },
      ]
    : [
        {
          key: "my-courses",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <ReadOutlined />
              My Courses
            </span>
          ),
          children: <CourseCatalog mode="student" />,
        },
        {
          key: "completed",
          label: (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleOutlined />
              Progress & Certificates
            </span>
          ),
          children: <MyLearning />,
        },
      ];

  return (
    <div className="w-full">
      <Card styles={{ body: { padding: isMobile ? "10px" : "14px 16px" } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default TrainingPage;

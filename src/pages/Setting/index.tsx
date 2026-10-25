import React from "react";
import { Card, Col, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import {
  SafetyCertificateOutlined,
  KeyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  ProjectOutlined,
  TeamOutlined,
  ApartmentOutlined,
  CheckSquareOutlined,
  MailOutlined,
  FileTextOutlined,
  BellOutlined,
  SettingOutlined,
  ControlOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface SettingItem {
  key: string;
  title: string;
  description: string;
  path?: string;
  icon: React.ReactNode;
}

const SETTING_ITEMS: SettingItem[] = [
  {
    key: "role",
    title: "Roles & Permissions",
    description: "Manage user roles and assign granular resource permissions to control access.",
    path: "/role",
    icon: <SafetyCertificateOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "permission",
    title: "Permissions",
    description: "View and manage system API endpoints, scopes, and resource-level permissions.",
    path: "/permission",
    icon: <KeyOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "workhour",
    title: "Work Hour Settings",
    description: "Configure standard work hours for roles and individual users, schedules, and daily thresholds.",
    path: "/workhour-settings",
    icon: <ClockCircleOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "holiday",
    title: "Holiday Management",
    description: "Manage official company holidays and leave policies. Import annual calendar from CSV.",
    path: "/holiday",
    icon: <CalendarOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "leave-types",
    title: "Leave Types",
    description: "Configure annual leave categories, maximum quotas, carry-forward limits, and policies.",
    path: "/leave-types",
    icon: <ScheduleOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "project",
    title: "Project Setting",
    description: "Manage Nature of Work types, short codes, and categorizations for project automation.",
    path: "/project-setting",
    icon: <ProjectOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "customer",
    title: "Customer Setting",
    description: "Manage customer business sizes, business natures, and legal entity classifications.",
    path: "/customer-setting",
    icon: <TeamOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "department",
    title: "Department Management",
    description: "Create and organize internal organizational departments and assign staff hierarchies.",
    path: "/department-setting",
    icon: <ApartmentOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "task-types",
    title: "Task Type Settings",
    description: "Manage task types, workflow categories, and templates for the Todo Task module.",
    path: "/todotask/task-types",
    icon: <CheckSquareOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "mail",
    title: "Mail Settings",
    description: "Configure automated attendance reminder emails, cron schedules, grace periods, and exclusions.",
    path: "/mail-settings",
    icon: <MailOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "client-report-doc-types",
    title: "Client Report Document Types",
    description: "Manage document templates and categories for client-facing status and billing reports.",
    path: "/client-report-document-types",
    icon: <FileTextOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "notifications",
    title: "Notification Settings",
    description: "Test push & in-app alerts, target specific users & devices, and inspect active web push subscriptions.",
    path: "/notification-settings",
    icon: <BellOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "general",
    title: "General Settings",
    description: "Advanced portal preferences, theme configurations, attachments limits, and approval workflows.",
    icon: <SettingOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
  {
    key: "instance",
    title: "Instance Configuration",
    description: "Instance regions, sites, operational hours, holiday groups, currency, and organization parameters.",
    icon: <ControlOutlined style={{ fontSize: 20, color: "#1677ff" }} />,
  },
];

const Setting: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
          System Settings
        </Title>
        <Paragraph className="text-gray-500 !mb-0 mt-1">
          Manage system configurations, user permissions, workflows, notifications, and organizational policies.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {SETTING_ITEMS.map((item) => {
          const isClickable = Boolean(item.path);
          return (
            <Col key={item.key} xs={24} sm={12} md={8} lg={6}>
              <Card
                className={`h-full transition-all duration-200 ${
                  isClickable ? "hover:border-blue-400 hover:shadow-sm cursor-pointer" : "opacity-75"
                }`}
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  }
                }}
                hoverable={isClickable}
                bodyStyle={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 8,
                    background: "#f0f5ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <Title level={4} style={{ fontSize: 16, marginBottom: 8, color: "#1f2937" }}>
                  {item.title}
                </Title>
                <Paragraph
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 0,
                    flexGrow: 1,
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </Paragraph>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default Setting;

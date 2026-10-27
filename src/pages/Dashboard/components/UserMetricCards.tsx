import React from "react";
import { Row, Col, Card, Typography, Progress, Tag, Space } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ProjectOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

interface UserMetricCardsProps {
  todayHours: number;
  targetHours?: number;
  activeTasksCount: number;
  activeProjectTasksCount?: number;
  activeTodoTasksCount?: number;
  inProgressTasksCount: number;
  overdueTasksCount: number;
  dueTodayTasksCount: number;
  remainingLeaveDays: number;
  casualLeaveDays: number;
  sickLeaveDays: number;
  activeProjectsCount: number;
  onLeaveClick?: () => void;
}

export const UserMetricCards: React.FC<UserMetricCardsProps> = ({
  todayHours,
  targetHours = 8,
  activeTasksCount,
  activeProjectTasksCount,
  activeTodoTasksCount = 0,
  inProgressTasksCount,
  overdueTasksCount,
  dueTodayTasksCount,
  remainingLeaveDays,
  casualLeaveDays,
  sickLeaveDays,
  activeProjectsCount,
  onLeaveClick,
}) => {
  const navigate = useNavigate();

  const hoursPercent = Math.min(100, Math.round((todayHours / targetHours) * 100));
  const hoursRemaining = Math.max(0, targetHours - todayHours);

  return (
    <Row gutter={[16, 16]}>
      {/* 1. Today's Working Hours */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          hoverable
          className="border border-slate-200 shadow-2xs rounded-xl h-full flex flex-col justify-between transition-all hover:border-blue-400"
          styles={{ body: { padding: "16px 20px" } }}
          onClick={() => navigate("/worklogs-all")}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Today's Workhours
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ClockCircleOutlined className="text-base" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {todayHours.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-slate-600">
                / {targetHours.toFixed(1)} hrs
              </span>
            </div>

            <div className="mt-3">
              <Progress
                percent={hoursPercent}
                strokeColor={todayHours >= targetHours ? "#10b981" : "#2563eb"}
                trailColor="#e2e8f0"
                size="small"
                showInfo={false}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
            {todayHours >= targetHours ? (
              <span className="text-emerald-800 font-medium flex items-center gap-1">
                <CheckCircleOutlined /> Daily target achieved
              </span>
            ) : (
              <span className="text-slate-600">
                <strong className="text-slate-800">{hoursRemaining.toFixed(1)}h</strong> remaining
              </span>
            )}
            <span className="text-blue-700 font-medium flex items-center gap-0.5 hover:underline">
              Log <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </Card>
      </Col>

      {/* 2. My Assigned Tasks */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          hoverable
          className="border border-slate-200 shadow-2xs rounded-xl h-full flex flex-col justify-between transition-all hover:border-emerald-400"
          styles={{ body: { padding: "16px 20px" } }}
          onClick={() => navigate("/tasks")}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Assigned Tasks
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircleOutlined className="text-base" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeTasksCount}
              </span>
              <span className="text-xs font-medium text-slate-600">
                {activeTodoTasksCount > 0
                  ? `(${activeProjectTasksCount ?? 0} project • ${activeTodoTasksCount} todo)`
                  : "active in backlog"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <Tag color="blue" className="text-xs m-0 border-0 bg-blue-50 text-blue-700">
                {inProgressTasksCount} In Progress
              </Tag>
              {dueTodayTasksCount > 0 && (
                <Tag color="gold" className="text-xs m-0 border-0 bg-amber-50 text-amber-700">
                  {dueTodayTasksCount} Due Today
                </Tag>
              )}
              {overdueTasksCount > 0 && (
                <Tag color="error" className="text-xs m-0 border-0 bg-rose-50 text-rose-700 font-semibold">
                  {overdueTasksCount} Overdue
                </Tag>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-600">
              {overdueTasksCount > 0 ? (
                <span className="text-rose-800 font-medium">Needs attention</span>
              ) : (
                "On schedule"
              )}
            </span>
            <span className="text-emerald-700 font-medium flex items-center gap-0.5 hover:underline">
              View <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </Card>
      </Col>

      {/* 3. Leave Balance Available */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          hoverable
          className="border border-slate-200 shadow-2xs rounded-xl h-full flex flex-col justify-between transition-all hover:border-purple-400"
          styles={{ body: { padding: "16px 20px" } }}
          onClick={onLeaveClick}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Leave Balance
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <CalendarOutlined className="text-base" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {remainingLeaveDays}
              </span>
              <span className="text-xs font-medium text-slate-600">
                days available
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                Casual: {casualLeaveDays}d
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                Sick: {sickLeaveDays}d
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-600">Current year balance</span>
            <span className="text-purple-700 font-medium flex items-center gap-0.5 hover:underline">
              Request <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </Card>
      </Col>

      {/* 4. Active Projects */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          hoverable
          className="border border-slate-200 shadow-2xs rounded-xl h-full flex flex-col justify-between transition-all hover:border-amber-400"
          styles={{ body: { padding: "16px 20px" } }}
          onClick={() => navigate("/projects")}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Active Projects
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ProjectOutlined className="text-base" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeProjectsCount}
              </span>
              <span className="text-xs font-medium text-slate-600">
                participating projects
              </span>
            </div>

            <div className="mt-3 text-xs text-slate-600">
              Assigned across ongoing sprints
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-600">Active workspaces</span>
            <span className="text-amber-700 font-medium flex items-center gap-0.5 hover:underline">
              Explore <ArrowRightOutlined className="text-[10px]" />
            </span>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

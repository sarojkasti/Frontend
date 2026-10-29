import React, { useState, useMemo } from "react";
import { Row, Col } from "antd";
import moment from "moment";
import { UserHeroHeader } from "./components/UserHeroHeader";
import { UserMetricCards } from "./components/UserMetricCards";
import { UserTasksWidget } from "./components/UserTasksWidget";
import { UserWorklogsWidget } from "./components/UserWorklogsWidget";
import { UserLeaveWidget } from "./components/UserLeaveWidget";
import { UserHolidaysWidget } from "./components/UserHolidaysWidget";
import { UserNoticeWidget } from "./components/UserNoticeWidget";
import LeaveRequestModal from "@/components/Leave/LeaveRequestModal";
import { useCurrentUserTasks } from "@/hooks/task/useCurrentUserTasks";
import { useWorklogbyUser } from "@/hooks/worklog/useWorklogbyUser";
import { useMyLeaveBalances } from "@/hooks/useLeaveTypes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/context/SessionContext";
import { fetchTodoTasksByAssignedUser } from "@/service/todoTask.service";
import { parseTimeMoment } from "@/utils/formatUtils";

export const UserDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { profile } = useSession();
  const userId = profile?.id ? String(profile.id) : "";
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Queries for high-level metrics
  const { data: rawTasks } = useCurrentUserTasks(true);
  const { data: rawWorklogs } = useWorklogbyUser();
  const { data: rawBalances } = useMyLeaveBalances();

  // Query for assigned todo tasks
  const { data: rawTodoTasks } = useQuery({
    queryKey: ["my-todo-tasks", userId],
    queryFn: async () => {
      if (!userId) return [];
      return fetchTodoTasksByAssignedUser(userId);
    },
    enabled: !!userId,
  });

  // 1. Calculate today's logged hours
  const todayHours = useMemo(() => {
    if (!rawWorklogs || !Array.isArray(rawWorklogs)) return 0;
    const todayStr = moment().format("YYYY-MM-DD");
    return rawWorklogs.reduce((acc: number, log: any) => {
      let logDateStr = "";
      if (log.date) {
        logDateStr = moment(log.date).format("YYYY-MM-DD");
      } else if (log.startTime) {
        const parsed = parseTimeMoment(log.startTime, log.date);
        if (parsed) logDateStr = parsed.format("YYYY-MM-DD");
        else if (typeof log.startTime === "string" && log.startTime.includes("T")) {
          logDateStr = moment(log.startTime).format("YYYY-MM-DD");
        }
      } else if (log.createdAt) {
        logDateStr = moment(log.createdAt).format("YYYY-MM-DD");
      }

      if (logDateStr === todayStr) {
        let durationMins = 0;
        if (typeof log.durationMinutes === "number" && !isNaN(log.durationMinutes)) {
          durationMins = log.durationMinutes;
        } else if (log.startTime && log.endTime) {
          const startM = parseTimeMoment(log.startTime, todayStr);
          const endM = parseTimeMoment(log.endTime, todayStr);
          if (startM && endM) {
            durationMins = Math.max(0, endM.diff(startM, "minutes"));
          }
        }
        return acc + durationMins / 60;
      }
      return acc;
    }, 0);
  }, [rawWorklogs]);

  // 2. Calculate project task metrics
  const taskStats = useMemo(() => {
    if (!rawTasks || !Array.isArray(rawTasks)) {
      return {
        active: 0,
        inProgress: 0,
        overdue: 0,
        dueToday: 0,
        projectCount: 0,
      };
    }

    // Deduplicate tasks by ID
    const taskMap = new Map<string, any>();
    rawTasks.forEach((t: any) => {
      if (t && t.id != null) taskMap.set(String(t.id), t);
    });
    const uniqueTasks = Array.from(taskMap.values());

    let active = 0;
    let inProgress = 0;
    let overdue = 0;
    let dueToday = 0;
    const projectSet = new Set<string>();

    const today = moment().startOf("day");

    uniqueTasks.forEach((t: any) => {
      const isDone = t.status === "done" || t.status === "completed";
      if (!isDone) {
        active++;
        if (t.status === "in_progress") inProgress++;

        if (t.project?.id) {
          projectSet.add(String(t.project.id));
        }

        if (t.dueDate) {
          const due = moment(t.dueDate).startOf("day");
          const diff = due.diff(today, "days");
          if (diff < 0) overdue++;
          else if (diff === 0) dueToday++;
        }
      }
    });

    return {
      active,
      inProgress,
      overdue,
      dueToday,
      projectCount: projectSet.size,
    };
  }, [rawTasks]);

  // 3. Calculate todo task metrics
  const todoStats = useMemo(() => {
    if (!rawTodoTasks || !Array.isArray(rawTodoTasks)) {
      return { active: 0, overdue: 0, dueToday: 0 };
    }

    let active = 0;
    let overdue = 0;
    let dueToday = 0;
    const today = moment().startOf("day");

    rawTodoTasks.forEach((t: any) => {
      const isDone = t.status === "completed" || t.status === "dropped";
      if (!isDone) {
        active++;
        if (t.dueDate) {
          const due = moment(t.dueDate).startOf("day");
          const diff = due.diff(today, "days");
          if (diff < 0) overdue++;
          else if (diff === 0) dueToday++;
        }
      }
    });

    return { active, overdue, dueToday };
  }, [rawTodoTasks]);

  // 4. Calculate leave metrics
  const leaveStats = useMemo(() => {
    if (!rawBalances || !Array.isArray(rawBalances)) {
      return { total: 0, casual: 0, sick: 0 };
    }

    let total = 0;
    let casual = 0;
    let sick = 0;

    rawBalances.forEach((b: any) => {
      const rem = Number(b.remainingDays) || 0;
      total += rem;

      const typeName = (b.leaveType?.name || "").toLowerCase();
      if (typeName.includes("casual")) casual += rem;
      else if (typeName.includes("sick") || typeName.includes("medical")) sick += rem;
    });

    return { total, casual, sick };
  }, [rawBalances]);

  const handleLeaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
    queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
  };

  return (
    <div className="flex flex-col gap-5 pb-12" style={{ minHeight: 0 }}>
      {/* 1. Hero Greeting & Live Clock Banner */}
      <UserHeroHeader onRequestLeave={() => setIsLeaveModalOpen(true)} />

      {/* 2. Key Metrics Overview Row */}
      <UserMetricCards
        todayHours={todayHours}
        targetHours={8}
        activeTasksCount={taskStats.active + todoStats.active}
        activeProjectTasksCount={taskStats.active}
        activeTodoTasksCount={todoStats.active}
        inProgressTasksCount={taskStats.inProgress}
        overdueTasksCount={taskStats.overdue + todoStats.overdue}
        dueTodayTasksCount={taskStats.dueToday + todoStats.dueToday}
        remainingLeaveDays={leaveStats.total}
        casualLeaveDays={leaveStats.casual}
        sickLeaveDays={leaveStats.sick}
        activeProjectsCount={taskStats.projectCount}
        onLeaveClick={() => setIsLeaveModalOpen(true)}
      />

      {/* 3. Main Workspace Grid: Action Stream (Left) vs Life & Team Hub (Right) */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Tasks & Worklogs (15 cols on desktop) */}
        <Col xs={24} lg={14} xl={15} className="flex flex-col gap-5">
          <UserTasksWidget />
          <UserWorklogsWidget />
        </Col>

        {/* Right Column: Leave Balances, Holidays, and Notices (9 cols on desktop) */}
        <Col xs={24} lg={10} xl={9} className="flex flex-col gap-5">
          <UserLeaveWidget onRequestLeave={() => setIsLeaveModalOpen(true)} />
          <UserHolidaysWidget />
          <UserNoticeWidget />
        </Col>
      </Row>

      {/* Leave Request Modal */}
      {isLeaveModalOpen && (
        <LeaveRequestModal
          open={isLeaveModalOpen}
          onCancel={() => setIsLeaveModalOpen(false)}
          onSuccess={handleLeaveSuccess}
        />
      )}
    </div>
  );
};

export default UserDashboard;

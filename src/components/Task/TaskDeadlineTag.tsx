import React from "react";
import { Tag, Tooltip } from "antd";
import { ClockCircleOutlined, CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import moment from "moment";

interface TaskDeadlineTagProps {
  dueDate?: string | Date | null;
  status?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TaskDeadlineTag: React.FC<TaskDeadlineTagProps> = ({
  dueDate,
  status,
  className,
  style,
}) => {
  if (!dueDate) {
    return (
      <Tag
        className={className}
        style={{
          color: "#94a3b8",
          backgroundColor: "#f8fafc",
          borderColor: "#e2e8f0",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 400,
          margin: 0,
          ...style,
        }}
      >
        No deadline
      </Tag>
    );
  }

  const due = moment(dueDate);
  if (!due.isValid()) {
    return (
      <Tag className={className} style={{ margin: 0, fontSize: 11, ...style }}>
        Invalid date
      </Tag>
    );
  }

  const today = moment().startOf("day");
  const dueDay = moment(due).startOf("day");
  const diffDays = dueDay.diff(today, "days");

  const isDone =
    status === "done" ||
    status === "first_verified" ||
    status === "second_verified";

  const formattedDate = due.format("YYYY-MM-DD");

  if (isDone) {
    return (
      <Tooltip title={`Completed task. Deadline was ${formattedDate}`}>
        <Tag
          className={className}
          color="default"
          style={{
            fontSize: 11,
            borderRadius: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            margin: 0,
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            borderColor: "#e2e8f0",
            ...style,
          }}
        >
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          <span>{formattedDate}</span>
        </Tag>
      </Tooltip>
    );
  }

  // Active task deadlines
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return (
      <Tooltip title={`Overdue by ${overdueDays} day(s)! Deadline was ${formattedDate}`}>
        <Tag
          className={className}
          color="error"
          style={{
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            margin: 0,
            ...style,
          }}
        >
          <ClockCircleOutlined />
          <span>Overdue ({overdueDays}d ago)</span>
        </Tag>
      </Tooltip>
    );
  }

  if (diffDays === 0) {
    return (
      <Tooltip title={`Deadline is TODAY (${formattedDate})!`}>
        <Tag
          className={className}
          color="warning"
          style={{
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            margin: 0,
            ...style,
          }}
        >
          <ClockCircleOutlined />
          <span>Due Today</span>
        </Tag>
      </Tooltip>
    );
  }

  if (diffDays === 1) {
    return (
      <Tooltip title={`Deadline is tomorrow (${formattedDate})`}>
        <Tag
          className={className}
          color="gold"
          style={{
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            margin: 0,
            ...style,
          }}
        >
          <CalendarOutlined />
          <span>Due Tomorrow</span>
        </Tag>
      </Tooltip>
    );
  }

  if (diffDays <= 3) {
    return (
      <Tooltip title={`Deadline: ${formattedDate} (${diffDays} days left)`}>
        <Tag
          className={className}
          color="orange"
          style={{
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            margin: 0,
            ...style,
          }}
        >
          <CalendarOutlined />
          <span>{diffDays} days left</span>
        </Tag>
      </Tooltip>
    );
  }

  if (diffDays <= 7) {
    return (
      <Tooltip title={`Deadline: ${formattedDate} (${diffDays} days left)`}>
        <Tag
          className={className}
          color="cyan"
          style={{
            fontSize: 11,
            borderRadius: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            margin: 0,
            ...style,
          }}
        >
          <CalendarOutlined />
          <span>{due.format("MMM DD")} ({diffDays}d)</span>
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`Deadline: ${formattedDate} (${diffDays} days remaining)`}>
      <Tag
        className={className}
        color="blue"
        style={{
          fontSize: 11,
          borderRadius: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          margin: 0,
          ...style,
        }}
      >
        <CalendarOutlined />
        <span>{formattedDate}</span>
      </Tag>
    </Tooltip>
  );
};

export default TaskDeadlineTag;

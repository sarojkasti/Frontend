import React, { useMemo } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Empty,
  Tooltip,
  Progress,
  Row,
  Col,
} from "antd";
import {
  ClockCircleOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { useWorklogbyUser } from "@/hooks/worklog/useWorklogbyUser";
import useIsMobile from "@/hooks/useIsMobile";

const { Text, Title } = Typography;

export const UserWorklogsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const { data: rawWorklogs, isPending: worklogsLoading } = useWorklogbyUser();

  // Normalize worklogs array
  const worklogs = useMemo(() => {
    if (!rawWorklogs || !Array.isArray(rawWorklogs)) return [];
    return rawWorklogs;
  }, [rawWorklogs]);

  // Today's worklogs
  const todayWorklogs = useMemo(() => {
    const today = moment().startOf("day");
    return worklogs.filter((log: any) => {
      const logDate = moment(log.startTime || log.date).startOf("day");
      return logDate.isSame(today, "day");
    });
  }, [worklogs]);

  // Calculate today's total hours
  const todayTotalHours = useMemo(() => {
    return todayWorklogs.reduce((acc: number, log: any) => {
      const durationMins =
        log.durationMinutes ??
        (log.startTime && log.endTime
          ? moment(log.endTime).diff(moment(log.startTime), "minutes")
          : 0);
      return acc + durationMins / 60;
    }, 0);
  }, [todayWorklogs]);

  // Weekly hours data (Monday - Sunday)
  const weeklyData = useMemo(() => {
    const startOfWeek = moment().startOf("isoWeek"); // Monday
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let weeklySum = 0;

    const data = days.map((dayName, idx) => {
      const dayMoment = startOfWeek.clone().add(idx, "days");
      const dayStr = dayMoment.format("YYYY-MM-DD");
      const isToday = dayMoment.isSame(moment(), "day");
      const isFuture = dayMoment.isAfter(moment(), "day");

      const dayHours = worklogs.reduce((acc: number, log: any) => {
        const logDate = moment(log.startTime || log.date).format("YYYY-MM-DD");
        if (logDate === dayStr) {
          const mins =
            log.durationMinutes ??
            (log.startTime && log.endTime
              ? moment(log.endTime).diff(moment(log.startTime), "minutes")
              : 0);
          return acc + mins / 60;
        }
        return acc;
      }, 0);

      weeklySum += dayHours;

      return {
        day: dayName,
        date: dayMoment.format("MMM DD"),
        hours: Number(dayHours.toFixed(1)),
        isToday,
        isFuture,
        target: 8,
      };
    });

    return { days: data, totalWeeklyHours: Number(weeklySum.toFixed(1)) };
  }, [worklogs]);

  // Status tag helper
  const getStatusTag = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Tag color="success" icon={<CheckCircleOutlined />} className="text-xs m-0">
            Approved
          </Tag>
        );
      case "rejected":
        return (
          <Tag color="error" icon={<CloseCircleOutlined />} className="text-xs m-0">
            Rejected
          </Tag>
        );
      case "requested":
      case "pending":
      default:
        return (
          <Tag color="warning" icon={<SyncOutlined spin />} className="text-xs m-0">
            Pending
          </Tag>
        );
    }
  };

  return (
    <Card
      className="border border-slate-200 shadow-2xs rounded-xl"
      title={
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
          <ClockCircleOutlined className="text-blue-600" />
          <span>Today's Worklogs & Weekly Hours</span>
        </div>
      }
      extra={
        <Link
          to="/worklogs-all"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View Full Timesheet <ArrowRightOutlined className="text-[10px]" />
        </Link>
      }
      styles={{
        header: { borderBottom: "1px solid #f1f5f9", padding: "12px 20px" },
        body: { padding: "16px 20px" },
      }}
    >
      <Row gutter={[20, 20]}>
        {/* Left Side: Weekly Hours Bar Chart (span 10 on desktop) */}
        <Col xs={24} lg={10} className="border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Weekly Effort
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {weeklyData.totalWeeklyHours} <span className="text-xs font-normal text-slate-500">/ 40h target</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">This Week</span>
            </div>
          </div>

          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData.days}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (dataMax: number) => Math.max(8, Math.ceil(dataMax))]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <ReferenceLine y={8} stroke="#f59e0b" strokeDasharray="3 3" />
                <RechartsTooltip
                  formatter={(val: any) => [`${val} hrs`, "Logged"]}
                  labelFormatter={(day: string, payload: any) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.day} (${item.date})` : day;
                  }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: "12px",
                    border: "none",
                  }}
                  itemStyle={{ color: "#93c5fd" }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {weeklyData.days.map((entry, index) => {
                    let fill = "#cbd5e1";
                    if (entry.isToday) {
                      fill = "#2563eb";
                    } else if (entry.hours >= 8) {
                      fill = "#10b981";
                    } else if (entry.hours > 0) {
                      fill = "#60a5fa";
                    }
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm inline-block" /> Today
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> ≥ 8h Met
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 border-t-2 border-dashed border-amber-500 inline-block" /> 8h Target
            </span>
          </div>
        </Col>

        {/* Right Side: Today's Logged Entries (span 14 on desktop) */}
        <Col xs={24} lg={14}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Today's Entries
              </span>
              <Tag color={todayTotalHours >= 8 ? "success" : "blue"} className="text-xs m-0">
                {todayTotalHours.toFixed(1)} hrs total
              </Tag>
            </div>

            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => navigate("/worklogs/new")}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              Add Entry
            </Button>
          </div>

          {worklogsLoading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading worklogs...</div>
          ) : todayWorklogs.length === 0 ? (
            <div className="py-6 text-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
              <ClockCircleOutlined className="text-2xl text-slate-400 mb-2" />
              <div className="text-sm font-medium text-slate-700">No worklogs logged today yet</div>
              <div className="text-xs text-slate-500 mt-0.5 mb-3">
                Remember to log your hours before the day ends.
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => navigate("/worklogs/new")}
              >
                Log Today's Worklog
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 max-h-[175px] overflow-y-auto pr-1">
              {todayWorklogs.map((log: any) => {
                const durationMins =
                  log.durationMinutes ??
                  (log.startTime && log.endTime
                    ? moment(log.endTime).diff(moment(log.startTime), "minutes")
                    : 0);
                const hours = (durationMins / 60).toFixed(1);

                return (
                  <div
                    key={log.id}
                    className="py-2 px-1 flex items-start justify-between gap-3 hover:bg-slate-50/60 rounded transition-colors text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {log.task?.name || "Task Entry"}
                        </span>
                        {log.task?.project?.name && (
                          <span className="text-slate-500 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {log.task.project.name}
                          </span>
                        )}
                        {getStatusTag(log.status)}
                      </div>

                      {log.description && (
                        <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                          {log.description.replace(/<[^>]*>?/gm, "")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-right">
                      <div>
                        <div className="font-bold text-slate-900">{hours} hrs</div>
                        <div className="text-[10px] text-slate-400">
                          {log.startTime && log.endTime
                            ? `${moment(log.startTime).format("HH:mm")} - ${moment(log.endTime).format("HH:mm")}`
                            : `${durationMins}m`}
                        </div>
                      </div>

                      <Tooltip title="Edit Worklog">
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined className="text-slate-400 hover:text-blue-600" />}
                          onClick={() => navigate(`/worklogs/edit/${log.id}`)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
};

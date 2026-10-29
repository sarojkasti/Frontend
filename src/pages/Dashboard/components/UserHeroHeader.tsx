import React, { useState, useEffect, useMemo } from "react";
import { Card, Typography, Button, Space, Tag, Avatar } from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import dayjs from "dayjs";
import { useSession } from "@/context/SessionContext";
import { useGetMyAttendence } from "@/hooks/attendence/useGetMyAttendence";
import { DualDateConverter } from "@/utils/dateConverter";
import { formatTime12Hour, parseTimeMoment } from "@/utils/formatUtils";
import useIsMobile from "@/hooks/useIsMobile";

const { Title } = Typography;

interface UserHeroHeaderProps {
  onRequestLeave: () => void;
}

export const UserHeroHeader: React.FC<UserHeroHeaderProps> = ({ onRequestLeave }) => {
  const { profile } = useSession();
  const { isMobile } = useIsMobile();
  const navigate = useNavigate();
  const { data: attendanceData } = useGetMyAttendence();

  // Current time state (updates periodically to keep greeting and active duration in sync)
  const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  // Dual Date (Gregorian + Nepali Bikram Sambat)
  const dualDate = useMemo(() => {
    try {
      const dual = DualDateConverter.createDualDate(currentTime);
      const gregorianStr = dual.gregorian.format("dddd, MMMM D, YYYY");
      const nepaliStr = dual.nepali.format("MMMM DD, YYYY", "np");
      return { gregorianStr, nepaliStr };
    } catch {
      return {
        gregorianStr: currentTime.format("dddd, MMMM D, YYYY"),
        nepaliStr: "",
      };
    }
  }, [currentTime]);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = currentTime.hour();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, [currentTime]);

  // Attendance status calculation
  const attendanceStatus = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) {
      return {
        status: "not_clocked_in",
        label: "Not Clocked In",
        color: "warning",
        description: "You haven't clocked in today yet.",
      };
    }

    const todayRecord = attendanceData[0];
    const todayStr = todayRecord.date || moment().format("YYYY-MM-DD");
    const clockInMoment = parseTimeMoment(todayRecord.clockIn, todayStr);
    const clockOutMoment = parseTimeMoment(todayRecord.clockOut, todayStr);

    if (todayRecord.clockOut && clockOutMoment && clockInMoment) {
      const durationMins = Math.max(0, clockOutMoment.diff(clockInMoment, "minutes"));
      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      const formattedClockOut = formatTime12Hour(todayRecord.clockOut);
      return {
        status: "clocked_out",
        label: "Clocked Out",
        color: "default",
        description: `Shift ended at ${formattedClockOut} (${hours}h ${mins}m)`,
      };
    }

    if (clockInMoment) {
      const activeMins = Math.max(0, moment().diff(clockInMoment, "minutes"));
      const hours = Math.floor(activeMins / 60);
      const mins = activeMins % 60;
      const formattedClockIn = formatTime12Hour(todayRecord.clockIn);
      return {
        status: "clocked_in",
        label: "Clocked In",
        color: "success",
        description: `Active since ${formattedClockIn} (${hours}h ${mins}m)`,
      };
    }

    return {
      status: "not_clocked_in",
      label: "Not Clocked In",
      color: "warning",
      description: "You haven't clocked in today yet.",
    };
  }, [attendanceData, currentTime]);

  const userName = profile?.name || "Team Member";
  const roleName = (profile?.role as any)?.name || "Employee";

  return (
    <Card
      className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50"
      styles={{ body: { padding: isMobile ? 16 : 24 } }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: User Avatar & Greeting */}
        <div className="flex items-start sm:items-center gap-4">
          <Avatar
            size={isMobile ? 52 : 64}
            src={profile?.avatar}
            icon={<UserOutlined />}
            className="border-2 border-white shadow-sm bg-blue-600 flex-shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Title level={isMobile ? 4 : 3} style={{ margin: 0, color: "#0f172a" }}>
                {greeting}, {userName}!
              </Title>
              <Tag color="blue" className="font-medium capitalize text-xs">
                {roleName}
              </Tag>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-slate-600 text-xs sm:text-sm">
              <span className="font-medium text-slate-800">{dualDate.gregorianStr}</span>
              {dualDate.nepaliStr && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">{dualDate.nepaliStr}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Attendance Indicator & Quick Action CTAs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Attendance Status Badge */}
          <div className="bg-white/90 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2.5 shadow-2xs">
            <span className="relative flex h-3 w-3">
              {attendanceStatus.status === "clocked_in" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  attendanceStatus.status === "clocked_in"
                    ? "bg-emerald-500"
                    : attendanceStatus.status === "clocked_out"
                    ? "bg-slate-400"
                    : "bg-amber-500"
                }`}
              />
            </span>
            <div className="text-xs">
              <div className="font-semibold text-slate-800">{attendanceStatus.label}</div>
              <div className="text-slate-500 text-[11px]">{attendanceStatus.description}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <Space wrap size={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/worklogs/new")}
              className="bg-blue-600 hover:bg-blue-700 shadow-2xs font-medium"
            >
              Log Worklog
            </Button>
            <Button
              icon={<CheckSquareOutlined />}
              onClick={() => navigate("/todotask")}
              className="font-medium text-slate-700 hover:text-blue-600"
            >
              Todo Tasks
            </Button>
            <Button
              icon={<CalendarOutlined />}
              onClick={onRequestLeave}
              className="font-medium text-slate-700 hover:text-blue-600"
            >
              Request Leave
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => navigate("/worklogs-all")}
              className="font-medium text-slate-700 hover:text-blue-600"
            >
              Timesheet
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

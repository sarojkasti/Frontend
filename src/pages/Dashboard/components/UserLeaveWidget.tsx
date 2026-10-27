import React, { useMemo } from "react";
import { Card, Typography, Button, Progress, Tag, Space, Empty, Spin } from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import moment from "moment";
import { useMyLeaveBalances } from "@/hooks/useLeaveTypes";
import { useMyLeaves } from "@/hooks/leave/useMyLeaves";

const { Text } = Typography;

interface UserLeaveWidgetProps {
  onRequestLeave: () => void;
}

export const UserLeaveWidget: React.FC<UserLeaveWidgetProps> = ({ onRequestLeave }) => {
  const { data: rawBalances, isLoading: balancesLoading } = useMyLeaveBalances();
  const { data: rawLeaves, isLoading: leavesLoading } = useMyLeaves();

  // Normalize balances
  const balances = useMemo(() => {
    if (!rawBalances || !Array.isArray(rawBalances)) return [];
    return rawBalances;
  }, [rawBalances]);

  // Recent leave requests (last 3)
  const recentLeaves = useMemo(() => {
    if (!rawLeaves || !Array.isArray(rawLeaves)) return [];
    return [...rawLeaves]
      .sort((a: any, b: any) => moment(b.createdAt || b.startDate).unix() - moment(a.createdAt || a.startDate).unix())
      .slice(0, 3);
  }, [rawLeaves]);

  const getStatusTag = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Tag color="success" className="text-[11px] m-0">
            Approved
          </Tag>
        );
      case "rejected":
        return (
          <Tag color="error" className="text-[11px] m-0">
            Rejected
          </Tag>
        );
      case "pending":
      default:
        return (
          <Tag color="processing" className="text-[11px] m-0">
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
          <CalendarOutlined className="text-purple-600" />
          <span>My Leave & Time Off</span>
        </div>
      }
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onRequestLeave}
          className="bg-purple-600 hover:bg-purple-700 text-xs"
        >
          Apply Leave
        </Button>
      }
      styles={{
        header: { borderBottom: "1px solid #f1f5f9", padding: "12px 20px" },
        body: { padding: "16px 20px" },
      }}
    >
      {/* Leave Balances List */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Available Balances
        </div>

        {balancesLoading ? (
          <div className="py-4 text-center text-slate-400 text-xs">
            <Spin size="small" /> Loading balances...
          </div>
        ) : balances.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">No leave policy allocated.</div>
        ) : (
          <div className="space-y-3">
            {balances.map((b: any) => {
              const name = b.leaveType?.name || "Leave";
              const total = Number(b.totalAvailableDays) || 0;
              const remaining = Number(b.remainingDays) || 0;
              const percent = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;

              return (
                <div key={b.id || name}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-slate-600">
                      <strong className="text-slate-900">{remaining}</strong> / {total} days left
                    </span>
                  </div>
                  <Progress
                    percent={percent}
                    size="small"
                    strokeColor={remaining > 2 ? "#8b5cf6" : "#f59e0b"}
                    trailColor="#f1f5f9"
                    showInfo={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Leave Requests */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recent Requests
          </span>
          <Link
            to="/leave"
            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-0.5"
          >
            History <ArrowRightOutlined className="text-[10px]" />
          </Link>
        </div>

        {leavesLoading ? (
          <div className="py-2 text-center text-slate-400 text-xs">Loading requests...</div>
        ) : recentLeaves.length === 0 ? (
          <div className="text-xs text-slate-400 py-2">No recent leave requests.</div>
        ) : (
          <div className="space-y-2">
            {recentLeaves.map((leave: any) => {
              const dateDisplay =
                leave.startDate && leave.endDate
                  ? leave.startDate === leave.endDate
                    ? moment(leave.startDate).format("MMM DD, YYYY")
                    : `${moment(leave.startDate).format("MMM DD")} - ${moment(leave.endDate).format("MMM DD")}`
                  : "Requested dates";

              return (
                <div
                  key={leave.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-800">
                      {leave.type || leave.leaveType?.name || "Leave"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{dateDisplay}</div>
                  </div>
                  <div>{getStatusTag(leave.status)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

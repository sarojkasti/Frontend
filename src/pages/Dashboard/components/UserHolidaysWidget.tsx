import React, { useMemo } from "react";
import { Card, Typography, Tag, Empty, Spin } from "antd";
import { CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import moment from "moment";
import { useHolidays } from "@/hooks/holiday/useHoliday";

const { Text } = Typography;

export const UserHolidaysWidget: React.FC = () => {
  const { data: rawHolidays, isLoading } = useHolidays();

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    if (!rawHolidays || !Array.isArray(rawHolidays)) return [];
    const today = moment().startOf("day");

    return rawHolidays
      .filter((h: any) => h.date && moment(h.date).isSameOrAfter(today, "day"))
      .sort((a: any, b: any) => moment(a.date).diff(moment(b.date)))
      .slice(0, 4);
  }, [rawHolidays]);

  // Relative countdown tag helper
  const getCountdownTag = (dateStr: string) => {
    const holidayDate = moment(dateStr).startOf("day");
    const today = moment().startOf("day");
    const diffDays = holidayDate.diff(today, "days");

    if (diffDays === 0) {
      return (
        <Tag color="gold" className="text-[11px] font-semibold m-0">
          Today! 🎉
        </Tag>
      );
    }
    if (diffDays === 1) {
      return (
        <Tag color="cyan" className="text-[11px] font-medium m-0">
          Tomorrow
        </Tag>
      );
    }
    if (diffDays <= 7) {
      return (
        <Tag color="blue" className="text-[11px] font-medium m-0">
          In {diffDays} days
        </Tag>
      );
    }
    if (diffDays <= 30) {
      return (
        <Tag color="default" className="text-[11px] text-slate-600 m-0">
          In {diffDays} days
        </Tag>
      );
    }
    const weeks = Math.round(diffDays / 7);
    return (
      <Tag color="default" className="text-[11px] text-slate-500 m-0">
        In ~{weeks} weeks
      </Tag>
    );
  };

  return (
    <Card
      className="border border-slate-200 shadow-2xs rounded-xl"
      title={
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
          <CalendarOutlined className="text-amber-500" />
          <span>Upcoming Holidays</span>
        </div>
      }
      extra={
        <Link
          to="/holiday"
          className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1"
        >
          View Calendar <ArrowRightOutlined className="text-[10px]" />
        </Link>
      }
      styles={{
        header: { borderBottom: "1px solid #f1f5f9", padding: "12px 20px" },
        body: { padding: "16px 20px" },
      }}
    >
      {isLoading ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          <Spin size="small" /> Loading holidays...
        </div>
      ) : upcomingHolidays.length === 0 ? (
        <div className="py-4 text-center text-slate-500 text-xs">
          No upcoming public holidays listed for the near future.
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcomingHolidays.map((holiday: any) => {
            const dateMoment = moment(holiday.date);

            return (
              <div
                key={holiday.id || holiday.date}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50/50 transition-colors border border-slate-100"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="font-medium text-slate-800 text-xs truncate">
                    {holiday.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span>{dateMoment.format("ddd, MMM DD, YYYY")}</span>
                    {holiday.bsDate && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>B.S. {holiday.bsDate}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">{getCountdownTag(holiday.date)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

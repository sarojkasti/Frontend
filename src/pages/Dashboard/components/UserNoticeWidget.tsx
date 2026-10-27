import React, { useState, useMemo } from "react";
import { Card, Typography, Tag, Button, Empty, Spin } from "antd";
import { NotificationOutlined, ArrowRightOutlined, FileTextOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import moment from "moment";
import { useMyNoticeBoards } from "@/hooks/notice-board/useMyNoticeBoards";
import { useMarkNoticeBoardAsRead } from "@/hooks/notice-board/useMarkNoticeBoardAsRead";
import NoticeBoardDetail from "@/components/NoticeBoard/NoticeBoardDetail";

const { Text } = Typography;

export const UserNoticeWidget: React.FC = () => {
  const { data: rawNotices, isLoading } = useMyNoticeBoards();
  const { mutateAsync: markAsRead } = useMarkNoticeBoardAsRead();

  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const notices = useMemo(() => {
    if (!rawNotices || !Array.isArray(rawNotices)) return [];
    return [...rawNotices]
      .sort((a: any, b: any) => moment(b.createdAt).unix() - moment(a.createdAt).unix())
      .slice(0, 3);
  }, [rawNotices]);

  const handleOpenNotice = async (noticeId: string) => {
    try {
      await markAsRead({ id: noticeId });
    } catch {
      // Continue opening detail even if mark-as-read fails
    }
    setSelectedNoticeId(noticeId);
    setDetailVisible(true);
  };

  return (
    <>
      <Card
        className="border border-slate-200 shadow-2xs rounded-xl"
        title={
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
            <NotificationOutlined className="text-blue-600" />
            <span>Notice Board & Announcements</span>
          </div>
        }
        extra={
          <Link
            to="/notice-board"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Notices <ArrowRightOutlined className="text-[10px]" />
          </Link>
        }
        styles={{
          header: { borderBottom: "1px solid #f1f5f9", padding: "12px 20px" },
          body: { padding: "16px 20px" },
        }}
      >
        {isLoading ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            <Spin size="small" /> Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="py-4 text-center text-slate-500 text-xs">
            No new announcements posted.
          </div>
        ) : (
          <div className="space-y-2.5">
            {notices.map((notice: any) => {
              const isUnread = !notice.isRead && !notice.readAt;

              return (
                <div
                  key={notice.id}
                  onClick={() => handleOpenNotice(String(notice.id))}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 bg-slate-50/60 hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-slate-800 text-xs line-clamp-1 flex-1">
                      {notice.title}
                    </div>
                    {isUnread && (
                      <Tag color="processing" className="text-[10px] m-0 border-0 bg-blue-100 text-blue-800 font-semibold">
                        New
                      </Tag>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{notice.author?.name || notice.user?.name || "Company"}</span>
                    <span>{moment(notice.createdAt).fromNow()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Notice Detail Modal */}
      {selectedNoticeId && (
        <NoticeBoardDetail
          visible={detailVisible}
          noticeId={selectedNoticeId}
          onClose={() => {
            setDetailVisible(false);
            setSelectedNoticeId(null);
          }}
        />
      )}
    </>
  );
};

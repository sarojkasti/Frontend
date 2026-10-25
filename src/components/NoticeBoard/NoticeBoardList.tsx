import { useMyNoticeBoards } from "@/hooks/notice-board/useMyNoticeBoards";
import { useMarkNoticeBoardAsRead } from "@/hooks/notice-board/useMarkNoticeBoardAsRead";
import { List, Card, Typography, Space, Tag, Button, Divider, message, Tooltip } from "antd";
import { EyeOutlined, FileTextOutlined, PictureOutlined } from "@ant-design/icons";
import { calculateDays } from "@/utils/calculateDays";
import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import NoticeBoardDetail from "./NoticeBoardDetail";

const { Title, Text, Paragraph } = Typography;

const NoticeBoardList = () => {
  const { data: notices, isLoading } = useMyNoticeBoards();
  const { mutateAsync: markAsRead } = useMarkNoticeBoardAsRead();
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const { id: routeNoticeId } = useParams<{ id?: string }>();
  const targetNoticeId = searchParams.get("noticeId") || routeNoticeId;

  useEffect(() => {
    if (targetNoticeId && notices && notices.length > 0) {
      const exists = notices.some((n: any) => String(n.id) === String(targetNoticeId));
      if (exists) {
        handleViewNotice(targetNoticeId);
      }
    }
  }, [targetNoticeId, notices]);

  const handleViewNotice = async (noticeId: string) => {
    try {
      await markAsRead({ id: noticeId });
      setSelectedNotice(noticeId);
      setDetailVisible(true);
    } catch (error) {
      message.error("Failed to mark notice as read");
    }
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedNotice(null);
  };

  if (isLoading) {
    return <div>Loading notices...</div>;
  }

  return (
    <>
      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 1,
          md: 2,
          lg: 3,
          xl: 3,
          xxl: 4,
        }}
        dataSource={notices || []}
        renderItem={(notice: any) => {
          // Check if current user has read this notice
          const isRead = notice.readByUsers?.some((user: any) => user.id === localStorage.getItem('userId'));
          
          return (
            <List.Item>
              <Card 
                hoverable
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>{notice.title}</span>
                    {!isRead && <Tag color="red">New</Tag>}
                  </Space>
                }
                extra={
                  <Tooltip title="View details">
                    <Button 
                      type="link" 
                      icon={<EyeOutlined />} 
                      onClick={() => handleViewNotice(notice.id)}
                    />
                  </Tooltip>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Paragraph ellipsis={{ rows: 3 }}>
                    {notice.description}
                  </Paragraph>
                  
                  {notice.imagePath && (
                    <Space>
                      <PictureOutlined />
                      <Text type="secondary">Has attachment</Text>
                    </Space>
                  )}
                  
                  <Divider style={{ margin: '8px 0' }} />
                  
                  <Space>
                    <Text type="secondary">Posted {calculateDays(notice.createdAt)}</Text>
                  </Space>
                </Space>
              </Card>
            </List.Item>
          );
        }}
      />

      {selectedNotice && (
        <NoticeBoardDetail
          visible={detailVisible}
          noticeId={selectedNotice}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );
};

export default NoticeBoardList;
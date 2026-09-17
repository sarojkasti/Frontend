import NoticeBoardList from "@/components/NoticeBoard/NoticeBoardList";
import { useSession } from "@/context/SessionContext";
import { Button, Card, Space, Typography } from "antd";
import { PlusOutlined, SettingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Title } = Typography;

const NoticeBoardPage = () => {
  const { profile, permissions } = useSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Better permission check based on the actual permission system
  const roleName = (profile?.role as any)?.name || "";
  // Check if user has permission to create notices
  const canCreateNotice =
    permissions?.includes("/notice-board") &&
    permissions?.includes("/notice-board/POST");
  // Fallback to role-based check if permissions are not fully set up
  const isAdmin =
    roleName === "superuser" ||
    roleName === "admin" ||
    roleName === "administrator" ||
    roleName?.toLowerCase().includes("admin") ||
    roleName?.toLowerCase().includes("super");
  // Show admin buttons if user has permission or is admin
  const showAdminButtons = canCreateNotice || isAdmin;

  return (
    <div className="relative min-h-[400px]">
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Card
          title={<Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>Notice Board</Title>}
          extra={
            !isMobile &&
            showAdminButtons && (
              <Space wrap className="flex flex-wrap gap-2">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/notice-board/create")}
                >
                  Create Notice
                </Button>
                <Button onClick={() => navigate("/notice-board/admin")}>
                  Manage Notices
                </Button>
              </Space>
            )
          }
        >
          <NoticeBoardList />
        </Card>
      </Space>

      {/* Floating Action Button for Mobile */}
      {isMobile && showAdminButtons && (
        <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          <button
            onClick={() => navigate("/notice-board/admin")}
            className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-lg active:scale-95 transition-all"
            aria-label="Manage Notices"
            title="Manage Notices"
          >
            <SettingOutlined />
          </button>
          <button
            onClick={() => navigate("/notice-board/create")}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl active:scale-95 transition-all hover:bg-blue-700"
            aria-label="Create Notice"
            title="Create Notice"
          >
            <PlusOutlined />
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticeBoardPage;

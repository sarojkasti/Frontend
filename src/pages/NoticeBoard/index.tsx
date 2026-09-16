import NoticeBoardList from "@/components/NoticeBoard/NoticeBoardList";
import { useSession } from "@/context/SessionContext";
import { Button, Card, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
const { Title } = Typography;
const NoticeBoardPage = () => {
  const { profile, permissions } = useSession();
  const navigate = useNavigate();
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
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Card
        title={<Title level={4}>Notice Board</Title>}
        extra={
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
  );
};
export default NoticeBoardPage;

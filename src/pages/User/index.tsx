import PageTitle from "@/components/PageTitle";
import UserForm from "@/components/user/UserForm";
import UserTable from "@/components/user/UserTable";
import { UserStatus } from "@/types/userStatus";
import { Modal, Tabs, Button, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import React, { useCallback, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

const User: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<any | undefined>(undefined);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const showModal = useCallback((task?: any) => {
    setEditUserData(task);
    setOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditUserData(undefined);
    setOpen(false);
  }, []);
  const { isMobile } = useIsMobile();

  return (
    <div className="pb-16 sm:pb-0 px-2 sm:px-0">
      {/* Mobile Live Search Bar */}
      {isMobile && mobileSearchOpen && (
        <div className="mb-3 px-2 sm:px-0">
          <div className="bg-white p-2 rounded-xl shadow-md border border-blue-200 flex items-center gap-2">
            <Input
              prefix={<SearchOutlined style={{ color: "#0c66e4", fontSize: 16 }} />}
              placeholder="Search users by name, email, phone, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              autoFocus
              className="text-sm border-0 focus:shadow-none"
              style={{ backgroundColor: "transparent" }}
            />
            <Button
              type="text"
              size="small"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
              }}
              style={{ color: "#64748b", fontWeight: 500 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Tabs
        defaultActiveKey="1"
        tabBarExtraContent={
          !isMobile ? (
            <div className="flex flex-wrap gap-2">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                Create User
              </Button>
            </div>
          ) : null
        }
        renderTabBar={
          isMobile
            ? (props, DefaultTabBar) => (
                <div className="overflow-x-auto whitespace-nowrap px-4 sm:px-0">
                  <DefaultTabBar {...props} style={{ marginBottom: 0 }} />
                </div>
              )
            : undefined
        }
        tabBarStyle={
          isMobile
            ? {
                overflowX: "auto",
                whiteSpace: "nowrap",
                marginBottom: 12,
                paddingLeft: "16px",
                paddingRight: "16px",
              }
            : undefined
        }
        items={[
          {
            label: "Active",
            key: "1",
            children: <UserTable status={UserStatus.ACTIVE} showModal={showModal} searchQuery={searchQuery} />,
          },
          {
            label: "Inactive",
            key: "2",
            children: <UserTable status={UserStatus.INACTIVE} showModal={showModal} searchQuery={searchQuery} />,
          },
          {
            label: "Blocked",
            key: "3",
            children: <UserTable status={UserStatus.BLOCKED} showModal={showModal} searchQuery={searchQuery} />,
          },
        ]}
      />

      {/* Floating Search Button for Mobile View */}
      {isMobile && (
        <div className="fixed bottom-20 right-5 z-40">
          <Button
            shape="circle"
            size="large"
            icon={<SearchOutlined style={{ fontSize: "18px" }} />}
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              width: "46px",
              height: "46px",
              backgroundColor: mobileSearchOpen ? "#0c66e4" : "#ffffff",
              color: mobileSearchOpen ? "#ffffff" : "#334155",
              borderColor: mobileSearchOpen ? "#0c66e4" : "#e2e8f0",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
            }}
          />
        </div>
      )}

      {/* Floating Create User Button for Mobile View */}
      {isMobile && (
        <div className="fixed bottom-6 right-5 z-40">
          <Button
            type="primary"
            shape="round"
            size="large"
            icon={<PlusOutlined style={{ fontSize: "16px" }} />}
            onClick={() => showModal()}
            className="shadow-2xl flex items-center gap-1.5 font-medium hover:scale-105 active:scale-95 transition-all duration-200"
            style={{
              height: "46px",
              paddingLeft: "16px",
              paddingRight: "18px",
              fontSize: "14px",
              backgroundColor: "#0c66e4",
              boxShadow: "0 6px 20px rgba(12, 102, 228, 0.4)",
            }}
          >
            Create User
          </Button>
        </div>
      )}

      {open && (
        <Modal width={isMobile ? '95vw' : 500} title={editUserData ? "Edit User" : "Add User"} footer={null} open={open} onCancel={handleCancel}>
          <UserForm initialValues={editUserData} handleCancel={handleCancel} />
        </Modal>
      )}
    </div>
  );
};

export default User;

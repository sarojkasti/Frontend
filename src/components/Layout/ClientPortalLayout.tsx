import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Typography, Space, Avatar, Drawer } from "antd";
import {
  DashboardOutlined,
  LockOutlined,
  ProjectOutlined,
  BankOutlined,
  FileOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useClientAuth } from "@/context/ClientAuthContext";
import { useIsMobile } from "@/hooks/useIsMobile";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const ClientPortalLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { clientUser, logout } = useClientAuth();
  const isDownloadLocked = !!clientUser?.isDownloadDisabled;
  const { isMobile } = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  const sidebarMenuItems: MenuProps["items"] = [
    {
      key: "/client-portal",
      icon: <DashboardOutlined />,
      label: "Dashboard"
    },
    {
      key: "/client-portal/projects",
      icon: <ProjectOutlined />,
      label: "Projects"
    },
    {
      key: "/client-portal/company",
      icon: <BankOutlined />,
      label: "Company"
    },
    {
      key: "/client-portal/reports",
      icon: <FileOutlined />,
      label: "Reports"
    }
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/client-portal" || path === "/client-portal/") return "/client-portal";
    if (path.startsWith("/client-portal/projects")) return "/client-portal/projects";
    if (path.startsWith("/client-portal/company")) return "/client-portal/company";
    if (path.startsWith("/client-portal/reports")) return "/client-portal/reports";
    return "/client-portal";
  };

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  const toggleMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const getMenuIcon = () => {
    if (isMobile) {
      return mobileMenuOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />;
    }
    return collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />;
  };

  const menuContent = (
    <Menu
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      items={sidebarMenuItems}
      onClick={handleMenuClick}
      className="h-full border-r-0 pt-2"
      style={{ borderRight: "none" }}
    />
  );

  return (
    <Layout className="min-h-screen relative">
      {/* Header */}
      <Header
        className="flex items-center justify-between px-4"
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: 64,
          padding: "0 24px"
        }}
      >
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={getMenuIcon()}
            onClick={toggleMenu}
            className="text-lg"
          />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg text-gray-800">Client Portal</span>
          </div>
        </div>

        <Space size="middle">
          <div className="flex items-center gap-2">
            <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
            <Text className="hidden sm:inline text-gray-600">
              {clientUser?.name || clientUser?.email}
            </Text>
          </div>

          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={logout}
            danger
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </Space>
      </Header>

      <div className="relative flex-1 min-h-0">
        <Layout hasSider={!isMobile}>
          {/* Sidebar / Drawer */}
          {isMobile ? (
            <Drawer
              placement="left"
              closable={false}
              onClose={() => setMobileMenuOpen(false)}
              open={mobileMenuOpen}
              width={280}
              styles={{ body: { padding: 0 } }}
            >
              {menuContent}
            </Drawer>
          ) : (
            <Sider
              trigger={null}
              collapsible
              collapsed={collapsed}
              width={240}
              theme="light"
              className="border-r border-gray-100"
              style={{
                height: "calc(100vh - 64px)",
                position: "sticky",
                top: 64,
                left: 0
              }}
            >
              {menuContent}
            </Sider>
          )}

          {/* Main Content */}
          <Content
            className="p-6 relative"
            style={{
              height: "calc(100vh - 64px)",
              overflow: "auto",
              background: "linear-gradient(#ffffff, #f5f5f5 28%)"
            }}
          >
            <Outlet />
          </Content>
        </Layout>

        {isDownloadLocked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/75 backdrop-blur-sm px-4">
            <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <LockOutlined className="text-3xl" />
              </div>
              <Typography.Title level={4} className="!mb-2">
                Downloads are disabled on this account
              </Typography.Title>
              <Typography.Paragraph className="!mb-0 text-gray-600">
                This client portal is locked for downloads. Please contact the account administrator
                if you need download access restored.
              </Typography.Paragraph>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientPortalLayout;

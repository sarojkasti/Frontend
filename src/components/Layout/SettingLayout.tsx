import { Layout } from "antd";
import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { SettingMenus } from "./SettingMenus";
import useIsMobile from "@/hooks/useIsMobile";

const { Content } = Layout;

const SettingLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isMobile } = useIsMobile();

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <Layout hasSider={!isMobile} className="h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        menuItems={SettingMenus}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Layout className="bg-[#fff] flex-1 min-h-0 overflow-hidden">
        <Navbar collapsed={collapsed} setCollapsed={handleToggleSidebar} />
        <Content
          className={isMobile ? "px-3.5 relative flex-1 min-h-0" : "px-6"}
          style={{ height: "calc(100vh - 64px)", overflow: "auto" }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default SettingLayout;

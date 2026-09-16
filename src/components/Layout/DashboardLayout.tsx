import { Layout } from "antd";
import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { MenuItems } from "./MenuItems";
import useIsMobile from "@/hooks/useIsMobile";

const { Content } = Layout;

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
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
    <Layout className="h-screen overflow-hidden">
      <Navbar
        collapsed={collapsed}
        setCollapsed={handleToggleSidebar}
      />
      <Layout
        hasSider={!isMobile}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ background: "linear-gradient(#ffffff, #f5f5f5 28%)" }}
      >
        <Sidebar
          collapsed={collapsed}
          menuItems={MenuItems()}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <Content
          className={isMobile ? "px-3.5 py-2 relative flex-1 min-h-0" : "p-2 relative flex-1 min-h-0"}
          style={{ overflowY: "auto", overflowX: "hidden" }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

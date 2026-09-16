import { Layout } from "antd";
import React, { useState } from "react";
import Navbar from "./Navbar";
import { ProjectMenuItems } from "./ProjectMenus";
import Sidebar from "./Sidebar";
import { useParams } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import useIsMobile from "@/hooks/useIsMobile";

const { Content } = Layout;

const ProjectLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { id } = useParams();
  const { isMobile } = useIsMobile();
  const { permissions } = useSession();
  const canViewProjectWorklogs = permissions?.some(
    (permission: any) => permission.path === '/projects/:id/worklogs' && permission.method?.toLowerCase() === 'get'
  );

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
        menuItems={ProjectMenuItems(id, !!canViewProjectWorklogs)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Layout className="bg-[#fff] flex-1 min-h-0 overflow-hidden">
        <Navbar collapsed={collapsed} setCollapsed={handleToggleSidebar} />
        <Content
          className={isMobile ? "px-3.5 relative flex-1 min-h-0" : "px-6 relative"}
          style={{ height: "calc(100vh - 64px)", overflow: "auto" }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProjectLayout;

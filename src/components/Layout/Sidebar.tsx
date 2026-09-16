import { useNavigate, useLocation } from "react-router-dom";
import { MenuItem } from "./MenuItems";
import Sider from "antd/es/layout/Sider";
import { Button, Drawer, Menu } from "antd";
import { MenuFoldOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import useIsMobile from "@/hooks/useIsMobile";

interface SidebarProps {
  collapsed: boolean;
  menuItems: MenuItem[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({
  collapsed,
  menuItems,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useIsMobile();

  // Auto-close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleChangePage = (e: any) => {
    const selectedKey = e.key;
    const selectedItem = menuItems.find(
      (item: MenuItem) => item.key === selectedKey
    );

    if (selectedItem) {
      navigate(selectedItem.key);
      // Auto-close on mobile after navigation to show maximum screen
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    }
  };

  // Mobile: compact Drawer overlay from left with collapse button at top-right
  if (isMobile) {
    return (
      <Drawer
        placement="left"
        closable={false}
        onClose={onMobileClose}
        open={mobileOpen}
        width={220}
        styles={{ body: { padding: 0 } }}
        className="mobile-sidebar-drawer"
      >
        <div className="py-2.5 px-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-[#0c66e4] to-[#337ab7] rounded py-1 px-1 rotate-45">
              <div className="bg-white p-1 shadow">
                <div className="h-2 w-2 rounded-full bg-[#FF5349] shadow"></div>
              </div>
            </div>
            <h5 className="font-semibold text-sm m-0 text-gray-800">Artha task</h5>
          </div>
          <Button
            type="text"
            icon={<MenuFoldOutlined className="text-gray-500 hover:text-gray-900 text-base" />}
            onClick={onMobileClose}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100"
            aria-label="Collapse sidebar"
          />
        </div>
        <Menu
          onClick={handleChangePage}
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0"
        />
      </Drawer>
    );
  }

  // Desktop: standard Ant Design Sider with collapse toggle
  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={240}
      theme="light"
      className="bg-none border-r border-gray-200"
      style={{
        overflowY: "auto",
        maxHeight: "calc(100vh - 64px)",
      }}
    >
      <Menu
        onClick={handleChangePage}
        selectedKeys={[location.pathname]}
        items={menuItems}
        className="h-full"
        mode="inline"
      />
    </Sider>
  );
};

export default Sidebar;

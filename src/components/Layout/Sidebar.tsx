import { useNavigate } from "react-router-dom";
import { MenuItem } from "./MenuItems";
import Sider from "antd/es/layout/Sider";
import { Drawer, Menu } from "antd";
import { useEffect, useState } from "react";

// const WIDTH = 992;

const Sidebar = ({
  collapsed,
  menuItems,
}: {
  collapsed: boolean;
  menuItems: MenuItem[];
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    window.onresize = () => {
      /(iPhone|iPad|iPod|iOS|Android)/i.test(navigator.userAgent)
        ? setIsMobile(true)
        : setIsMobile(false);
    };
    // const rect = document.body.getBoundingClientRect();
    // const needCollapse = rect.width < WIDTH;
  }, []);

  const handleChangePage = (e: any) => {
    const selectedKey = e.key;
    const selectedItem = menuItems.find(
      (item: MenuItem) => item.key === selectedKey
    );

    if (selectedItem) {
      navigate(selectedItem.key);
    }
  };

  return (
    <>
      {!isMobile ? (
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
            defaultSelectedKeys={["1"]}
            items={menuItems}
            className="h-full"
            mode="inline"
          />
        </Sider>
      ) : (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setIsMobile(false)}
          open={isMobile}
        >
          <Menu
            onClick={handleChangePage}
            theme="light"
            mode="inline"
            defaultSelectedKeys={["1"]}
            items={menuItems}
          />
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;

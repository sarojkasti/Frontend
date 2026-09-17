import { useSession } from "@/context/SessionContext";
import { useLogout } from "@/hooks/auth/useLogout";
import { useMyNotifications } from "@/hooks/notification/useMyNotifications";
import useIsMobile from "@/hooks/useIsMobile";
import { BellOutlined, CloseOutlined, FileDoneOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined } from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
} from "antd";
import { Header } from "antd/es/layout/layout";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notification from "../Notification/Notification";
import SearchBarWithPopover from "../SearchBarPopover";
import Clock from "../Clock/Clock";

const Navbar = ({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) => {
  const { profile } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { isMobile } = useIsMobile();

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  // Get userId from profile for notifications
  const userId = profile?.id ? String(profile.id) : '';
  const { data: notification } = useMyNotifications(userId);
  const { mutate: logout } = useLogout();
  // const location = useGeoLocation()

  return (
    <Header className="border-b-[1px] bg-[#fff] p-0 flex items-center justify-between">
      <div className="flex items-center">
        {/* Site logo only shown on desktop when expanded */}
        {!collapsed && !isMobile && (
          <div className="h-[32px] ml-5 mr-3 rounded">
            <div className="relative z-20 flex items-center text-lg font-medium">
              <div className="bg-gradient-to-br from-[#0c66e4] to-[#337ab7] rounded py-1 px-1 mr-3 rotate-45">
                <div className="bg-white p-1 shadow">
                  <div className="h-2 w-2 rounded-full bg-[#FF5349] shadow"></div>
                </div>
              </div>
              <h5>Artha task</h5>
            </div>
          </div>
        )}
        <Button
          type="text"
          icon={isMobile ? <MenuUnfoldOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: "18px",
            width: 44,
            height: 44,
            marginLeft: isMobile ? 8 : (collapsed ? 8 : 0),
          }}
        />
        {/* Hide search bar on mobile */}
        <div className="hidden md:block ml-2">
          <SearchBarWithPopover />
        </div>
      </div>

      {/* Clock in / Clock out and time display - shown on mobile and desktop */}
      <div className="flex items-center mx-1 sm:mx-4">
        <Clock />
      </div>

      {/* Right side icons */}
      <div className="pr-3 sm:pr-4 flex gap-4 sm:gap-4 items-center">
        {/* Worklog shortcut icon for desktop only */}
        <FileDoneOutlined
          style={{ fontSize: "20px" }}
          className="cursor-pointer hidden sm:inline-flex"
          onClick={() => {
            navigate("/worklogs/new");
          }}
        />
        {/* Notification icon */}
        <div className="flex items-center justify-center mr-1 sm:mr-0">
          <Badge
            count={(() => {
              const unread = Array.isArray(notification)
                ? notification.filter((n: any) => !n.isRead)
                : [];
              return unread.length > 9 ? "9+" : unread.length;
            })()}
            onClick={showDrawer}
            className="cursor-pointer"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">
              <BellOutlined style={{ fontSize: "20px" }} />
            </span>
          </Badge>
        </div>
        {/* Setting icon - visible on mobile and desktop */}
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-600 hover:text-blue-600"
          onClick={() => {
            navigate("/settings");
          }}
          aria-label="Settings"
        >
          <SettingOutlined style={{ fontSize: "20px" }} />
        </span>

        <Drawer
          placement="right"
          closable={false}
          onClose={onClose}
          open={open}
          width={isMobile ? "100%" : 360}
          className="notification-drawer"
          title={
            <div className="flex items-center justify-between w-full">
              <span className="text-base font-semibold text-gray-800">Notifications</span>
              <Button
                type="text"
                icon={<CloseOutlined className="text-base text-gray-600 hover:text-gray-900" />}
                onClick={onClose}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
                aria-label="Close notifications"
              />
            </div>
          }
        >
          <Notification />
        </Drawer>
        <Dropdown
          placement="bottomLeft"
          menu={{
            items: [
              {
                label: <div className="py-2 border-b">{profile?.email ?? "No email"}</div>,
                key: "name",
              },
              {
                label: <Link to={`/profile/${profile?.id}`}>Profile</Link>,
                key: "profile",
              },
              {
                label: <Link to="/reset-password">Reset Password</Link>,
                key: "reset-password",
              },
              {
                label: (
                  <span
                    onClick={() => {
                      logout();
                    }}
                  >
                    Logout
                  </span>
                ),
                key: "logout",
                onClick: () => {
                  logout();
                },
              },
            ],
          }}
        >
          <div className="flex items-center justify-center cursor-pointer">
            <Avatar
              // loading={isProfilePending}
              src={profile?.avatar ? `${import.meta.env.VITE_BACKEND_URI}/document/${profile.avatar}` : undefined}
              style={{ backgroundColor: "#0c66e4" }}
            >
              {profile?.name ? profile.name[0] : "U"}
            </Avatar>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default React.memo(Navbar);

import React, { useState } from "react";
import { Popover, Tag, Avatar, Space, Divider, Segmented } from "antd";
import {
  ProjectOutlined,
  BankOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  UserSwitchOutlined,
  ProfileOutlined,
  NotificationOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export interface RecentItem {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
  clientName?: string;
  email?: string;
  documentType?: string;
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
}

interface NavQuickPeekPopoverProps {
  type: "project" | "client" | "users" | "client_report" | "client_user" | "tasks" | "notices" | "phonebook";
  totalCount?: number;
  recentCount?: number;
  weeklyCount?: number;
  recentItems: RecentItem[];
  recentUpdatedItems?: RecentItem[];
  children: React.ReactNode;
}

export const NavQuickPeekPopover: React.FC<NavQuickPeekPopoverProps> = ({
  type,
  totalCount = 0,
  recentCount = 0,
  weeklyCount = 0,
  recentItems = [],
  recentUpdatedItems = [],
  children,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<"created" | "updated">("created");

  const titleConfig = {
    project: {
      title: "Projects",
      icon: <ProjectOutlined style={{ color: "#1677ff" }} />,
      reportTab: "projects",
      emptyText: "No projects added in the last month",
      badgeColor: "blue",
    },
    client: {
      title: "Clients",
      icon: <BankOutlined style={{ color: "#52c41a" }} />,
      reportTab: "clients",
      emptyText: "No clients added in the last month",
      badgeColor: "green",
    },
    users: {
      title: "Team Members",
      icon: <TeamOutlined style={{ color: "#722ed1" }} />,
      reportTab: "users",
      emptyText: "No team members added in the last month",
      badgeColor: "purple",
    },
    client_report: {
      title: "Client Reports",
      icon: <FileTextOutlined style={{ color: "#0891b2" }} />,
      reportTab: "client_reports",
      emptyText: "No client reports uploaded in the last month",
      badgeColor: "cyan",
    },
    client_user: {
      title: "Client Users",
      icon: <UserSwitchOutlined style={{ color: "#c026d3" }} />,
      reportTab: "client_users",
      emptyText: "No client users added in the last month",
      badgeColor: "magenta",
    },
    tasks: {
      title: "Tasks",
      icon: <ProfileOutlined style={{ color: "#2563eb" }} />,
      reportTab: "projects",
      emptyText: "No task changes in the last month",
      badgeColor: "blue",
    },
    notices: {
      title: "Notice Board",
      icon: <NotificationOutlined style={{ color: "#d97706" }} />,
      reportTab: "all",
      emptyText: "No notices added in the last month",
      badgeColor: "orange",
    },
    phonebook: {
      title: "Phonebook",
      icon: <PhoneOutlined style={{ color: "#059669" }} />,
      reportTab: "all",
      emptyText: "No phonebook changes in the last month",
      badgeColor: "green",
    },
  }[type];

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const d = dayjs(dateStr);
    if (!d.isValid()) return "";
    const now = dayjs();
    const diffHours = now.diff(d, "hour");
    const diffDays = now.diff(d, "day");
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.format("MMM D");
  };

  const handleViewReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(false);
    navigate(`/reports/recent-changes?tab=${titleConfig.reportTab}&action=${mode}`);
  };

  const activeItems = mode === "created" ? recentItems : recentUpdatedItems;

  const popoverContent = (
    <div style={{ width: 330, padding: "2px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Space size={6}>
            {titleConfig.icon}
            <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{titleConfig.title}</span>
          </Space>
          <Tag color={titleConfig.badgeColor} style={{ margin: 0, fontWeight: 600, borderRadius: 10, fontSize: 11 }}>
            {totalCount} Total
          </Tag>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <Segmented
            size="small"
            value={mode}
            onChange={(val) => setMode(val as "created" | "updated")}
            options={[
              { label: `Created (${recentItems.length})`, value: "created" },
              { label: `Updated (${recentUpdatedItems.length})`, value: "updated" },
            ]}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {weeklyCount > 0 && (
              <Tag color="blue" style={{ margin: 0, fontWeight: 600, borderRadius: 10, fontSize: 10 }}>
                +{weeklyCount} week
              </Tag>
            )}
            {recentCount > 0 && (
              <Tag color="cyan" style={{ margin: 0, fontWeight: 500, borderRadius: 10, fontSize: 10 }}>
                +{recentCount} month
              </Tag>
            )}
          </div>
        </div>
      </div>

      <Divider style={{ margin: "6px 0" }} />

      {/* Recent Activity List */}
      <div style={{ maxHeight: 240, overflowY: "auto" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
          {mode === "created" ? "Recent Additions (Last 30 Days)" : "Recent Updates (Last 30 Days)"}
        </div>

        {activeItems.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: "10px 0", textAlign: "center" }}>
            {mode === "created" ? titleConfig.emptyText : `No ${titleConfig.title.toLowerCase()} updated in the last month`}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activeItems.map((item) => {
              const detailUrl =
                type === "project"
                  ? `/projects/${item.id}`
                  : type === "client"
                  ? `/client/view/${item.id}`
                  : type === "users"
                  ? `/user/${item.id}`
                  : type === "client_report"
                  ? `/client-reports`
                  : type === "client_user"
                  ? `/client-users`
                  : type === "tasks"
                  ? `/tasks`
                  : type === "notices"
                  ? `/notice-board`
                  : `/phonebook`;

              const timeAgo = formatTimeAgo(item.createdAt);

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    navigate(detailUrl);
                  }}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    backgroundColor: "#f8fafc",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: "1px solid #f1f5f9",
                  }}
                  className="hover:bg-blue-50 hover:border-blue-200"
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    {timeAgo && (
                      <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>
                        {timeAgo}
                      </span>
                    )}
                  </div>

                  {item.clientName && (
                    <div style={{ fontSize: 10.5, color: "#0284c7", fontWeight: 500, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {type === "client_report" ? `Report for: ${item.clientName}` : `Client: ${item.clientName}`}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <Avatar
                      size={16}
                      className="bg-slate-400 shrink-0"
                      src={
                        item.creator?.avatar
                          ? `${import.meta.env.VITE_BACKEND_URI}/document/${item.creator?.avatar}`
                          : undefined
                      }
                    >
                      {item.creator?.name?.[0] || "U"}
                    </Avatar>
                    <span style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      by {item.creator?.name || "System"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Divider style={{ margin: "8px 0" }} />

      {/* Footer: View Report */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleViewReport}
          style={{
            background: "none",
            border: "none",
            padding: "4px 6px",
            fontSize: 12,
            fontWeight: 600,
            color: "#1677ff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            borderRadius: 4,
          }}
          className="hover:bg-blue-50 hover:text-blue-700"
        >
          View Report <ArrowRightOutlined style={{ fontSize: 10 }} />
        </button>
      </div>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={popoverContent}
      placement="rightTop"
      trigger="hover"
      mouseEnterDelay={0.15}
      overlayStyle={{ zIndex: 1050 }}
    >
      <div style={{ width: "100%" }}>{children}</div>
    </Popover>
  );
};

export default NavQuickPeekPopover;

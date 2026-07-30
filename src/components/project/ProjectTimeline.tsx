import { useEffect, useState, useMemo } from "react";
import { Card, Timeline, Avatar, Spin, Typography, Input, Select, Radio, Space, Tag, Empty } from "antd";
import { 
  RocketOutlined, 
  PlusCircleOutlined, 
  SyncOutlined, 
  ClockCircleOutlined, 
  DollarOutlined, 
  UserOutlined, 
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { getProjectTimeline } from "@/service/project.service";

const { Text } = Typography;

interface TimelineEntry {
  id: number | string;
  action: string;
  user?: {
    id: number | string;
    name: string;
    avatar?: string | null;
  };
  details: string;
  createdAt: string;
}

interface ProjectTimelineProps {
  projectId: string | number;
}

const actionLabels: Record<string, string> = {
  project_created: "Project Created",
  task_added: "Task Added",
  task_created: "Task Created",
  task_assigned: "Task Assigned",
  task_unassigned: "Task Unassigned",
  task_status_changed: "Task Status Changed",
  worklog_added: "Worklog Added",
  dsa_requested: "DSA Requested",
  dsa_approved: "DSA Approved",
  dsa_rejected: "DSA Rejected",
  dsa_settled: "DSA Settled",
  dsa_verified: "DSA Verified",
};

const formatActionTitle = (action: string): string => {
  if (actionLabels[action]) return actionLabels[action];
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const cleanDetailsText = (details: string): string => {
  if (!details) return "";
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  if (details.includes("Project created with users:")) {
    const uuids = details.match(uuidPattern);
    const count = uuids ? uuids.length : 0;
    return `Project initialized with ${count} assigned team members.`;
  }
  return details.replace(uuidPattern, "team member");
};

const getEventColorAndIcon = (action: string) => {
  const act = action.toLowerCase();
  if (act.includes("project_created")) {
    return { color: "blue", icon: <RocketOutlined style={{ fontSize: 16 }} /> };
  }
  if (act.includes("task_added") || act.includes("task_created")) {
    return { color: "green", icon: <PlusCircleOutlined style={{ fontSize: 16 }} /> };
  }
  if (act.includes("task_status_changed") || act.includes("status")) {
    return { color: "orange", icon: <SyncOutlined style={{ fontSize: 16 }} /> };
  }
  if (act.includes("worklog")) {
    return { color: "cyan", icon: <ClockCircleOutlined style={{ fontSize: 16 }} /> };
  }
  if (act.includes("dsa")) {
    return { color: "purple", icon: <DollarOutlined style={{ fontSize: 16 }} /> };
  }
  if (act.includes("approved") || act.includes("verified")) {
    return { color: "green", icon: <CheckCircleOutlined style={{ fontSize: 16 }} /> };
  }
  return { color: "blue", icon: <UserOutlined style={{ fontSize: 16 }} /> };
};

const ProjectTimeline = ({ projectId }: ProjectTimelineProps) => {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getProjectTimeline(projectId)
      .then((data) => {
        if (Array.isArray(data)) {
          setTimeline(data);
        } else {
          setTimeline([]);
        }
      })
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  const filteredTimeline = useMemo(() => {
    let list = [...timeline];

    if (categoryFilter !== "all") {
      list = list.filter((item) => {
        const act = item.action.toLowerCase();
        if (categoryFilter === "tasks") return act.includes("task");
        if (categoryFilter === "worklogs") return act.includes("worklog");
        if (categoryFilter === "project") return act.includes("project");
        if (categoryFilter === "dsa") return act.includes("dsa");
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          formatActionTitle(item.action).toLowerCase().includes(q) ||
          item.details?.toLowerCase().includes(q) ||
          item.user?.name?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [timeline, categoryFilter, searchQuery, sortOrder]);

  return (
    <Card 
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "4px 0" }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Project Timeline & Activity Audit</span>
          <Space wrap size="middle">
            <Input
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Search activity or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Select
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              style={{ width: 160 }}
              options={[
                { value: "all", label: "All Activities" },
                { value: "tasks", label: "Task Activities" },
                { value: "worklogs", label: "Worklog Entries" },
                { value: "project", label: "Project Events" },
                { value: "dsa", label: "DSA Requests" },
              ]}
            />
            <Radio.Group 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="desc"><SortDescendingOutlined /> Newest</Radio.Button>
              <Radio.Button value="asc"><SortAscendingOutlined /> Oldest</Radio.Button>
            </Radio.Group>
          </Space>
        </div>
      }
    >
      {/* Timeline Display */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      ) : filteredTimeline.length === 0 ? (
        <Empty description="No timeline activities found matching criteria" style={{ margin: "40px 0" }} />
      ) : (
        <div style={{ padding: "16px 10px 0 10px" }}>
          <Timeline
            mode="left"
            items={filteredTimeline.map((item) => {
              const { color, icon } = getEventColorAndIcon(item.action);
              const formattedTitle = formatActionTitle(item.action);
              const cleanedDetails = cleanDetailsText(item.details);
              const eventDate = new Date(item.createdAt);

              return {
                color: color,
                dot: icon,
                children: (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <Space>
                        <Tag color={color} style={{ fontWeight: 600 }}>
                          {formattedTitle}
                        </Tag>
                        {item.user && (
                          <Space size={4}>
                            <Avatar src={item.user.avatar || undefined} size={20} icon={<UserOutlined />}>
                              {item.user.name?.[0]}
                            </Avatar>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                              by {item.user.name}
                            </Text>
                          </Space>
                        )}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {eventDate.toLocaleString()}
                      </Text>
                    </div>

                    <div style={{ marginTop: 6, padding: "8px 12px", backgroundColor: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
                      <Text style={{ fontSize: 14 }}>{cleanedDetails}</Text>
                    </div>
                  </div>
                ),
              };
            })}
          />
        </div>
      )}
    </Card>
  );
};

export default ProjectTimeline;

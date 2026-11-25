import React, { useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  message,
} from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RocketOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClientTimelineEvent,
  deleteClientTimelineEvent,
  fetchClientTimeline,
} from "@/service/client.service";
import dayjs from "dayjs";

const { Text } = Typography;

interface ClientTimelineTabProps {
  clientId: string;
  clientName?: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: "company_registered", label: "Company Registration / Incorporation" },
  { value: "board_change", label: "Board Member Change" },
  { value: "company_update", label: "Company Record Update" },
  { value: "contact_change", label: "Contact Person Change" },
  { value: "milestone", label: "Statutory / Business Milestone" },
];

const getEventMeta = (eventType: string) => {
  const t = (eventType || "").toLowerCase();
  if (t.includes("client_created") || t.includes("registered")) {
    return { color: "blue", label: t.includes("registered") ? "Registered" : "Created", icon: <RocketOutlined /> };
  }
  if (t.includes("board")) {
    return { color: "purple", label: "Board Change", icon: <TeamOutlined /> };
  }
  if (t.includes("company_update")) {
    return { color: "orange", label: "Record Update", icon: <EditOutlined /> };
  }
  if (t.includes("contact")) {
    return { color: "cyan", label: "Contact Change", icon: <UserOutlined /> };
  }
  return { color: "green", label: "Milestone", icon: <BankOutlined /> };
};

const ClientTimelineTab: React.FC<ClientTimelineTabProps> = ({
  clientId,
  clientName,
}) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ["client-timeline", clientId],
    queryFn: () => fetchClientTimeline(clientId),
    enabled: !!clientId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => createClientTimelineEvent(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-timeline", clientId] });
      message.success("Timeline record added");
      setModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error("Failed to add timeline record");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) =>
      deleteClientTimelineEvent(clientId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-timeline", clientId] });
      message.success("Timeline record removed");
    },
    onError: () => {
      message.error("Failed to delete record");
    },
  });

  const filteredTimeline = useMemo(() => {
    let list = Array.isArray(timeline) ? [...timeline] : [];

    if (typeFilter !== "all") {
      list = list.filter((item: any) =>
        (item.eventType || "").toLowerCase().includes(typeFilter)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item: any) =>
          item.title?.toLowerCase().includes(q) ||
          item.details?.toLowerCase().includes(q) ||
          item.user?.name?.toLowerCase().includes(q)
      );
    }

    list.sort((a: any, b: any) => {
      const timeA = new Date(a.eventDate || a.createdAt).getTime();
      const timeB = new Date(b.eventDate || b.createdAt).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [timeline, typeFilter, searchQuery, sortOrder]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      createMutation.mutate({
        eventType: values.eventType,
        title: values.title,
        details: values.details,
        eventDate: values.eventDate
          ? values.eventDate.toISOString()
          : new Date().toISOString(),
        isManual: true,
      });
    } catch {
      // Inline form errors shown
    }
  };

  return (
    <Card
      size="small"
      className="border-slate-200"
      title={
        <div className="flex flex-wrap items-center justify-between gap-2 py-1">
          <span className="text-sm font-semibold text-gray-800">
            Company & Board Timeline
          </span>
          <Space wrap size="small">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 180 }}
              size="small"
              allowClear
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              size="small"
              style={{ width: 150 }}
              options={[
                { value: "all", label: "All Events" },
                { value: "board", label: "Board Changes" },
                { value: "company", label: "Company Updates" },
                { value: "registered", label: "Registrations" },
                { value: "milestone", label: "Milestones" },
              ]}
            />
            <Radio.Group
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="desc">
                <SortDescendingOutlined /> Newest
              </Radio.Button>
              <Radio.Button value="asc">
                <SortAscendingOutlined /> Oldest
              </Radio.Button>
            </Radio.Group>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                form.setFieldsValue({
                  eventType: "milestone",
                  eventDate: dayjs(),
                });
                setModalOpen(true);
              }}
            >
              Add Past / New Record
            </Button>
          </Space>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-10 text-center">
          <Spin />
        </div>
      ) : filteredTimeline.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No timeline events recorded yet"
        >
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({
                eventType: "milestone",
                eventDate: dayjs(),
              });
              setModalOpen(true);
            }}
          >
            Add Historical Record
          </Button>
        </Empty>
      ) : (
        <div className="pt-3 px-2">
          <Timeline
            mode="left"
            items={filteredTimeline.map((item: any) => {
              const meta = getEventMeta(item.eventType);
              const eventDate = dayjs(item.eventDate || item.createdAt);

              return {
                color: meta.color,
                dot: meta.icon,
                children: (
                  <div className="mb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Space size={6} wrap>
                        <Tag color={meta.color} className="m-0 font-medium">
                          {meta.label}
                        </Tag>
                        <span className="font-semibold text-gray-800 text-sm">
                          {item.title}
                        </span>
                        {item.user && (
                          <Space size={4}>
                            <Avatar
                              src={item.user.avatar || undefined}
                              size={18}
                              icon={<UserOutlined />}
                            >
                              {item.user.name?.[0]}
                            </Avatar>
                            <Text type="secondary" className="text-xs">
                              {item.user.name}
                            </Text>
                          </Space>
                        )}
                      </Space>
                      <Space size={8}>
                        <Text type="secondary" className="text-xs flex items-center gap-1">
                          <CalendarOutlined />
                          {eventDate.format("MMM DD, YYYY")}
                        </Text>
                        {item.isManual && (
                          <Popconfirm
                            title="Delete this timeline entry?"
                            onConfirm={() => deleteMutation.mutate(item.id)}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              className="p-0 h-5 w-5"
                            />
                          </Popconfirm>
                        )}
                      </Space>
                    </div>

                    {item.details && (
                      <div className="mt-1.5 px-3 py-2 bg-gray-50 rounded border border-gray-100 text-xs text-gray-700">
                        {item.details}
                      </div>
                    )}
                  </div>
                ),
              };
            })}
          />
        </div>
      )}

      {/* Modal to record historical / past or current event */}
      <Modal
        open={modalOpen}
        title={`Add Timeline Record — ${clientName || "Client"}`}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending}
        okText="Save Record"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="pt-2">
          <Form.Item
            name="eventType"
            label="Record Category"
            rules={[{ required: true, message: "Please select category" }]}
          >
            <Select options={EVENT_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="eventDate"
            label="Record Date (Supports Past Dates)"
            rules={[{ required: true, message: "Please select date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="title"
            label="Event Title"
            rules={[
              { required: true, message: "Please enter title" },
              { max: 180, message: "Max 180 characters" },
            ]}
          >
            <Input placeholder="e.g. Board Reconstitution / Capital Increased" />
          </Form.Item>

          <Form.Item name="details" label="Details">
            <Input.TextArea
              rows={3}
              placeholder="Describe the historical or current change (e.g. Appointed new director, relocated registered office)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ClientTimelineTab;

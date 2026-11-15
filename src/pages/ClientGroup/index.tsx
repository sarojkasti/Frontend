import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  Modal,
  Popconfirm,
  Tooltip,
  Input,
  Select,
  Empty,
  Spin
} from "antd";
import {
  PlusOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ProjectOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  UserOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  LinkOutlined
} from "@ant-design/icons";
import {
  useClientGroups,
  useClientGroupById,
  useGroupLedger,
  useDeleteClientGroup,
  useAssignClientsToGroup
} from "@/hooks/clientGroup/useClientGroups";
import { useClient } from "@/hooks/client/useClient";
import CreateClientGroupModal from "@/components/Client/CreateClientGroupModal";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const ClientGroupPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedClientIdsToAssign, setSelectedClientIdsToAssign] = useState<string[]>([]);

  // Queries
  const { data: groups = [], isLoading: loadingGroups } = useClientGroups();
  const { data: groupDetail, isLoading: loadingDetail } = useClientGroupById(id);
  const { data: ledgerData, isLoading: loadingLedger } = useGroupLedger(id);
  const { data: allClients = [] } = useClient("all");

  // Mutations
  const { mutate: deleteGroup, isPending: deletingGroup } = useDeleteClientGroup();
  const { mutate: assignClients, isPending: assigningClients } = useAssignClientsToGroup();

  // --- DETAIL / GROUP LEDGER VIEW ---
  if (id) {
    if (loadingDetail || loadingLedger) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spin size="large" />
        </div>
      );
    }

    if (!groupDetail) {
      return (
        <Card className="text-center py-12 my-6">
          <Title level={4} type="secondary">Client Group Not Found</Title>
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate("/client-groups")}>
            Back to Groups List
          </Button>
        </Card>
      );
    }

    const unassignedClients = (allClients || []).filter(
      (c: any) => c.clientGroupId !== id && c.clientGroup?.id !== id
    ).map((c: any) => ({
      label: `${c.name} (PAN: ${c.panNo || "N/A"})`,
      value: c.id
    }));

    return (
      <div className="p-4 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/client-groups")}
              className="flex items-center justify-center font-medium"
            >
              All Groups
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">
                  🏢 {groupDetail.name}
                </h1>
                {groupDetail.code && (
                  <Tag color="geekblue" className="font-mono text-xs">
                    {groupDetail.code}
                  </Tag>
                )}
                <Tag color="success">Active Group</Tag>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Central Corporate Group Profile & Group-Wise Consolidated Ledger
              </p>
            </div>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAssignModalOpen(true)}
              className="font-medium bg-blue-600"
            >
              Assign Client to Group
            </Button>
          </Space>
        </div>

        {/* Group KPI Summary Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-xs border-slate-200">
              <Statistic
                title={<span className="text-xs text-slate-500 uppercase font-semibold">Member Entities</span>}
                value={ledgerData?.summary?.totalEntities || groupDetail.customers?.length || 0}
                prefix={<TeamOutlined className="text-blue-600 mr-1" />}
                valueStyle={{ fontWeight: 700, color: "#1e293b" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-xs border-slate-200">
              <Statistic
                title={<span className="text-xs text-slate-500 uppercase font-semibold">Total Group Projects</span>}
                value={ledgerData?.summary?.totalProjects || 0}
                prefix={<ProjectOutlined className="text-indigo-600 mr-1" />}
                valueStyle={{ fontWeight: 700, color: "#1e293b" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-xs border-slate-200">
              <Statistic
                title={<span className="text-xs text-slate-500 uppercase font-semibold">Active Projects</span>}
                value={ledgerData?.summary?.activeProjects || 0}
                prefix={<SafetyCertificateOutlined className="text-emerald-600 mr-1" />}
                valueStyle={{ fontWeight: 700, color: "#059669" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-xs border-slate-200">
              <div className="flex flex-col justify-center h-full">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Partner in Charge</div>
                <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                  <UserOutlined className="text-purple-600" />
                  {groupDetail.partnerInCharge?.name || "Unassigned"}
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Tabs Container */}
        <Card className="shadow-xs border-slate-200">
          <Tabs
            defaultActiveKey="ledger"
            items={[
              {
                key: "ledger",
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileTextOutlined /> Group-Wise Consolidated Ledger
                  </span>
                ),
                children: (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Member Entity Breakdown & Project Statistics
                      </div>
                      <Tag color="blue">{ledgerData?.entityBreakdown?.length || 0} Sister Companies / JVs</Tag>
                    </div>

                    <Table
                      dataSource={ledgerData?.entityBreakdown || []}
                      rowKey="id"
                      pagination={false}
                      bordered
                      size="middle"
                      columns={[
                        {
                          title: "Sister Company / JV Name",
                          dataIndex: "name",
                          key: "name",
                          render: (text, record: any) => (
                            <div>
                              <div
                                className="font-semibold text-blue-600 cursor-pointer hover:underline"
                                onClick={() => navigate(`/client/view/${record.id}`)}
                              >
                                {text}
                              </div>
                              {record.shortName && (
                                <Tag color="blue" className="text-[10px] font-mono mt-0.5">
                                  {record.shortName}
                                </Tag>
                              )}
                            </div>
                          )
                        },
                        {
                          title: "PAN Number",
                          dataIndex: "panNo",
                          key: "panNo",
                          width: 140,
                          render: (pan) => <span className="font-mono font-medium text-slate-700">{pan || "-"}</span>
                        },
                        {
                          title: "Active Projects",
                          dataIndex: "activeProjects",
                          key: "activeProjects",
                          width: 130,
                          align: "center",
                          render: (val) => (
                            <Tag color={val > 0 ? "success" : "default"} className="font-bold">
                              {val} Active
                            </Tag>
                          )
                        },
                        {
                          title: "Total Projects",
                          dataIndex: "totalProjects",
                          key: "totalProjects",
                          width: 120,
                          align: "center",
                          render: (val) => <span className="font-bold text-slate-700">{val}</span>
                        },
                        {
                          title: "Status",
                          dataIndex: "status",
                          key: "status",
                          width: 110,
                          render: (st) => (
                            <Tag color={st === "active" ? "success" : "warning"} className="capitalize">
                              {st}
                            </Tag>
                          )
                        },
                        {
                          title: "Action",
                          key: "action",
                          width: 100,
                          align: "center",
                          render: (_, record: any) => (
                            <Tooltip title="View Entity Profile">
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/client/view/${record.id}`)}
                              />
                            </Tooltip>
                          )
                        }
                      ]}
                    />
                  </div>
                )
              },
              {
                key: "projects",
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <ProjectOutlined /> All Group Projects ({ledgerData?.projects?.length || 0})
                  </span>
                ),
                children: (
                  <div className="pt-2">
                    <Table
                      dataSource={ledgerData?.projects || []}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      bordered
                      size="middle"
                      columns={[
                        {
                          title: "Project Name",
                          dataIndex: "name",
                          key: "name",
                          render: (text, record: any) => (
                            <div
                              className="font-semibold text-blue-600 cursor-pointer hover:underline"
                              onClick={() => navigate(`/projects/${record.id}`)}
                            >
                              {text}
                            </div>
                          )
                        },
                        {
                          title: "Belongs To Entity",
                          dataIndex: ["customer", "name"],
                          key: "customerName",
                          render: (text, record: any) => (
                            <span className="font-medium text-slate-700">
                              {text}
                              {record.customer?.shortName && ` (${record.customer.shortName})`}
                            </span>
                          )
                        },
                        {
                          title: "Working Year",
                          dataIndex: "workingYear",
                          key: "workingYear",
                          width: 120,
                          render: (wy, record: any) => wy || `FY ${record.fiscalYear || "-"}`
                        },
                        {
                          title: "Project Lead / Manager",
                          key: "lead",
                          render: (_, record: any) => record.projectLead?.name || record.projectManager?.name || "-"
                        },
                        {
                          title: "Status",
                          dataIndex: "status",
                          key: "status",
                          width: 120,
                          render: (st) => (
                            <Tag color={st === "active" ? "blue" : st === "completed" ? "green" : "default"} className="capitalize">
                              {st}
                            </Tag>
                          )
                        },
                        {
                          title: "Action",
                          key: "action",
                          width: 90,
                          align: "center",
                          render: (_, record: any) => (
                            <Tooltip title="View Project Details">
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => navigate(`/projects/${record.id}`)}
                              />
                            </Tooltip>
                          )
                        }
                      ]}
                    />
                  </div>
                )
              },
              {
                key: "contacts",
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <PhoneOutlined /> Central Group Contacts ({groupDetail.contacts?.length || 0})
                  </span>
                ),
                children: (
                  <div className="pt-2 space-y-3">
                    <div className="text-xs text-slate-500 font-normal">
                      These central contacts belong to the corporate office and are automatically inherited by all member sister companies and joint ventures.
                    </div>

                    <Table
                      dataSource={groupDetail.contacts || []}
                      rowKey="id"
                      pagination={false}
                      bordered
                      size="middle"
                      columns={[
                        {
                          title: "Name",
                          dataIndex: "name",
                          key: "name",
                          render: (name, record: any) => (
                            <span className="font-bold text-slate-800">
                              {name} {record.isPrimary && <Tag color="gold">Primary</Tag>}
                            </span>
                          )
                        },
                        {
                          title: "Designation",
                          dataIndex: "designation",
                          key: "designation",
                          render: (des) => <span className="font-medium text-slate-700">{des}</span>
                        },
                        {
                          title: "Department",
                          dataIndex: "department",
                          key: "department",
                          render: (dep) => dep || "-"
                        },
                        {
                          title: "Mobile / Phone",
                          key: "phone",
                          render: (_, record: any) => (
                            <span className="font-mono text-xs">{record.mobileNo || record.telephoneNo || "-"}</span>
                          )
                        },
                        {
                          title: "Email",
                          dataIndex: "email",
                          key: "email",
                          render: (email) =>
                            email ? (
                              <a href={`mailto:${email}`} className="text-blue-600 text-xs">
                                {email}
                              </a>
                            ) : (
                              "-"
                            )
                        }
                      ]}
                    />
                  </div>
                )
              }
            ]}
          />
        </Card>

        {/* Modal: Assign Clients to this Group */}
        <Modal
          title={
            <div>
              <div className="font-bold text-slate-800 text-base">Assign Clients to {groupDetail.name}</div>
              <div className="text-xs text-slate-500">
                Select one or more existing client companies / joint ventures to associate with this group.
              </div>
            </div>
          }
          open={assignModalOpen}
          onCancel={() => setAssignModalOpen(false)}
          onOk={() => {
            if (selectedClientIdsToAssign.length > 0) {
              assignClients(
                { groupId: id, clientIds: selectedClientIdsToAssign },
                {
                  onSuccess: () => {
                    setSelectedClientIdsToAssign([]);
                    setAssignModalOpen(false);
                  }
                }
              );
            }
          }}
          confirmLoading={assigningClients}
          okText={`Assign ${selectedClientIdsToAssign.length} Client(s)`}
          okButtonProps={{ disabled: selectedClientIdsToAssign.length === 0 }}
        >
          <div className="pt-2">
            <Select
              mode="multiple"
              placeholder="Select client entities to assign..."
              value={selectedClientIdsToAssign}
              onChange={setSelectedClientIdsToAssign}
              options={unassignedClients}
              className="w-full"
              style={{ minHeight: 40 }}
              showSearch
              optionFilterProp="label"
            />
          </div>
        </Modal>
      </div>
    );
  }

  // --- LIST OF ALL CLIENT GROUPS VIEW ---
  return (
    <div className="p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">
            🏢 Client Groups & Corporate Umbrella Management
          </h1>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Group related sister concerns, joint ventures, and offices for consolidated reporting and group ledgers.
          </p>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
            className="font-medium bg-blue-600"
          >
            Create New Group
          </Button>
          <Button onClick={() => navigate("/client")}>
            View Individual Clients
          </Button>
        </Space>
      </div>

      {/* Groups Table */}
      <Card className="shadow-xs border-slate-200">
        <Table
          dataSource={groups}
          rowKey="id"
          loading={loadingGroups}
          pagination={{ pageSize: 10 }}
          bordered
          columns={[
            {
              title: "Group Name",
              dataIndex: "name",
              key: "name",
              render: (name, record: any) => (
                <div>
                  <div
                    className="font-bold text-blue-600 cursor-pointer hover:underline text-sm"
                    onClick={() => navigate(`/client-groups/${record.id}`)}
                  >
                    🏢 {name}
                  </div>
                  {record.code && (
                    <Tag color="geekblue" className="font-mono text-[10px] mt-0.5">
                      {record.code}
                    </Tag>
                  )}
                </div>
              )
            },
            {
              title: "Member Companies / JVs",
              dataIndex: "memberCount",
              key: "memberCount",
              width: 170,
              align: "center",
              render: (count) => (
                <Tag color="purple" className="font-bold text-xs px-2 py-0.5">
                  {count || 0} Entities
                </Tag>
              )
            },
            {
              title: "Active Projects",
              dataIndex: "activeProjectsCount",
              key: "activeProjectsCount",
              width: 140,
              align: "center",
              render: (count) => (
                <Tag color={count > 0 ? "success" : "default"} className="font-bold text-xs px-2 py-0.5">
                  {count || 0} Projects
                </Tag>
              )
            },
            {
              title: "Central Contact Person",
              key: "contact",
              render: (_, record: any) => (
                <div>
                  <div className="font-medium text-slate-800 text-xs">
                    {record.primaryContactPerson || "-"}
                  </div>
                  {record.primaryPhone && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      {record.primaryPhone}
                    </div>
                  )}
                </div>
              )
            },
            {
              title: "Partner in Charge",
              dataIndex: ["partnerInCharge", "name"],
              key: "partnerInCharge",
              render: (name) => (name ? <span className="font-medium text-slate-700">{name}</span> : "-")
            },
            {
              title: "Actions",
              key: "actions",
              width: 140,
              align: "center",
              render: (_, record: any) => (
                <Space size={8}>
                  <Tooltip title="View Group & Consolidated Ledger">
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/client-groups/${record.id}`)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete Group"
                    description={`Are you sure you want to delete "${record.name}"? Member clients will be unlinked, not deleted.`}
                    onConfirm={() => deleteGroup(record.id)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                  >
                    <Tooltip title="Delete Group">
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingGroup}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* Modal: Create Client Group */}
      <CreateClientGroupModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default ClientGroupPage;

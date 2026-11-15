import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Tabs, Spin, Typography, Space, Row, Col, Tag, Avatar, Table, Divider, Tooltip, message } from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  HomeOutlined,
  BankOutlined,
  IdcardOutlined,
  CalendarOutlined,
  TeamOutlined,
  CopyOutlined,
  CheckOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ProjectOutlined,
  UsergroupAddOutlined,
  FileDoneOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useClientById } from '@/hooks/client/useClientById';
import PortalCredentialsForm from '@/components/Client/portalcredentialsform';
import ClientProjects from '@/components/Client/ClientProjects';
import ClientUsersTab from '@/components/Client/ClientUsersTab';
import useIsMobile from '@/hooks/useIsMobile';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ClientView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();
  const { data: client, isLoading } = useClientById({ id: id || '' });
  const [activeTab, setActiveTab] = useState('basic');
  const [copiedPan, setCopiedPan] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!client) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 0', margin: '24px 0' }}>
        <Title level={4} type="secondary">Client Not Found</Title>
        <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client')}>
          Back to Clients List
        </Button>
      </Card>
    );
  }

  const handleCopyPan = () => {
    if (client.panNo) {
      navigator.clipboard.writeText(client.panNo);
      setCopiedPan(true);
      message.success('PAN number copied to clipboard!');
      setTimeout(() => setCopiedPan(false), 2000);
    }
  };

  const formatText = (text?: any) => {
    if (!text) return '-';
    if (typeof text === 'object' && text !== null) {
      if (text.name) return String(text.name);
      if (text.label) return String(text.label);
      if (text.title) return String(text.title);
      return '-';
    }
    return String(text).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatLegalStatus = (status?: any) => {
    if (!status) return '-';
    if (typeof status === 'object' && status.name) {
      return status.name;
    }
    return formatText(status);
  };

  const getStatusTag = (status?: string) => {
    const st = String(status || 'active').toLowerCase();
    switch (st) {
      case 'active':
        return <Tag color="success" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 12 }}>Active</Tag>;
      case 'suspended':
        return <Tag color="warning" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 12 }}>Suspended</Tag>;
      case 'archive':
      case 'archived':
        return <Tag color="error" style={{ padding: '4px 12px', fontSize: 13, borderRadius: 12 }}>Archived</Tag>;
      default:
        return <Tag style={{ padding: '4px 12px', fontSize: 13, borderRadius: 12 }}>{formatText(st)}</Tag>;
    }
  };

  // Group contacts inherited from the corporate group
  const groupContacts = client.clientGroup?.contacts || [];
  const boardMembers = client.boardMembers || [];
  const managementMembers = client.managementTeamMembers || [];
  const licenses = client.registrationAndLicenses || [];

  return (
    <div style={{ padding: isMobile ? '8px' : '16px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Top Header Card */}
      <Card
        className="shadow-sm border-slate-200"
        style={{
          borderRadius: 12,
          marginBottom: 16,
          background: 'linear-gradient(to right, #ffffff, #fafafa)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          {/* Left: Client Branding & Overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar
              size={isMobile ? 52 : 64}
              style={{
                backgroundColor: '#1677ff',
                fontSize: isMobile ? 22 : 28,
                fontWeight: 700,
                boxShadow: '0 4px 10px rgba(22, 119, 255, 0.25)',
              }}
            >
              {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
            </Avatar>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Title level={isMobile ? 4 : 2} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                  {client.name}
                </Title>
                {getStatusTag(client.status)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                {client.shortName && (
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                    Code: <Tag color="blue">{client.shortName}</Tag>
                  </Text>
                )}
                {/* Client Group Pill Link */}
                {client.clientGroup && (
                  <Link to={`/client-groups/${client.clientGroup.id}`}>
                    <Tag color="geekblue" className="text-xs font-semibold cursor-pointer hover:opacity-80">
                      🏢 Part of {client.clientGroup.name}
                    </Tag>
                  </Link>
                )}
                {client.partnerInCharge && (
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                    Lead: <Tag color="purple"><UserOutlined className="mr-1" />{client.partnerInCharge.name}</Tag>
                  </Text>
                )}
                {client.creator?.name && (
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    Created by: <span className="font-semibold text-slate-700">{client.creator?.name}</span>
                  </Text>
                )}
                {client.updater?.name && (
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                    Updated by: <span className="font-semibold text-slate-700">{client.updater?.name}</span>
                  </Text>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions Header */}
          <Space size={12} wrap>
            {!isMobile && (
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/client')} size="middle">
                Back to Clients
              </Button>
            )}
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/client/edit/${id}`)} size="middle">
              Edit Client
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '18px 0 14px 0' }} />

        {/* Top Metric Header Chips */}
        <Row gutter={[24, 12]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IdcardOutlined style={{ color: '#1677ff', fontSize: 18 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>PAN NUMBER</Text>
                <Space size={4}>
                  <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{client.panNo || '-'}</Text>
                  {client.panNo && (
                    <Tooltip title="Copy PAN">
                      <Button
                        type="text"
                        size="small"
                        icon={copiedPan ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined style={{ color: '#94a3b8' }} />}
                        onClick={handleCopyPan}
                      />
                    </Tooltip>
                  )}
                </Space>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BankOutlined style={{ color: '#52c41a', fontSize: 18 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>LEGAL STATUS</Text>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{formatLegalStatus(client.legalStatus)}</Text>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TeamOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>BUSINESS SIZE</Text>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  {client.businessSize?.name || formatText(client.businessSizeEnum)}
                </Text>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarOutlined style={{ color: '#722ed1', fontSize: 18 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>REGISTERED DATE</Text>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  {client.registeredDate ? dayjs(client.registeredDate).format('MMM DD, YYYY') : '-'}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Main Tabs Container */}
      <Card className="shadow-sm border-slate-200" style={{ borderRadius: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'basic',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AppstoreOutlined />
                  Basic Information
                </span>
              ),
              children: (
                <Space direction="vertical" size={20} style={{ width: '100%', paddingTop: 8 }}>
                  <Row gutter={[20, 20]}>
                    {/* Business & Industry Details Card */}
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                            <span>Business & Industry Details</span>
                          </Space>
                        }
                        size="small"
                        bordered
                        className="bg-slate-50/50"
                        style={{ height: '100%', borderRadius: 8 }}
                      >
                        <Space direction="vertical" size={14} style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>Company Full Name</Text>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{client.name}</div>
                          </div>

                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>Industry / Business Nature</Text>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                              {client.industryNature?.name || formatText(client.industryNatureEnum)}
                            </div>
                          </div>

                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>PAN / Permanent Account Number</Text>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1677ff', fontFamily: 'monospace' }}>
                              {client.panNo || '-'}
                            </div>
                          </div>

                          {client.lastEditReason && (
                            <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>
                                LATEST EDIT LOG REASON:
                              </Text>
                              <div style={{ fontSize: 13, color: '#78350f', marginTop: 2 }}>
                                {client.lastEditReason}
                              </div>
                            </div>
                          )}
                        </Space>
                      </Card>
                    </Col>

                    {/* Contact Information Card */}
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <PhoneOutlined style={{ color: '#52c41a' }} />
                            <span>Official Contact Details</span>
                          </Space>
                        }
                        size="small"
                        bordered
                        className="bg-slate-50/50"
                        style={{ height: '100%', borderRadius: 8 }}
                      >
                        <Space direction="vertical" size={14} style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>Email Address</Text>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                              {client.email ? (
                                <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-blue-600">
                                  <MailOutlined /> {client.email}
                                </a>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>

                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>Telephone / Mobile</Text>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                              {client.mobileNo || client.telephoneNo || client.phone ? (
                                <span className="flex items-center gap-1">
                                  <PhoneOutlined /> {client.mobileNo || client.telephoneNo || client.phone}
                                </span>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>

                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>Website URL</Text>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {client.website ? (
                                <a
                                  href={client.website.startsWith('http') ? client.website : `http://${client.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600"
                                >
                                  <GlobalOutlined /> {client.website}
                                </a>
                              ) : (
                                '-'
                              )}
                            </div>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  {/* Banking Information Card */}
                  <Card
                    title={
                      <Space>
                        <BankOutlined style={{ color: '#059669' }} />
                        <span>Banking & Financial Account</span>
                      </Space>
                    }
                    size="small"
                    bordered
                    className="bg-slate-50/50"
                    style={{ borderRadius: 8 }}
                  >
                    <Row gutter={[20, 16]}>
                      <Col xs={24} sm={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>BANK NAME</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          {client.bankName || '-'}
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>ACCOUNT NUMBER</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                          {client.bankAccountNumber || '-'}
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Text type="secondary" style={{ fontSize: 11 }}>BANK BRANCH</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          {client.bankBranch || '-'}
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  {/* Address & Location Card */}
                  <Card
                    title={
                      <Space>
                        <EnvironmentOutlined style={{ color: '#fa8c16' }} />
                        <span>Registered Location & Address</span>
                      </Space>
                    }
                    size="small"
                    bordered
                    className="bg-slate-50/50"
                    style={{ borderRadius: 8 }}
                  >
                    <Row gutter={[20, 16]}>
                      <Col xs={12} sm={8} md={4}>
                        <Text type="secondary" style={{ fontSize: 11 }}>COUNTRY</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          <HomeOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
                          {formatText(client.country)}
                        </div>
                      </Col>

                      <Col xs={12} sm={8} md={4}>
                        <Text type="secondary" style={{ fontSize: 11 }}>STATE / PROVINCE</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          {formatText(client.state)}
                        </div>
                      </Col>

                      <Col xs={12} sm={8} md={4}>
                        <Text type="secondary" style={{ fontSize: 11 }}>DISTRICT</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          {formatText(client.district)}
                        </div>
                      </Col>

                      <Col xs={12} sm={8} md={6}>
                        <Text type="secondary" style={{ fontSize: 11 }}>LOCAL JURISDICTION</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          <CompassOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
                          {formatText(client.localJurisdiction)}
                        </div>
                      </Col>

                      <Col xs={12} sm={8} md={3}>
                        <Text type="secondary" style={{ fontSize: 11 }}>WARD NO.</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          {client.wardNo || '-'}
                        </div>
                      </Col>

                      <Col xs={12} sm={8} md={3}>
                        <Text type="secondary" style={{ fontSize: 11 }}>LOCALITY</Text>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          {formatText(client.locality)}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              )
            },
            {
              key: 'contacts',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamOutlined />
                  Contacts & Governance
                </span>
              ),
              children: (
                <Space direction="vertical" size={24} style={{ width: '100%', paddingTop: 8 }}>
                  {/* Central Group Contacts (Inherited from Corporate Group) */}
                  {client.clientGroup && (
                    <Card
                      title={
                        <div className="flex items-center justify-between">
                          <Space>
                            <BankOutlined style={{ color: '#1677ff' }} />
                            <span>🏢 Central Group Office Contacts (Inherited from {client.clientGroup.name})</span>
                          </Space>
                          <Link to={`/client-groups/${client.clientGroup.id}`}>
                            <Tag color="geekblue" className="cursor-pointer">
                              View Group Profile
                            </Tag>
                          </Link>
                        </div>
                      }
                      size="small"
                      bordered
                      className="border-blue-200 bg-blue-50/20"
                    >
                      {groupContacts.length === 0 ? (
                        <div className="text-slate-400 italic text-xs py-3 text-center">
                          No central group contacts registered under {client.clientGroup.name}.
                        </div>
                      ) : (
                        <Table
                          dataSource={groupContacts}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          columns={[
                            {
                              title: "Contact Person",
                              dataIndex: "name",
                              key: "name",
                              render: (name, rec: any) => (
                                <span className="font-bold text-slate-800">
                                  {name} {rec.isPrimary && <Tag color="gold">Primary Group Contact</Tag>}
                                </span>
                              )
                            },
                            { title: "Designation", dataIndex: "designation", key: "designation" },
                            { title: "Department", dataIndex: "department", key: "department" },
                            {
                              title: "Mobile / Phone",
                              key: "phone",
                              render: (_, rec: any) => rec.mobileNo || rec.telephoneNo || "-"
                            },
                            {
                              title: "Email",
                              dataIndex: "email",
                              key: "email",
                              render: (email) => email ? <a href={`mailto:${email}`}>{email}</a> : "-"
                            }
                          ]}
                        />
                      )}
                    </Card>
                  )}

                  {/* Board Members (Charged with Governance - NSA 260) */}
                  <Card
                    title={
                      <Space>
                        <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
                        <span>🏛️ Board of Directors (Charged with Governance — NSA 260)</span>
                      </Space>
                    }
                    size="small"
                    bordered
                  >
                    {boardMembers.length === 0 ? (
                      <div className="text-slate-400 italic text-xs py-3 text-center">
                        No board members or directors registered for this entity.
                      </div>
                    ) : (
                      <Table
                        dataSource={boardMembers}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: "Director Name", dataIndex: "name", key: "name", render: (t) => <span className="font-semibold">{t}</span> },
                          { title: "Designation", dataIndex: "designation", key: "designation" },
                          { title: "Mobile", dataIndex: "mobileNo", key: "mobileNo" },
                          { title: "Email", dataIndex: "email", key: "email", render: (e) => e ? <a href={`mailto:${e}`}>{e}</a> : "-" }
                        ]}
                      />
                    )}
                  </Card>

                  {/* Management Team (Operational Personnel) */}
                  <Card
                    title={
                      <Space>
                        <UsergroupAddOutlined style={{ color: '#059669' }} />
                        <span>👥 Management Team & Key Operational Personnel</span>
                      </Space>
                    }
                    size="small"
                    bordered
                  >
                    {managementMembers.length === 0 ? (
                      <div className="text-slate-400 italic text-xs py-3 text-center">
                        No management team members recorded for this entity.
                      </div>
                    ) : (
                      <Table
                        dataSource={managementMembers}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: "Personnel Name", dataIndex: "name", key: "name", render: (t) => <span className="font-semibold">{t}</span> },
                          { title: "Designation", dataIndex: "designation", key: "designation" },
                          { title: "Department", dataIndex: "department", key: "department" },
                          { title: "Mobile", dataIndex: "mobileNo", key: "mobileNo" },
                          { title: "Email", dataIndex: "email", key: "email", render: (e) => e ? <a href={`mailto:${e}`}>{e}</a> : "-" }
                        ]}
                      />
                    )}
                  </Card>
                </Space>
              )
            },
            {
              key: 'licenses',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileDoneOutlined />
                  Registrations & Licenses ({licenses.length})
                </span>
              ),
              children: (
                <div className="pt-2">
                  {licenses.length === 0 ? (
                    <div className="text-slate-400 italic text-xs py-6 text-center">
                      No statutory registrations or operating licenses added yet.
                    </div>
                  ) : (
                    <Table
                      dataSource={licenses}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      bordered
                      columns={[
                        { title: "Licensing Authority", dataIndex: "licensingAuthority", key: "authority", render: (t) => <span className="font-semibold">{t}</span> },
                        { title: "License / Reg. No.", dataIndex: "registrationOrLicenseNo", key: "regNo", render: (t) => <span className="font-mono">{t}</span> },
                        { title: "Issue Date", dataIndex: "dateOfIssue", key: "issueDate", render: (d) => d ? dayjs(d).format("MMM DD, YYYY") : "-" },
                        { title: "Valid / Expiry Date", dataIndex: "validDate", key: "validDate", render: (d) => d ? dayjs(d).format("MMM DD, YYYY") : "-" },
                        { title: "Renewal Frequency", dataIndex: "frequencyOfRenewal", key: "frequency", render: (f) => f ? <Tag color="blue">{formatText(f)}</Tag> : "-" },
                      ]}
                    />
                  )}
                </div>
              )
            },
            {
              key: 'users',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UsergroupAddOutlined />
                  Client Portal Users
                </span>
              ),
              children: <ClientUsersTab clientId={id!} clientName={client.name} />
            },
            {
              key: 'credentials',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <KeyOutlined />
                  Portal & IRD Credentials
                </span>
              ),
              children: <PortalCredentialsForm clientId={id!} readOnly={true} />
            },
            {
              key: 'projects',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProjectOutlined />
                  Associated Projects
                </span>
              ),
              children: <ClientProjects clientId={id!} />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default ClientView;

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Button,
  Tabs,
  Spin,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Avatar,
  Table,
  Tooltip,
  message,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Popconfirm
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  BankOutlined,
  IdcardOutlined,
  CalendarOutlined,
  CopyOutlined,
  CheckOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ProjectOutlined,
  UsergroupAddOutlined,
  FileDoneOutlined,
  UserOutlined,
  FileTextOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useClientById } from '@/hooks/client/useClientById';
import { usePortalCredentials } from '@/hooks/client/usePortalCredentials';
import { useClientUsers } from '@/hooks/clientReport/useClientUsers';
import { useClientReportsByCustomer } from '@/hooks/clientReport';
import { fetchProjectsByCustomer } from '@/service/clientReport.service';
import {
  addClientBoardMember,
  createClientLicense,
  updateClientLicense,
  deleteClientLicense,
  createClientOtherInfo,
  updateClientOtherInfo,
  deleteClientOtherInfo,
} from '@/service/client.service';
import usePermissionChecker from '@/hooks/usePermissionChecker';
import PortalCredentialsForm from '@/components/Client/portalcredentialsform';
import ClientProjects from '@/components/Client/ClientProjects';
import ClientReportsTab from '@/components/Client/ClientReportsTab';
import ClientUsersTab from '@/components/Client/ClientUsersTab';
import ClientTimelineTab from '@/components/Client/ClientTimelineTab';
import useIsMobile from '@/hooks/useIsMobile';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const ClientView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useIsMobile();
  const permissionChecker = usePermissionChecker();
  const canManagePortalCredentials = permissionChecker.isSuperAdmin();

  // Company Profile as the first tab by default
  const [activeTab, setActiveTab] = useState('profile');
  const [copiedPan, setCopiedPan] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardForm] = Form.useForm();
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [licenseForm] = Form.useForm();
  const [otherInfoModalOpen, setOtherInfoModalOpen] = useState(false);
  const [editingOtherInfo, setEditingOtherInfo] = useState<any>(null);
  const [otherInfoForm] = Form.useForm();

  const { data: client, isLoading } = useClientById({ id: id || '' });

  const addBoardMutation = useMutation({
    mutationFn: (payload: any) => addClientBoardMember(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['client-timeline', id] });
      message.success('Board member added');
      setBoardModalOpen(false);
      boardForm.resetFields();
    },
    onError: () => {
      message.error('Failed to add board member');
    },
  });

  const saveLicenseMutation = useMutation({
    mutationFn: (payload: any) =>
      editingLicense
        ? updateClientLicense(id!, editingLicense.id, payload)
        : createClientLicense(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['client-timeline', id] });
      message.success(editingLicense ? 'License updated' : 'License added');
      setLicenseModalOpen(false);
      setEditingLicense(null);
      licenseForm.resetFields();
    },
    onError: () => message.error('Failed to save license'),
  });

  const deleteLicenseMutation = useMutation({
    mutationFn: (licenseId: string) => deleteClientLicense(id!, licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      message.success('License deleted');
    },
    onError: () => message.error('Failed to delete license'),
  });

  const saveOtherInfoMutation = useMutation({
    mutationFn: (payload: any) =>
      editingOtherInfo
        ? updateClientOtherInfo(id!, editingOtherInfo.id, payload)
        : createClientOtherInfo(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      message.success(editingOtherInfo ? 'Record updated' : 'Record added');
      setOtherInfoModalOpen(false);
      setEditingOtherInfo(null);
      otherInfoForm.resetFields();
    },
    onError: () => message.error('Failed to save record'),
  });

  const deleteOtherInfoMutation = useMutation({
    mutationFn: (infoId: string) => deleteClientOtherInfo(id!, infoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      message.success('Record deleted');
    },
    onError: () => message.error('Failed to delete record'),
  });

  // Counts for Tabs
  const { data: projects } = useQuery({
    queryKey: ['client-projects', id],
    queryFn: () => fetchProjectsByCustomer(id!),
    enabled: !!id,
  });

  const { data: reports } = useClientReportsByCustomer(id || '');
  const { data: portalUsers } = useClientUsers(id || '');
  const { data: credentials } = usePortalCredentials(canManagePortalCredentials ? id || '' : '');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading client profile..." />
      </div>
    );
  }

  if (!client) {
    return (
      <Card style={{ textAlign: 'center', padding: '60px 0', margin: '16px 0', borderRadius: 12 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-slate-600 font-medium text-base">Client Not Found</span>}
        >
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/client')}>
            Back to Clients List
          </Button>
        </Empty>
      </Card>
    );
  }

  const handleCopyPan = () => {
    if (client.panNo) {
      navigator.clipboard.writeText(client.panNo);
      setCopiedPan(true);
      message.success('PAN number copied');
      setTimeout(() => setCopiedPan(false), 2000);
    }
  };

  const handleCopyAccount = () => {
    if (client.bankAccountNumber) {
      navigator.clipboard.writeText(client.bankAccountNumber);
      setCopiedAccount(true);
      message.success('Bank account number copied');
      setTimeout(() => setCopiedAccount(false), 2000);
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

  const formatLocation = (val?: string) => {
    if (!val) return '';
    return val.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatLegalStatus = (status?: any) => {
    if (!status) return 'Not Specified';
    if (typeof status === 'object' && status.name) {
      return status.name;
    }
    return formatText(status);
  };

  // Status tag with thematic blue processing color for Active
  const getStatusTag = (status?: string) => {
    const st = String(status || 'active').toLowerCase();
    switch (st) {
      case 'active':
        return (
          <Tag color="processing" className="px-2.5 py-0.5 text-xs font-semibold rounded-full">
            Active
          </Tag>
        );
      case 'suspended':
        return (
          <Tag color="warning" className="px-2.5 py-0.5 text-xs font-semibold rounded-full border-amber-200">
            Suspended
          </Tag>
        );
      case 'archive':
      case 'archived':
        return (
          <Tag color="error" className="px-2.5 py-0.5 text-xs font-semibold rounded-full border-red-200">
            Archived
          </Tag>
        );
      default:
        return (
          <Tag className="px-2.5 py-0.5 text-xs font-semibold rounded-full">
            {formatText(st)}
          </Tag>
        );
    }
  };

  const groupContacts = client.clientGroup?.contacts || [];
  const boardMembers = client.boardMembers || [];
  const managementMembers = client.managementTeamMembers || [];
  const licenses = client.registrationAndLicenses || [];
  const otherInfos = client.otherImportantInfos || [];
  const projectList = Array.isArray(projects) ? projects : [];
  const reportsCount = Array.isArray(reports) ? reports.length : 0;
  const usersCount = Array.isArray(portalUsers) ? portalUsers.length : 0;
  const credsCount = Array.isArray(credentials) ? credentials.length : 0;

  // Format clean address components
  const addressParts: string[] = [];
  if (client.locality) addressParts.push(formatLocation(client.locality));
  if (client.wardNo) addressParts.push(`Ward ${client.wardNo}`);
  if (client.localJurisdiction) addressParts.push(formatLocation(client.localJurisdiction));
  if (client.district) addressParts.push(formatLocation(client.district));
  const fullAddressSummary = addressParts.filter(Boolean).join(', ');

  return (
    <div className="max-w-[1480px] mx-auto px-1 sm:px-2 pt-0 pb-3">
      {/* Sleek, Space-Efficient Integrated Client Card with Reduced Top Margin */}
      <Card
        className="shadow-sm border-slate-200/90 rounded-xl bg-white overflow-hidden mt-0"
        bodyStyle={{ padding: isMobile ? '10px 12px' : '14px 18px' }}
      >
        {/* Header Bar: Back, Avatar, Name, Status, Tags, and Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="text"
              shape="circle"
              icon={<ArrowLeftOutlined className="text-base text-slate-600 hover:text-blue-600" />}
              onClick={() => navigate('/client')}
              title="Back to Clients"
              className="-ml-1"
            />
            <Avatar
              size={isMobile ? 38 : 44}
              style={{
                backgroundColor: '#1677ff',
                fontSize: 18,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {client.name}
                </span>
                {getStatusTag(client.status)}
                {client.shortName && (
                  <Tag color="blue" className="font-semibold text-xs m-0">
                    {client.shortName}
                  </Tag>
                )}
                {client.clientGroup && (
                  <Link to={`/client-groups/${client.clientGroup.id}`}>
                    <Tag color="geekblue" className="font-medium text-xs m-0 cursor-pointer hover:opacity-80">
                      🏢 {client.clientGroup.name}
                    </Tag>
                  </Link>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {client.creator?.name ? `Created by ${client.creator.name}` : 'Registered entity'}
                {client.registeredDate ? ` • ${dayjs(client.registeredDate).format('MMM DD, YYYY')}` : ''}
                {client.updatedAt ? ` • Updated ${dayjs(client.updatedAt).fromNow()}` : ''}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              icon={<PlusOutlined />}
              onClick={() => navigate(`/projects/new?client=${id}`)}
              size="middle"
            >
              New Project
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/client/edit/${id}`)}
              size="middle"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Edit Client
            </Button>
          </div>
        </div>

        {/* Modification Note (if recorded) */}
        {client.lastEditReason && (
          <div className="my-2 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200/80 text-xs text-amber-900 flex items-center gap-1.5">
            <InfoCircleOutlined className="text-amber-600 text-xs shrink-0" />
            <span><strong className="text-amber-800">Note:</strong> {client.lastEditReason}</span>
          </div>
        )}

        {/* Tabs: Company Profile First, Followed by Projects, Reports, Licenses, Portal & IRD, Banking */}
        <div className="mt-1">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="middle"
            items={[
              {
                key: 'profile',
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <AppstoreOutlined />
                    Company Profile
                  </span>
                ),
                children: (
                  <Space direction="vertical" size={16} className="w-full pt-1">
                    {/* Top Section: Statutory Classification & Contact/Location */}
                    <Row gutter={[16, 16]}>
                      {/* Statutory & Identification Details */}
                      <Col xs={24} md={12}>
                        <Card
                          size="small"
                          title={
                            <Space className="font-semibold text-slate-800 text-xs">
                              <SafetyCertificateOutlined className="text-blue-600" />
                              <span>Statutory & Tax Classification</span>
                            </Space>
                          }
                          className="border-slate-200 h-full shadow-none"
                        >
                          <Row gutter={[16, 14]}>
                            {/* PAN Number */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">PAN / Tax ID</Text>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {client.panNo || 'Not Recorded'}
                                </span>
                                {client.panNo && (
                                  <Tooltip title={copiedPan ? 'Copied!' : 'Copy PAN'}>
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={copiedPan ? <CheckOutlined className="text-green-600 text-xs" /> : <CopyOutlined className="text-slate-400 text-xs" />}
                                      onClick={handleCopyPan}
                                      className="p-0 h-4 w-4"
                                    />
                                  </Tooltip>
                                )}
                              </div>
                            </Col>

                            {/* Legal Status */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Legal Status</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {formatLegalStatus(client.legalStatus || client.legalStatusEnum)}
                              </div>
                            </Col>

                            {/* Business Size */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Business Size</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {client.businessSize?.name || formatText(client.businessSizeEnum)}
                              </div>
                            </Col>

                            {/* Industry Nature */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Industry Nature</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {client.industryNature?.name || formatText(client.industryNatureEnum)}
                              </div>
                            </Col>

                            {/* Partner in Charge */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Partner in Charge</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {client.partnerInCharge?.name || 'Unassigned'}
                              </div>
                            </Col>

                            {/* Incorporation Date */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Incorporation Date</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {client.registeredDate ? dayjs(client.registeredDate).format('MMM DD, YYYY') : 'Not Recorded'}
                              </div>
                            </Col>

                            {/* VAT Registered */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">VAT Registered</Text>
                              <div className="mt-0.5">
                                <Tag color={client.isVatRegistered ? 'blue' : 'default'}>
                                  {client.isVatRegistered ? 'VAT Registered' : 'Non-VAT'}
                                </Tag>
                              </div>
                            </Col>

                            {/* Tax Office */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Tax Office (IRO)</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {client.taxOffice || '-'}
                              </div>
                            </Col>

                            {/* OCR Reg No */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">OCR Reg. No.</Text>
                              <div className="font-mono font-semibold text-slate-800 text-sm mt-0.5">
                                {client.ocrRegNo || '-'}
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      </Col>

                      {/* Official Contact & Registered Office */}
                      <Col xs={24} md={12}>
                        <Card
                          size="small"
                          title={
                            <Space className="font-semibold text-slate-800 text-xs">
                              <EnvironmentOutlined className="text-amber-500" />
                              <span>Registered Office & Contact</span>
                            </Space>
                          }
                          className="border-slate-200 h-full shadow-none"
                        >
                          <Row gutter={[16, 14]}>
                            {/* Registered Location */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Street / Locality</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {client.locality ? formatLocation(client.locality) : '-'} {client.wardNo ? `(Ward ${client.wardNo})` : ''}
                              </div>
                            </Col>

                            {/* Local Jurisdiction */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Local Jurisdiction</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {client.localJurisdiction ? formatLocation(client.localJurisdiction) : '-'}
                              </div>
                            </Col>

                            {/* District & Province */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">District & Province</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                {[formatLocation(client.district), formatLocation(client.state)].filter(Boolean).join(', ') || '-'}
                              </div>
                            </Col>

                            {/* Country */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Country</Text>
                              <div className="font-semibold text-slate-800 text-sm mt-0.5">
                                🇳🇵 {formatLocation(client.country) || 'Nepal'}
                              </div>
                            </Col>

                            {/* Phone / Mobile */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Phone / Mobile</Text>
                              <div className="mt-0.5">
                                {(client.mobileNo || client.telephoneNo || client.phone) ? (
                                  <a
                                    href={`tel:${client.mobileNo || client.telephoneNo || client.phone}`}
                                    className="flex items-center gap-1.5 text-slate-800 hover:text-blue-600 font-semibold text-sm"
                                  >
                                    <PhoneOutlined className="text-emerald-500 text-xs" />
                                    <span>{client.mobileNo || client.telephoneNo || client.phone}</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400 text-sm">-</span>
                                )}
                              </div>
                            </Col>

                            {/* Official Email / Website */}
                            <Col span={12}>
                              <Text type="secondary" className="text-[11px] uppercase font-medium">Email / Website</Text>
                              <div className="mt-0.5 flex flex-col gap-0.5">
                                {client.email && (
                                  <a
                                    href={`mailto:${client.email}`}
                                    className="flex items-center gap-1 text-slate-800 hover:text-blue-600 text-xs font-semibold truncate"
                                    title={client.email}
                                  >
                                    <MailOutlined className="text-blue-500 text-xs shrink-0" />
                                    <span className="truncate">{client.email}</span>
                                  </a>
                                )}
                                {client.website && (
                                  <a
                                    href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium truncate"
                                    title={client.website}
                                  >
                                    <GlobalOutlined className="text-xs shrink-0" />
                                    <span className="truncate">{client.website.replace(/^https?:\/\//, '')}</span>
                                  </a>
                                )}
                                {!client.email && !client.website && (
                                  <span className="text-slate-400 text-sm">-</span>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    </Row>

                    {/* Corporate Group Affiliation (if present) */}
                    {client.clientGroup && (
                      <Card
                        size="small"
                        title={
                          <div className="flex items-center justify-between">
                            <Space className="font-semibold text-slate-800 text-xs">
                              <BankOutlined className="text-indigo-600" />
                              <span>Corporate Group: {client.clientGroup.name}</span>
                            </Space>
                            <Link to={`/client-groups/${client.clientGroup.id}`}>
                              <Button size="small" type="link">
                                View Group Profile &rarr;
                              </Button>
                            </Link>
                          </div>
                        }
                        className="border-indigo-100 bg-indigo-50/20"
                      >
                        {groupContacts.length === 0 ? (
                          <div className="text-slate-400 italic text-xs py-2 text-center">
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
                                title: 'Contact Person',
                                dataIndex: 'name',
                                key: 'name',
                                render: (name, rec: any) => (
                                  <span className="font-semibold text-slate-800">
                                    {name} {rec.isPrimary && <Tag color="gold" className="text-[10px] ml-1">Primary</Tag>}
                                  </span>
                                )
                              },
                              { title: 'Designation', dataIndex: 'designation', key: 'designation' },
                              { title: 'Department', dataIndex: 'department', key: 'department' },
                              {
                                title: 'Mobile / Phone',
                                key: 'phone',
                                render: (_, rec: any) => rec.mobileNo || rec.telephoneNo || '-'
                              },
                              {
                                title: 'Email',
                                dataIndex: 'email',
                                key: 'email',
                                render: (email) => email ? <a href={`mailto:${email}`} className="text-blue-600">{email}</a> : '-'
                              }
                            ]}
                          />
                        )}
                      </Card>
                    )}

                    {/* About Client (if present) */}
                    {client.about && (
                      <Card size="small" title="About Client" className="border-slate-200 shadow-none">
                        <p className="text-sm text-slate-700 m-0 whitespace-pre-line">
                          {client.about}
                        </p>
                      </Card>
                    )}

                    {/* Primary Contact Person */}
                    {(client.contactPerson || client.contactPersonPhone || client.contactPersonEmail) && (
                      <Card
                        size="small"
                        title={
                          <div className="flex items-center justify-between">
                            <Space className="font-semibold text-slate-800 text-xs">
                              <UserOutlined className="text-blue-600" />
                              <span>Primary Contact Person</span>
                            </Space>
                            {client.contactPersonBoardMemberId && (
                              <Tag color="blue" className="m-0 text-xs">
                                Board Member
                              </Tag>
                            )}
                          </div>
                        }
                        className="border-slate-200 shadow-none"
                      >
                        <Row gutter={[16, 12]}>
                          <Col xs={24} sm={6}>
                            <Text type="secondary" className="text-[11px] uppercase font-medium">Name</Text>
                            <div className="font-semibold text-slate-800 text-sm mt-0.5">
                              {client.contactPerson || '-'}
                            </div>
                          </Col>
                          <Col xs={24} sm={6}>
                            <Text type="secondary" className="text-[11px] uppercase font-medium">Designation</Text>
                            <div className="font-semibold text-slate-800 text-sm mt-0.5">
                              {client.contactPersonDesignation || '-'}
                            </div>
                          </Col>
                          <Col xs={24} sm={6}>
                            <Text type="secondary" className="text-[11px] uppercase font-medium">Phone</Text>
                            <div className="font-semibold text-slate-800 text-sm mt-0.5">
                              {client.contactPersonPhone ? (
                                <a href={`tel:${client.contactPersonPhone}`} className="text-blue-600">
                                  {client.contactPersonPhone}
                                </a>
                              ) : '-'}
                            </div>
                          </Col>
                          <Col xs={24} sm={6}>
                            <Text type="secondary" className="text-[11px] uppercase font-medium">Email</Text>
                            <div className="font-semibold text-slate-800 text-sm mt-0.5 truncate">
                              {client.contactPersonEmail ? (
                                <a href={`mailto:${client.contactPersonEmail}`} className="text-blue-600">
                                  {client.contactPersonEmail}
                                </a>
                              ) : '-'}
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {/* Board of Directors (NSA 260) */}
                    <Card
                      size="small"
                      title={
                        <div className="flex items-center justify-between">
                          <Space className="font-semibold text-slate-800 text-xs">
                            <SafetyCertificateOutlined className="text-purple-600" />
                            <span>Board of Directors (NSA 260)</span>
                            <Tag color="purple">{boardMembers.length}</Tag>
                          </Space>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              boardForm.resetFields();
                              boardForm.setFieldsValue({ isActive: true, isContactPerson: false });
                              setBoardModalOpen(true);
                            }}
                          >
                            Add Board Member
                          </Button>
                        </div>
                      }
                      className="border-slate-200"
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
                            {
                              title: 'Director Name',
                              dataIndex: 'name',
                              key: 'name',
                              render: (t, rec: any) => (
                                <Space size={6}>
                                  <span className="font-semibold text-slate-800">{t}</span>
                                  {rec.isContactPerson && (
                                    <Tag color="blue" className="text-[10px] m-0">
                                      Contact Person
                                    </Tag>
                                  )}
                                </Space>
                              ),
                            },
                            { title: 'Designation', dataIndex: 'designation', key: 'designation' },
                            { title: 'Mobile', dataIndex: 'mobileNo', key: 'mobileNo', render: (v) => v || '-' },
                            { title: 'Email', dataIndex: 'email', key: 'email', render: (e) => e ? <a href={`mailto:${e}`} className="text-blue-600">{e}</a> : '-' },
                            {
                              title: 'Appointed',
                              dataIndex: 'appointedDate',
                              key: 'appointedDate',
                              render: (d) => d ? dayjs(d).format('MMM DD, YYYY') : '-',
                            },
                            {
                              title: 'Status',
                              dataIndex: 'isActive',
                              key: 'isActive',
                              render: (active) => (
                                <Tag color={active !== false ? 'processing' : 'default'}>
                                  {active !== false ? 'Active' : 'Resigned'}
                                </Tag>
                              ),
                            },
                          ]}
                        />
                      )}
                    </Card>

                    {/* Management Team Members */}
                    <Card
                      size="small"
                      title={
                        <div className="flex items-center justify-between">
                          <Space className="font-semibold text-slate-800 text-xs">
                            <UsergroupAddOutlined className="text-emerald-600" />
                            <span>Management Team & Key Operational Personnel</span>
                          </Space>
                          <Tag color="green">{managementMembers.length}</Tag>
                        </div>
                      }
                      className="border-slate-200"
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
                            { title: 'Personnel Name', dataIndex: 'name', key: 'name', render: (t) => <span className="font-semibold text-slate-800">{t}</span> },
                            { title: 'Designation', dataIndex: 'designation', key: 'designation' },
                            { title: 'Department', dataIndex: 'department', key: 'department' },
                            { title: 'Mobile', dataIndex: 'mobileNo', key: 'mobileNo' },
                            { title: 'Email', dataIndex: 'email', key: 'email', render: (e) => e ? <a href={`mailto:${e}`} className="text-blue-600">{e}</a> : '-' }
                          ]}
                        />
                      )}
                    </Card>

                    {/* Other Important Audit & Compliance Information */}
                    <Card
                      size="small"
                      title={
                        <div className="flex items-center justify-between">
                          <Space className="font-semibold text-slate-800 text-xs">
                            <InfoCircleOutlined className="text-blue-600" />
                            <span>Other Important Information</span>
                            <Tag color="blue">{otherInfos.length}</Tag>
                          </Space>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setEditingOtherInfo(null);
                              otherInfoForm.resetFields();
                              setOtherInfoModalOpen(true);
                            }}
                          >
                            Add Info
                          </Button>
                        </div>
                      }
                      className="border-slate-200"
                    >
                      {otherInfos.length === 0 ? (
                        <div className="text-slate-400 italic text-xs py-3 text-center">
                          No additional audit notes, share capital, or statutory particulars recorded yet.
                        </div>
                      ) : (
                        <Table
                          dataSource={otherInfos}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          columns={[
                            { title: 'Particular', dataIndex: 'particular', key: 'particular', width: 220, render: (t) => <span className="font-semibold text-slate-800">{t}</span> },
                            { title: 'Details', dataIndex: 'description', key: 'description', render: (t) => t || '-' },
                            {
                              title: 'Actions',
                              key: 'actions',
                              width: 90,
                              align: 'right' as const,
                              render: (_: any, rec: any) => (
                                <Space size="small">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined className="text-slate-500" />}
                                    onClick={() => {
                                      setEditingOtherInfo(rec);
                                      otherInfoForm.setFieldsValue({
                                        particular: rec.particular,
                                        description: rec.description,
                                      });
                                      setOtherInfoModalOpen(true);
                                    }}
                                  />
                                  <Popconfirm
                                    title="Delete this record?"
                                    onConfirm={() => deleteOtherInfoMutation.mutate(rec.id)}
                                    okText="Delete"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                  </Popconfirm>
                                </Space>
                              ),
                            },
                          ]}
                        />
                      )}
                    </Card>
                  </Space>
                )
              },
              {
                key: 'projects',
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <ProjectOutlined />
                    Projects ({projectList.length})
                  </span>
                ),
                children: (
                  <div className="pt-1">
                    <ClientProjects clientId={id!} clientName={client.name} />
                  </div>
                )
              },
              {
                key: 'reports',
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileTextOutlined />
                    Reports ({reportsCount})
                  </span>
                ),
                children: (
                  <div className="pt-1">
                    <ClientReportsTab clientId={id!} clientName={client.name} />
                  </div>
                )
              },
              {
                key: 'licenses',
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileDoneOutlined />
                    Licenses ({licenses.length})
                  </span>
                ),
                children: (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-3">
                      <Text type="secondary" className="text-xs">
                        Track statutory registrations, operating licenses, and automated renewal reminders.
                      </Text>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingLicense(null);
                          licenseForm.resetFields();
                          licenseForm.setFieldsValue({ reminderDaysBefore: 30, frequencyOfRenewal: 'every_year' });
                          setLicenseModalOpen(true);
                        }}
                      >
                        Add License
                      </Button>
                    </div>
                    {licenses.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span className="text-slate-500 text-xs">No statutory registrations or operating licenses added yet.</span>}
                      />
                    ) : (
                      <Table
                        dataSource={licenses}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered
                        columns={[
                          {
                            title: 'Authority',
                            dataIndex: 'statutoryAuthority',
                            key: 'authority',
                            render: (t, rec: any) => (
                              <div>
                                <div className="font-semibold text-slate-800">{t || rec.licensingAuthority || '-'}</div>
                                {rec.notes && <div className="text-[11px] text-slate-400">{rec.notes}</div>}
                              </div>
                            ),
                          },
                          {
                            title: 'License / Reg. No.',
                            dataIndex: 'registrationLicenseNo',
                            key: 'regNo',
                            render: (t, rec: any) => <span className="font-mono text-slate-700">{t || rec.registrationOrLicenseNo || '-'}</span>,
                          },
                          {
                            title: 'Issue Date',
                            dataIndex: 'dateOfIssue',
                            key: 'issueDate',
                            render: (d) => (d ? dayjs(d).format('MMM DD, YYYY') : '-'),
                          },
                          {
                            title: 'Expiry & Status',
                            dataIndex: 'validDate',
                            key: 'validDate',
                            render: (d, rec: any) => {
                              if (!d) return '-';
                              const daysLeft = dayjs(d).startOf('day').diff(dayjs().startOf('day'), 'day');
                              const threshold = rec.reminderDaysBefore ?? 30;
                              let badge = <Tag color="success">Valid ({daysLeft}d left)</Tag>;
                              if (rec.frequencyOfRenewal === 'renewal_not_required') {
                                badge = <Tag color="blue">No Renewal Needed</Tag>;
                              } else if (daysLeft < 0) {
                                badge = <Tag color="error">Expired {Math.abs(daysLeft)}d ago</Tag>;
                              } else if (daysLeft <= threshold) {
                                badge = <Tag color="warning">Renew in {daysLeft}d</Tag>;
                              }
                              return (
                                <Space size={6} wrap>
                                  <span>{dayjs(d).format('MMM DD, YYYY')}</span>
                                  {badge}
                                </Space>
                              );
                            },
                          },
                          {
                            title: 'Renewal & Reminder',
                            key: 'frequency',
                            render: (_: any, rec: any) => (
                              <Space size={4} wrap>
                                {rec.frequencyOfRenewal && (
                                  <Tag color="blue">{formatText(rec.frequencyOfRenewal)}</Tag>
                                )}
                                {rec.frequencyOfRenewal !== 'renewal_not_required' && (
                                  <span className="text-[11px] text-slate-500">
                                    Remind {rec.reminderDaysBefore ?? 30}d before
                                  </span>
                                )}
                              </Space>
                            ),
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            width: 90,
                            align: 'right' as const,
                            render: (_: any, rec: any) => (
                              <Space size="small">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined className="text-slate-500" />}
                                  onClick={() => {
                                    setEditingLicense(rec);
                                    licenseForm.setFieldsValue({
                                      statutoryAuthority: rec.statutoryAuthority,
                                      registrationLicenseNo: rec.registrationLicenseNo,
                                      dateOfIssue: rec.dateOfIssue ? dayjs(rec.dateOfIssue) : null,
                                      validDate: rec.validDate ? dayjs(rec.validDate) : null,
                                      frequencyOfRenewal: rec.frequencyOfRenewal,
                                      reminderDaysBefore: rec.reminderDaysBefore ?? 30,
                                      notes: rec.notes,
                                    });
                                    setLicenseModalOpen(true);
                                  }}
                                />
                                <Popconfirm
                                  title="Delete this license?"
                                  onConfirm={() => deleteLicenseMutation.mutate(rec.id)}
                                  okText="Delete"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    )}
                  </div>
                )
              },
              {
                key: 'portal',
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <KeyOutlined />
                    {canManagePortalCredentials ? `Portal & IRD (${usersCount + credsCount})` : `Portal Users (${usersCount})`}
                  </span>
                ),
                children: (
                  <div className="pt-1 space-y-4">
                    {/* Official Government & IRD Portal Credentials: Super Admin & Administrator Only */}
                    {canManagePortalCredentials && (
                      <PortalCredentialsForm
                        clientId={id!}
                        clientPan={client.panNo}
                        clientName={client.name}
                        readOnly={false}
                      />
                    )}

                    {/* Client Portal Users & Report Access */}
                    <ClientUsersTab
                      clientId={id!}
                      clientName={client.name}
                    />
                  </div>
                )
              },
              {
                key: 'banking',
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <BankOutlined />
                    Banking
                  </span>
                ),
                children: (
                  <div className="pt-1">
                    <Card size="small" className="border-slate-200">
                      {client.bankName || client.bankAccountNumber ? (
                        <Row gutter={[20, 12]}>
                          <Col xs={24} sm={8}>
                            <Text type="secondary" className="text-[11px] uppercase font-medium">Bank Name</Text>
                            <div className="font-semibold text-slate-800 text-sm mt-0.5">
                              {client.bankName || '-'}
                            </div>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Text type="secondary" className="text-[11px] uppercase font-medium">Account Number</Text>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {client.bankAccountNumber || '-'}
                              </span>
                              {client.bankAccountNumber && (
                                <Tooltip title={copiedAccount ? 'Copied!' : 'Copy Account Number'}>
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={copiedAccount ? <CheckOutlined className="text-green-600 text-xs" /> : <CopyOutlined className="text-slate-400 text-xs" />}
                                    onClick={handleCopyAccount}
                                  />
                                </Tooltip>
                              )}
                            </div>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Text type="secondary" className="text-[11px] uppercase font-medium">Branch</Text>
                            <div className="font-semibold text-slate-800 text-sm mt-0.5">
                              {client.bankBranch || '-'}
                            </div>
                          </Col>
                        </Row>
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={<span className="text-slate-400 text-xs">No banking or settlement account details configured.</span>}
                        />
                      )}
                    </Card>
                  </div>
                )
              },
              {
                key: 'timeline',
                label: (
                  <span className="flex items-center gap-1.5 font-medium">
                    <ClockCircleOutlined />
                    Timeline
                  </span>
                ),
                children: (
                  <div className="pt-1">
                    <ClientTimelineTab clientId={id!} clientName={client.name} />
                  </div>
                )
              }
            ]}
          />
        </div>
      </Card>

      <Modal
        open={boardModalOpen}
        title={`Add Board Member — ${client.name}`}
        onCancel={() => setBoardModalOpen(false)}
        onOk={() => {
          boardForm.validateFields().then((values) => {
            addBoardMutation.mutate({
              name: values.name,
              designation: values.designation,
              mobileNo: values.mobileNo,
              email: values.email,
              appointedDate: values.appointedDate
                ? values.appointedDate.format('YYYY-MM-DD')
                : undefined,
              isActive: values.isActive !== false,
              isContactPerson: Boolean(values.isContactPerson),
            });
          });
        }}
        confirmLoading={addBoardMutation.isPending}
        okText="Save Member"
        destroyOnClose
      >
        <Form form={boardForm} layout="vertical" className="pt-2">
          <Form.Item
            name="name"
            label="Director / Partner Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="designation"
            label="Designation"
            rules={[{ required: true, message: 'Please enter designation' }]}
          >
            <Input placeholder="e.g. Managing Director, Chairman" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="mobileNo" label="Mobile No.">
                <Input placeholder="98XXXXXXXX" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Invalid email' }]}
              >
                <Input placeholder="email@company.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="appointedDate"
                label="Appointed Date (Supports Past Dates)"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isContactPerson"
                label="Set as Primary Contact Person"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Add / Edit License Modal */}
      <Modal
        open={licenseModalOpen}
        title={editingLicense ? `Edit License — ${client.name}` : `Add License — ${client.name}`}
        onCancel={() => {
          setLicenseModalOpen(false);
          setEditingLicense(null);
        }}
        onOk={() => {
          licenseForm.validateFields().then((values) => {
            saveLicenseMutation.mutate({
              statutoryAuthority: values.statutoryAuthority,
              registrationLicenseNo: values.registrationLicenseNo,
              dateOfIssue: values.dateOfIssue ? values.dateOfIssue.format('YYYY-MM-DD') : undefined,
              validDate: values.validDate ? values.validDate.format('YYYY-MM-DD') : undefined,
              frequencyOfRenewal: values.frequencyOfRenewal,
              reminderDaysBefore: values.reminderDaysBefore ?? 30,
              notes: values.notes,
            });
          });
        }}
        confirmLoading={saveLicenseMutation.isPending}
        okText={editingLicense ? 'Update License' : 'Save License'}
        destroyOnClose
      >
        <Form form={licenseForm} layout="vertical" className="pt-2">
          <Form.Item
            name="statutoryAuthority"
            label="Statutory / Licensing Authority"
            rules={[{ required: true, message: 'Please enter authority name' }]}
          >
            <Input placeholder="e.g. Office of Company Registrar, Municipality, EXIM" />
          </Form.Item>
          <Form.Item name="registrationLicenseNo" label="Registration / License Number">
            <Input placeholder="e.g. REG-2081-0452" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="dateOfIssue" label="Date of Issue">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validDate" label="Valid / Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="frequencyOfRenewal" label="Renewal Frequency">
                <Select
                  placeholder="Select frequency"
                  options={[
                    { value: 'every_year', label: 'Every Year' },
                    { value: 'every_3_years', label: 'Every 3 Years' },
                    { value: 'every_5_years', label: 'Every 5 Years' },
                    { value: 'more_than_5_years', label: 'More than 5 Years' },
                    { value: 'renewal_not_required', label: 'Renewal Not Required' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="reminderDaysBefore"
                label="Remind Before (Days)"
                initialValue={30}
              >
                <InputNumber min={0} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional renewal instructions or document notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add / Edit Other Important Info Modal */}
      <Modal
        open={otherInfoModalOpen}
        title={editingOtherInfo ? `Edit Information — ${client.name}` : `Add Important Information — ${client.name}`}
        onCancel={() => {
          setOtherInfoModalOpen(false);
          setEditingOtherInfo(null);
        }}
        onOk={() => {
          otherInfoForm.validateFields().then((values) => {
            saveOtherInfoMutation.mutate({
              particular: values.particular,
              description: values.description,
            });
          });
        }}
        confirmLoading={saveOtherInfoMutation.isPending}
        okText={editingOtherInfo ? 'Update' : 'Save'}
        destroyOnClose
      >
        <Form form={otherInfoForm} layout="vertical" className="pt-2">
          <Form.Item
            name="particular"
            label="Particular / Title"
            rules={[{ required: true, message: 'Please enter particular' }]}
          >
            <Input placeholder="e.g. Authorized Share Capital, Previous Auditor, Special Terms" />
          </Form.Item>
          <Form.Item name="description" label="Details">
            <Input.TextArea rows={3} placeholder="Enter relevant details for audit and compliance teams" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientView;

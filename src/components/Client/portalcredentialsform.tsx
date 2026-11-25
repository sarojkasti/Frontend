import React, { useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Table,
  Space,
  Switch,
  Tooltip,
  AutoComplete,
  Tag,
  Typography,
  message,
  Empty,
  Card
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  CheckOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { usePortalCredentials } from '@/hooks/client/usePortalCredentials';
import { useCreatePortalCredential } from '@/hooks/client/useCreatePortalCredential';
import { useUpdatePortalCredential } from '@/hooks/client/useUpdatePortalCredential';
import { useDeletePortalCredential } from '@/hooks/client/useDeletePortalCredential';

const { Text } = Typography;

interface PortalCredentialFormProps {
  clientId: string;
  clientPan?: string;
  clientName?: string;
  readOnly?: boolean;
}

const PORTAL_PRESETS = [
  {
    name: "IRD Portal (Inland Revenue PAN)",
    website: "https://taxpayerportal.ird.gov.np",
    tag: "IRD PAN",
    color: "blue"
  },
  {
    name: "OCR Portal (Office of Company Registrar)",
    website: "https://ocr.gov.np",
    tag: "OCR",
    color: "purple"
  },
  {
    name: "SSF Portal (Social Security Fund)",
    website: "https://ssf.gov.np",
    tag: "SSF",
    color: "green"
  },
  {
    name: "Customs Portal (Department of Customs)",
    website: "https://customs.gov.np",
    tag: "Customs",
    color: "cyan"
  },
  {
    name: "Client Self-Service Portal",
    website: "",
    tag: "Portal",
    color: "geekblue"
  }
];

const PortalCredentialsForm: React.FC<PortalCredentialFormProps> = ({
  clientId,
  clientPan,
  clientName,
  readOnly = false
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCredential, setEditingCredential] = useState<any>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: portalCredentials, isLoading } = usePortalCredentials(clientId);
  const createMutation = useCreatePortalCredential(clientId);
  const updateMutation = useUpdatePortalCredential(clientId, editingCredential?.id || '');
  const deleteMutation = useDeletePortalCredential(clientId);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    message.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const showAddModal = (preset?: typeof PORTAL_PRESETS[0]) => {
    form.resetFields();
    setEditingCredential(null);

    if (preset) {
      form.setFieldsValue({
        portalName: preset.name,
        website: preset.website,
        loginUser: preset.name.includes("IRD") && clientPan ? clientPan : "",
        status: true
      });
    } else {
      form.setFieldsValue({
        status: true
      });
    }

    setIsModalVisible(true);
  };

  const showEditModal = (record: any) => {
    form.setFieldsValue({
      portalName: record.portalName,
      loginUser: record.loginUser,
      password: record.password,
      website: record.website,
      description: record.description,
      status: record.status === 'active'
    });
    setEditingCredential(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const payload = {
        ...values,
        status: values.status ? 'active' : 'inactive'
      };

      if (editingCredential) {
        updateMutation.mutate(payload, {
          onSuccess: () => {
            message.success('Credential updated successfully');
            setIsModalVisible(false);
            form.resetFields();
          },
          onError: () => {
            message.error('Failed to update credential');
          }
        });
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => {
            message.success('Credential added successfully');
            setIsModalVisible(false);
            form.resetFields();
          },
          onError: () => {
            message.error('Failed to add credential');
          }
        });
      }
    });
  };

  const handleDelete = (credentialId: string, name: string) => {
    Modal.confirm({
      title: `Delete credential for ${name}?`,
      content: 'This will remove stored credentials from the secure database.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteMutation.mutate(credentialId, {
          onSuccess: () => message.success('Credential deleted'),
          onError: () => message.error('Failed to delete credential')
        });
      }
    });
  };

  const getPortalTag = (name?: string) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (lower.includes('ird') || lower.includes('pan')) return <Tag color="blue">IRD PAN</Tag>;
    if (lower.includes('ocr') || lower.includes('company registrar')) return <Tag color="purple">OCR</Tag>;
    if (lower.includes('ssf') || lower.includes('social security')) return <Tag color="green">SSF</Tag>;
    if (lower.includes('customs') || lower.includes('exim')) return <Tag color="cyan">Customs</Tag>;
    return <Tag color="geekblue">Portal</Tag>;
  };

  const columns = [
    {
      title: 'Portal / Authority',
      key: 'portalName',
      width: 240,
      render: (_: any, record: any) => (
        <div>
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
            {getPortalTag(record.portalName)}
            <span className="text-xs">{record.portalName}</span>
          </div>
          {record.description && (
            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]" title={record.description}>
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Portal Website',
      dataIndex: 'website',
      key: 'website',
      width: 180,
      render: (text: string) =>
        text ? (
          <a
            href={text.startsWith('http') ? text : `https://${text}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs truncate max-w-[170px]"
            title={text}
          >
            <GlobalOutlined className="text-slate-400 text-xs shrink-0" />
            <span className="truncate">{text.replace(/^https?:\/\//, '')}</span>
          </a>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )
    },
    {
      title: 'Login Username',
      key: 'loginUser',
      width: 170,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-slate-800 text-xs">
            {record.loginUser || '-'}
          </span>
          {record.loginUser && (
            <Tooltip title={copiedKey === `user-${record.id}` ? 'Copied!' : 'Copy Username'}>
              <Button
                type="text"
                size="small"
                icon={
                  copiedKey === `user-${record.id}` ? (
                    <CheckOutlined className="text-green-600 text-[11px]" />
                  ) : (
                    <CopyOutlined className="text-slate-400 text-[11px]" />
                  )
                }
                onClick={() => handleCopy(record.loginUser, `user-${record.id}`, 'Username')}
                className="p-0 h-4 w-4"
              />
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: 'Password',
      key: 'password',
      width: 180,
      render: (_: any, record: any) => {
        const isVisible = !!visiblePasswords[record.id];
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-slate-700">
              {isVisible ? record.password : '••••••••••••'}
            </span>
            <Tooltip title={isVisible ? 'Hide Password' : 'Show Password'}>
              <Button
                type="text"
                size="small"
                icon={
                  isVisible ? (
                    <EyeInvisibleOutlined className="text-slate-500 text-xs" />
                  ) : (
                    <EyeOutlined className="text-slate-400 text-xs" />
                  )
                }
                onClick={() => togglePasswordVisibility(record.id)}
                className="p-0 h-4 w-4"
              />
            </Tooltip>
            {record.password && (
              <Tooltip title={copiedKey === `pass-${record.id}` ? 'Copied!' : 'Copy Password'}>
                <Button
                  type="text"
                  size="small"
                  icon={
                    copiedKey === `pass-${record.id}` ? (
                      <CheckOutlined className="text-green-600 text-[11px]" />
                    ) : (
                      <CopyOutlined className="text-slate-400 text-[11px]" />
                    )
                  }
                  onClick={() => handleCopy(record.password, `pass-${record.id}`, 'Password')}
                  className="p-0 h-4 w-4"
                />
              </Tooltip>
            )}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'} className="rounded-full text-[11px]">
          {status === 'active' ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: any) =>
        !readOnly ? (
          <Space size="small">
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined className="text-slate-500 hover:text-blue-600" />}
                onClick={() => showEditModal(record)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined className="text-red-500 hover:text-red-700" />}
                onClick={() => handleDelete(record.id, record.portalName)}
                size="small"
              />
            </Tooltip>
          </Space>
        ) : null
    }
  ];

  const displayColumns = readOnly ? columns.filter(col => col.key !== 'action') : columns;
  const credentialsList = Array.isArray(portalCredentials) ? portalCredentials : [];

  return (
    <Card size="small" className="border-slate-200 rounded-lg">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <KeyOutlined className="text-amber-500 text-sm" />
            <span className="font-semibold text-slate-800 text-xs sm:text-sm">
              Official Government & Taxpayer Portals ({credentialsList.length})
            </span>
          </div>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Secure login credentials for IRD PAN, OCR, SSF, and Customs compliance portals used for tax returns and filings.
          </p>
        </div>

        {!readOnly && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showAddModal()}
            size="small"
            className="self-start sm:self-center"
          >
            Add Credential
          </Button>
        )}
      </div>

      {/* Quick Setup Presets Bar (Shown when credentials list is small or empty) */}
      {!readOnly && (
        <div className="my-3 p-2 bg-slate-50/90 rounded border border-slate-200/70 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <SafetyCertificateOutlined className="text-blue-500" />
            Quick Setup:
          </span>
          {PORTAL_PRESETS.slice(0, 3).map(preset => (
            <Button
              key={preset.name}
              size="small"
              onClick={() => showAddModal(preset)}
              className="text-xs text-slate-700 hover:text-blue-600 bg-white"
            >
              + {preset.tag} {preset.tag === 'IRD PAN' && clientPan ? `(${clientPan})` : ''}
            </Button>
          ))}
        </div>
      )}

      {/* Table or Informative Empty State */}
      {credentialsList.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-1.5 py-1">
              <div className="text-slate-700 font-medium text-xs">
                No official government or IRD portal credentials registered yet
              </div>
              <div className="text-slate-400 text-xs max-w-md mx-auto">
                Save login details for Inland Revenue (IRD), Office of Company Registrar (OCR), or Social Security Fund (SSF) to streamline tax filings and compliances.
              </div>
            </div>
          }
        >
          {!readOnly && (
            <Space className="mt-1">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => showAddModal(PORTAL_PRESETS[0])}
              >
                Add IRD PAN Login {clientPan ? `(${clientPan})` : ''}
              </Button>
              <Button
                size="small"
                onClick={() => showAddModal(PORTAL_PRESETS[1])}
              >
                Add OCR Login
              </Button>
            </Space>
          )}
        </Empty>
      ) : (
        <Table
          loading={isLoading}
          dataSource={credentialsList}
          columns={displayColumns}
          rowKey="id"
          pagination={false}
          size="small"
          className="mt-2"
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        title={editingCredential ? 'Edit Portal / IRD Credential' : 'Add Government / Portal Credential'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
          >
            {editingCredential ? 'Update Credential' : 'Save Credential'}
          </Button>
        ]}
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item
            name="portalName"
            label="Portal Name & Authority"
            rules={[{ required: true, message: 'Please select or enter portal name' }]}
          >
            <AutoComplete
              options={PORTAL_PRESETS.map(p => ({
                value: p.name,
                label: (
                  <div className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <Tag color={p.color}>{p.tag}</Tag>
                  </div>
                )
              }))}
              placeholder="e.g. IRD Portal (Inland Revenue PAN)"
              onSelect={(value) => {
                const found = PORTAL_PRESETS.find(p => p.value === value || p.name === value);
                if (found) {
                  if (found.website) form.setFieldsValue({ website: found.website });
                  if (found.name.includes('IRD') && clientPan) {
                    form.setFieldsValue({ loginUser: clientPan });
                  }
                }
              }}
            />
          </Form.Item>

          <Form.Item name="website" label="Portal Website URL">
            <Input placeholder="https://taxpayerportal.ird.gov.np" prefix={<GlobalOutlined className="text-slate-400" />} />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="loginUser"
              label="Login Username / PAN"
              rules={[{ required: true, message: 'Please enter login username or PAN' }]}
              extra={clientPan ? <span className="text-[11px] text-slate-400">Client PAN: {clientPan}</span> : undefined}
            >
              <Input placeholder="Username or PAN" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter portal password' }]}
            >
              <Input.Password placeholder="Portal Password" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Notes / Filing Instructions">
            <Input.TextArea rows={2} placeholder="Optional notes (e.g. monthly VAT filing token, contact person)" />
          </Form.Item>

          <Form.Item name="status" label="Active Status" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PortalCredentialsForm;

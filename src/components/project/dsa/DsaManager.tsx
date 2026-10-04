import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Tag,
  Space,
  message,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Alert,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDsaByProject,
  createDsa,
  approveDsa,
  rejectDsa,
  settleDsa,
  verifyDsa,
} from '../../../service/dsa.service';
import { useSession } from '../../../context/SessionContext';
import useIsMobile from '../../../hooks/useIsMobile';
import { ResponsiveTable } from '../../ui/MobileCardList';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface DsaManagerProps {
  projectId: string;
  projectUsers: any[];
  isSignedOff: boolean;
}

interface ExpenseItemRow {
  category: string;
  expenseDate: string;
  amount: number;
  receiptNumber?: string;
  remarks?: string;
}

const DsaManager = ({ projectId, projectUsers, isSignedOff }: DsaManagerProps) => {
  const { isMobile } = useIsMobile();
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedDsa, setSelectedDsa] = useState<any>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  // Itemized expenses for settlement
  const [expenseRows, setExpenseRows] = useState<ExpenseItemRow[]>([
    {
      category: 'lodging',
      expenseDate: dayjs().format('YYYY-MM-DD'),
      amount: 0,
      receiptNumber: '',
      remarks: '',
    },
  ]);

  const [form] = Form.useForm();
  const [settleForm] = Form.useForm();
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const { data: dsas, isLoading } = useQuery({
    queryKey: ['dsa', projectId],
    queryFn: () => getDsaByProject(projectId),
  });

  const createMutation = useMutation({
    mutationFn: createDsa,
    onSuccess: () => {
      message.success('DSA requested successfully');
      setIsRequestModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['dsa', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to request DSA');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => approveDsa(selectedDsa.id, data),
    onSuccess: () => {
      message.success('DSA approved successfully');
      setIsApproveModalOpen(false);
      approveForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['dsa', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to approve DSA');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: any) => rejectDsa(selectedDsa.id, data),
    onSuccess: () => {
      message.success('DSA rejected successfully');
      setIsRejectModalOpen(false);
      rejectForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['dsa', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to reject DSA');
    },
  });

  const settleMutation = useMutation({
    mutationFn: (data: any) => settleDsa(selectedDsa.id, data),
    onSuccess: () => {
      message.success('DSA settled successfully');
      setIsSettleModalOpen(false);
      settleForm.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['dsa', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to settle DSA');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyDsa(id),
    onSuccess: () => {
      message.success('DSA verified successfully');
      setIsVerifyModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['dsa', projectId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to verify DSA');
    },
  });

  const getFilteredUsers = () => {
    const roleName = (profile?.role as any)?.name;
    if (!roleName) return [];
    const role = roleName.toLowerCase();

    if (role === 'superuser' || role === 'admin' || role === 'administrator') return projectUsers;

    return projectUsers.filter((user) => {
      const targetRole = user.role?.name?.toLowerCase();
      if (!targetRole) return false;

      if (role === 'projectmanager') {
        return ['projectmanager', 'teamlead', 'auditsenior', 'auditjunior'].includes(targetRole);
      }
      if (role === 'teamlead') {
        return ['teamlead', 'auditsenior', 'auditjunior'].includes(targetRole);
      }
      if (role === 'auditsenior') {
        return ['auditsenior', 'auditjunior'].includes(targetRole);
      }
      if (role === 'auditjunior') {
        return user.id === profile?.id;
      }
      return false;
    });
  };

  const filteredUsers = getFilteredUsers();

  const handleRequest = (values: any) => {
    // Generate UUID idempotency key to prevent double submissions
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    createMutation.mutate({
      ...values,
      projectId,
      idempotencyKey,
    });
  };

  const handleApprove = (values: any) => {
    approveMutation.mutate(values);
  };

  const handleReject = (values: any) => {
    rejectMutation.mutate(values);
  };

  // Calculate sum of itemized expenses
  const totalItemizedCost = expenseRows.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const approvedAdvance = selectedDsa
    ? Number(selectedDsa.advanceApprovedAmount || selectedDsa.approvedAmount || 0)
    : 0;
  const netDifference = totalItemizedCost - approvedAdvance;

  const handleSettle = (values: any) => {
    const formData = new FormData();
    const finalAmount = totalItemizedCost > 0 ? totalItemizedCost : values.settlementAmount;
    formData.append('settlementAmount', String(finalAmount));
    formData.append('billDetails', values.billDetails || '');

    // Include itemized expenses
    if (expenseRows.length > 0 && totalItemizedCost > 0) {
      formData.append('expenseItems', JSON.stringify(expenseRows));
    }

    if (fileList.length > 0) {
      formData.append('file', fileList[0].originFileObj);
    }

    settleMutation.mutate(formData);
  };

  const addExpenseRow = () => {
    setExpenseRows([
      ...expenseRows,
      {
        category: 'lodging',
        expenseDate: dayjs().format('YYYY-MM-DD'),
        amount: 0,
        receiptNumber: '',
        remarks: '',
      },
    ]);
  };

  const removeExpenseRow = (index: number) => {
    setExpenseRows(expenseRows.filter((_, i) => i !== index));
  };

  const updateExpenseRow = (index: number, field: keyof ExpenseItemRow, val: any) => {
    const updated = [...expenseRows];
    updated[index] = { ...updated[index], [field]: val };
    setExpenseRows(updated);
  };

  const columns = [
    {
      title: 'Requester',
      dataIndex: ['requester', 'username'],
      key: 'requester',
      render: (_: string, record: any) =>
        record.requester?.name || record.requester?.username || '—',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type ? type.toUpperCase() : 'OTHER'}</Tag>,
    },
    {
      title: 'Advance Req.',
      dataIndex: 'requestedAmount',
      key: 'requestedAmount',
      render: (amt: number) => `NRs. ${amt}`,
    },
    {
      title: 'Advance Appr.',
      dataIndex: 'approvedAmount',
      key: 'approvedAmount',
      render: (amt: number) => (amt !== null && amt !== undefined ? `NRs. ${amt}` : '—'),
    },
    {
      title: 'Actual Claimed',
      dataIndex: 'totalClaimedAmount',
      key: 'totalClaimedAmount',
      render: (amt: number, record: any) => {
        const val = amt !== null && amt !== undefined ? amt : record.settlementAmount;
        return val ? `NRs. ${val}` : '—';
      },
    },
    {
      title: 'Net Settlement',
      dataIndex: 'netSettlementAmount',
      key: 'netSettlementAmount',
      render: (net: number, record: any) => {
        if (record.status !== 'settled' && record.status !== 'verified') {
          return <span style={{ color: '#8c8c8c' }}>Pending Settle</span>;
        }
        if (net === null || net === undefined) {
          const claimed = record.totalClaimedAmount || record.settlementAmount || 0;
          const advance = record.advanceApprovedAmount || record.approvedAmount || 0;
          net = claimed - advance;
        }

        if (net > 0) {
          return <Tag color="green">+NRs. {net} (Reimburse)</Tag>;
        } else if (net < 0) {
          return <Tag color="volcano">-NRs. {Math.abs(net)} (Refund)</Tag>;
        } else {
          return <Tag color="default">Exact (NRs. 0)</Tag>;
        }
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = status.toUpperCase();
        if (status === 'approved') color = 'green';
        if (status === 'rejected') color = 'red';
        if (status === 'settled') {
          color = 'orange';
          text = 'PENDING VERIFICATION';
        }
        if (status === 'verified') color = 'purple';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => {
        const userRole = (profile?.role as any)?.name?.toLowerCase();
        const isProjectLead = record?.project?.projectLead?.id === profile?.id;
        const isProjectManager = record?.project?.projectManager?.id === profile?.id;
        const isAdminOrManager =
          userRole === 'superuser' ||
          userRole === 'projectmanager' ||
          userRole === 'administrator' ||
          userRole === 'admin' ||
          isProjectLead ||
          isProjectManager;

        return (
          <Space size="small">
            {/* Admin/Manager Actions */}
            {isAdminOrManager && record.status === 'requested' && !isSignedOff && (
              <>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    setSelectedDsa(record);
                    setIsApproveModalOpen(true);
                    approveForm.setFieldsValue({ approvedAmount: record.requestedAmount });
                  }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => {
                    setSelectedDsa(record);
                    setIsRejectModalOpen(true);
                  }}
                >
                  Reject
                </Button>
              </>
            )}

            {/* Requester Actions */}
            {record.requester?.id === profile?.id &&
              record.status === 'approved' &&
              !isSignedOff && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    setSelectedDsa(record);
                    setIsSettleModalOpen(true);
                    setFileList([]);
                    setExpenseRows([
                      {
                        category: record.type === 'transport' ? 'transport' : 'lodging',
                        expenseDate: dayjs().format('YYYY-MM-DD'),
                        amount: Number(record.approvedAmount) || 0,
                        receiptNumber: '',
                        remarks: '',
                      },
                    ]);
                    settleForm.setFieldsValue({
                      settlementAmount: record.approvedAmount,
                      billDetails: '',
                    });
                  }}
                >
                  Settle
                </Button>
              )}

            {/* Admin/Manager Verify */}
            {isAdminOrManager && record.status === 'settled' && !isSignedOff && (
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setSelectedDsa(record);
                  setIsVerifyModalOpen(true);
                }}
              >
                Verify
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        {!isSignedOff && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsRequestModalOpen(true)}>
            Request DSA
          </Button>
        )}
      </div>

      <ResponsiveTable
        loading={isLoading}
        columns={columns}
        dataSource={dsas || []}
        rowKey="id"
        expandable={{
          expandedRowRender: (record: any) => (
            <div style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Description:</strong> {record.description || 'No description provided.'}
              </div>
              {record.adminRemarks && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Admin Remarks:</strong> {record.adminRemarks}
                </div>
              )}
              {record.billDetails && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Bill Summary:</strong> {record.billDetails}
                </div>
              )}

              {/* Itemized Expenses Table if available */}
              {record.expenseItems && record.expenseItems.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Itemized Receipts:</div>
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={record.expenseItems}
                    rowKey="id"
                    columns={[
                      {
                        title: 'Category',
                        dataIndex: 'category',
                        render: (c: string) => <Tag color="blue">{c?.toUpperCase()}</Tag>,
                      },
                      { title: 'Date', dataIndex: 'expenseDate' },
                      { title: 'Receipt #', dataIndex: 'receiptNumber' },
                      { title: 'Amount', dataIndex: 'amount', render: (a: number) => `NRs. ${a}` },
                      { title: 'Remarks', dataIndex: 'remarks' },
                    ]}
                  />
                </div>
              )}

              {record.billImage && (
                <div style={{ marginTop: 10 }}>
                  <strong>Attached Receipt:</strong>
                  <div style={{ marginTop: 4 }}>
                    <a
                      href={`${import.meta.env.VITE_BACKEND_URI}/${record.billImage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Receipt File
                    </a>
                  </div>
                </div>
              )}
            </div>
          ),
        }}
      />

      {/* Request Modal */}
      <Modal
        title="Request DSA (Daily Subsistence Allowance)"
        open={isRequestModalOpen}
        onCancel={() => setIsRequestModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Alert
          type="info"
          showIcon
          message="Daily Subsistence Allowance (DSA) creates an advance requisition for travel & site deployment."
          style={{ marginBottom: 16 }}
        />
        <Form form={form} onFinish={handleRequest} layout="vertical">
          <Form.Item
            name="userIds"
            label="Beneficiary Team Members"
            rules={[{ required: true, message: 'Please select at least one user' }]}
          >
            <Select mode="multiple" placeholder="Select users">
              {filteredUsers.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name || user.username} ({user.role?.name})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Allowance Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="lodging">Lodging</Option>
              <Option value="transport">Transport</Option>
              <Option value="both">Both (Lodging + Transport)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="requestedAmount"
            label="Advance Amount Requested (NRs.)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 5000" />
          </Form.Item>
          <Form.Item name="description" label="Trip Purpose & Location">
            <TextArea rows={3} placeholder="Describe site visit purpose, location, and dates..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        title="Approve DSA Requisition"
        open={isApproveModalOpen}
        onCancel={() => setIsApproveModalOpen(false)}
        onOk={() => approveForm.submit()}
        confirmLoading={approveMutation.isPending}
      >
        <Form form={approveForm} onFinish={handleApprove} layout="vertical">
          <Form.Item
            name="approvedAmount"
            label="Approved Advance Amount (NRs.)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="adminRemarks" label="Remarks">
            <TextArea rows={3} placeholder="Optional approver notes or instructions..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject DSA Requisition"
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={() => rejectForm.submit()}
        confirmLoading={rejectMutation.isPending}
      >
        <Form form={rejectForm} onFinish={handleReject} layout="vertical">
          <Form.Item name="adminRemarks" label="Reason for Rejection" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Please explain why this DSA is rejected..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Itemized Settle Modal */}
      <Modal
        title="Settle DSA Claim & Netting"
        width={720}
        open={isSettleModalOpen}
        onCancel={() => setIsSettleModalOpen(false)}
        onOk={() => settleForm.submit()}
        confirmLoading={settleMutation.isPending}
      >
        <Alert
          type="info"
          showIcon
          message={
            <div>
              <div>
                Approved Advance Paid: <b>NRs. {approvedAdvance}</b>
              </div>
              <div>
                Total Expenses Claimed: <b>NRs. {totalItemizedCost}</b>
              </div>
              <div style={{ marginTop: 4 }}>
                {netDifference > 0 ? (
                  <Tag color="green">
                    Company reimburses employee: NRs. {netDifference}
                  </Tag>
                ) : netDifference < 0 ? (
                  <Tag color="volcano">
                    Employee refunds to company: NRs. {Math.abs(netDifference)}
                  </Tag>
                ) : (
                  <Tag color="blue">Even Settlement: NRs. 0.00</Tag>
                )}
              </div>
            </div>
          }
          style={{ marginBottom: 16 }}
        />

        <Form form={settleForm} onFinish={handleSettle} layout="vertical">
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Itemized Expense Receipts:</span>
            <Button size="small" icon={<PlusOutlined />} onClick={addExpenseRow}>
              Add Receipt Item
            </Button>
          </div>

          {expenseRows.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '130px 130px 100px 120px 1fr 32px',
                gap: 8,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Select
                value={row.category}
                onChange={(val) => updateExpenseRow(idx, 'category', val)}
                size="small"
              >
                <Option value="lodging">Lodging</Option>
                <Option value="transport">Transport</Option>
                <Option value="meal">Meal</Option>
                <Option value="incidentals">Incidentals</Option>
                <Option value="other">Other</Option>
              </Select>

              <DatePicker
                size="small"
                value={dayjs(row.expenseDate)}
                onChange={(_, dateStr) => updateExpenseRow(idx, 'expenseDate', dateStr)}
              />

              <InputNumber
                size="small"
                min={0}
                placeholder="Amount"
                value={row.amount}
                onChange={(val) => updateExpenseRow(idx, 'amount', val || 0)}
              />

              <Input
                size="small"
                placeholder="Receipt #"
                value={row.receiptNumber}
                onChange={(e) => updateExpenseRow(idx, 'receiptNumber', e.target.value)}
              />

              <Input
                size="small"
                placeholder="Notes..."
                value={row.remarks}
                onChange={(e) => updateExpenseRow(idx, 'remarks', e.target.value)}
              />

              {expenseRows.length > 1 && (
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeExpenseRow(idx)}
                />
              )}
            </div>
          ))}

          <Divider style={{ margin: '14px 0' }} />

          <Form.Item name="billDetails" label="Settlement Notes / Remarks">
            <TextArea rows={2} placeholder="Optional overall remarks or explanations..." />
          </Form.Item>

          <Form.Item label="Upload Receipt / Bill Image">
            <Upload
              listType="picture"
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept="image/*,.pdf"
            >
              <Button icon={<UploadOutlined />}>Upload Bill Document</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Verify Modal */}
      <Modal
        title="Verify DSA Settlement"
        open={isVerifyModalOpen}
        onCancel={() => setIsVerifyModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsVerifyModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SafetyCertificateOutlined />}
            loading={verifyMutation.isPending}
            onClick={() => verifyMutation.mutate(selectedDsa?.id)}
          >
            Confirm & Complete Verification
          </Button>,
        ]}
      >
        {selectedDsa && (
          <div className="space-y-4">
            <div>
              <strong>Requester:</strong>{' '}
              {selectedDsa.requester?.name || selectedDsa.requester?.username}
            </div>
            <div>
              <strong>Approved Advance:</strong> NRs.{' '}
              {selectedDsa.advanceApprovedAmount || selectedDsa.approvedAmount}
            </div>
            <div>
              <strong>Total Expenses Claimed:</strong> NRs.{' '}
              {selectedDsa.totalClaimedAmount || selectedDsa.settlementAmount}
            </div>
            <div>
              <strong>Net Settlement:</strong>{' '}
              {selectedDsa.netSettlementAmount >= 0 ? (
                <Tag color="green">
                  Company reimburses employee: NRs. {selectedDsa.netSettlementAmount}
                </Tag>
              ) : (
                <Tag color="volcano">
                  Employee refunds to company: NRs.{' '}
                  {Math.abs(selectedDsa.netSettlementAmount)}
                </Tag>
              )}
            </div>
            {selectedDsa.billDetails && (
              <div>
                <strong>Bill Details:</strong>
                <p className="mt-1 p-2 bg-gray-50 rounded">{selectedDsa.billDetails}</p>
              </div>
            )}
            {selectedDsa.billImage && (
              <div>
                <strong>Bill Document:</strong>
                <div className="mt-2">
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URI}/${selectedDsa.billImage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Uploaded Bill Document
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DsaManager;

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Tag, Space, message, Form, Input, InputNumber, Select, DatePicker, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDsaByProject, createDsa, approveDsa, rejectDsa, settleDsa, verifyDsa } from '../../../service/dsa.service';
import { useSession } from '../../../context/SessionContext';
import { useParams } from 'react-router-dom';
import { useProject } from '../../../hooks/project/useProject';
import useIsMobile from '../../../hooks/useIsMobile';
import { ResponsiveTable } from '../../ui/MobileCardList';

const { TextArea } = Input;
const { Option } = Select;

interface DsaManagerProps {
  projectId: string;
  projectUsers: any[];
  isSignedOff: boolean;
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
    
    if (role === 'superuser') return projectUsers;

    return projectUsers.filter(user => {
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
    createMutation.mutate({ ...values, projectId });
  };

  const handleApprove = (values: any) => {
    approveMutation.mutate(values);
  };

  const handleReject = (values: any) => {
    rejectMutation.mutate(values);
  };

  const handleSettle = (values: any) => {
    const formData = new FormData();
    formData.append('settlementAmount', values.settlementAmount);
    formData.append('billDetails', values.billDetails);
    if (fileList.length > 0) {
      formData.append('file', fileList[0].originFileObj);
    }
    settleMutation.mutate(formData);
  };

  const columns = [
    {
      title: 'Requester',
      dataIndex: ['requester', 'username'], // Adjust based on user entity
      key: 'requester',
      render: (_: string, record: any) => record.requester?.name || record.requester?.username
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Requested Amount',
      dataIndex: 'requestedAmount',
      key: 'requestedAmount',
    },
    {
      title: 'Approved Amount',
      dataIndex: 'approvedAmount',
      key: 'approvedAmount',
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
        const isAdminOrManager = userRole === 'superuser' || userRole === 'projectmanager' || userRole === 'administrator' || isProjectLead || isProjectManager;
        
        return (
        <Space size="middle">
          {/* Admin/Manager Actions */}
          {isAdminOrManager && record.status === 'requested' && !isSignedOff && (
            <>
              <Button type="primary" size="small" onClick={() => { setSelectedDsa(record); setIsApproveModalOpen(true); approveForm.setFieldsValue({ approvedAmount: record.requestedAmount }); }}>Approve</Button>
              <Button danger size="small" onClick={() => { setSelectedDsa(record); setIsRejectModalOpen(true); }}>Reject</Button>
            </>
          )}
          
          {/* Requester Actions */}
          {record.requester?.id === profile?.id && record.status === 'approved' && !isSignedOff && (
            <Button type="primary" size="small" onClick={() => { setSelectedDsa(record); setIsSettleModalOpen(true); setFileList([]); }}>Settle</Button>
          )}

          {/* Admin/Manager Verify */}
          {isAdminOrManager && record.status === 'settled' && !isSignedOff && (
            <Button type="primary" size="small" onClick={() => { setSelectedDsa(record); setIsVerifyModalOpen(true); }}>Verify</Button>
          )}
        </Space>
      )},
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        {!isSignedOff && (
            <Button type="primary" onClick={() => setIsRequestModalOpen(true)}>
            Request DSA
            </Button>
        )}
      </div>
      <ResponsiveTable 
        columns={columns} 
        dataSource={dsas} 
        rowKey="id" 
        loading={isLoading}
        pagination={isMobile ? false : undefined}
        expandable={{
          expandedRowRender: (record: any) => (
            <div style={{ margin: 0 }}>
              <p><strong>Description:</strong> {record.description || 'N/A'}</p>
              {record.adminRemarks && <p><strong>Admin Remarks:</strong> {record.adminRemarks}</p>}
              {record.billDetails && <p><strong>Bill Details:</strong> {record.billDetails}</p>}
              {record.billImage && (
                <p>
                  <strong>Bill Image: </strong>
                  <a href={`${import.meta.env.VITE_BACKEND_URI}/${record.billImage}`} target="_blank" rel="noopener noreferrer">
                    View Image
                  </a>
                </p>
              )}
            </div>
          ),
        }}
      />

      {/* Request Modal */}
      <Modal
        title="Request DSA"
        open={isRequestModalOpen}
        onCancel={() => setIsRequestModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleRequest} layout="vertical">
          <Form.Item name="userIds" label="Select Users" rules={[{ required: true, message: 'Please select users' }]}>
            <Select mode="multiple" placeholder="Select users" filterOption={(input, option) =>
                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
              }>
              {filteredUsers.map((user: any) => (
                <Option key={user.id} value={user.id}>
                  {user.name || user.username} {user.role?.name ? `(${user.role.name})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Option value="lodging">Lodging</Option>
              <Option value="transport">Transport</Option>
              <Option value="both">Both</Option>
            </Select>
          </Form.Item>
          <Form.Item name="requestedAmount" label="Amount" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        title="Approve DSA"
        open={isApproveModalOpen}
        onCancel={() => setIsApproveModalOpen(false)}
        onOk={() => approveForm.submit()}
      >
        <Form form={approveForm} onFinish={handleApprove} layout="vertical">
          <Form.Item name="approvedAmount" label="Approved Amount" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="adminRemarks" label="Remarks">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject DSA"
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={() => rejectForm.submit()}
      >
        <Form form={rejectForm} onFinish={handleReject} layout="vertical">
          <Form.Item name="adminRemarks" label="Reason for Rejection" rules={[{ required: true, message: 'Please provide a reason' }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Settle Modal */}
      <Modal
        title="Settle DSA"
        open={isSettleModalOpen}
        onCancel={() => setIsSettleModalOpen(false)}
        onOk={() => settleForm.submit()}
      >
        <Form form={settleForm} onFinish={handleSettle} layout="vertical">
          <Form.Item name="settlementAmount" label="Total Cost" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="billDetails" label="Bill Details" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Enter bill numbers, dates, etc." />
          </Form.Item>
          <Form.Item label="Bill Image">
            <Upload
              listType="picture"
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Upload Bill (Camera/Gallery)</Button>
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
          <Button key="submit" type="primary" onClick={() => verifyMutation.mutate(selectedDsa?.id)}>
            Verify
          </Button>,
        ]}
      >
        {selectedDsa && (
          <div className="space-y-4">
            <div>
              <strong>Requester:</strong> {selectedDsa.requester?.name || selectedDsa.requester?.username}
            </div>
            <div>
              <strong>Requested Amount:</strong> {selectedDsa.requestedAmount}
            </div>
            <div>
              <strong>Approved Amount:</strong> {selectedDsa.approvedAmount}
            </div>
            <div>
              <strong>Settlement Amount:</strong> {selectedDsa.settlementAmount}
            </div>
            <div>
              <strong>Bill Details:</strong>
              <p className="mt-1 p-2 bg-gray-50 rounded">{selectedDsa.billDetails}</p>
            </div>
            {selectedDsa.billImage && (
              <div>
                <strong>Bill Image:</strong>
                <div className="mt-2">
                  <img 
                    src={`${import.meta.env.VITE_BACKEND_URI}/${selectedDsa.billImage}`} 
                    alt="Bill" 
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                  <div className="mt-2">
                    <a href={`${import.meta.env.VITE_BACKEND_URI}/${selectedDsa.billImage}`} target="_blank" rel="noopener noreferrer">
                      View Full Image
                    </a>
                  </div>
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

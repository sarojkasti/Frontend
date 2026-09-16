import React, { useState } from 'react';
import { Table, Input, Button, Popconfirm, message, Upload, Row, Col, Modal, DatePicker, Space, Tag, Tooltip } from 'antd';
import { UploadOutlined, PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useCreateUserDetail } from '@/hooks/user/userCreateuserDetail';
import { useParams } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

interface ContractDetail {
  key: number;
  id?: string;
  filename: string;
  documentFile?: string | UploadFile;
  validityStartDate?: Date | string | null;
  validityEndDate?: Date | string | null;
  isVerified?: boolean;
  verifiedById?: string;
  verifiedAt?: Date | string | null;
}

interface ContractDetailFormProps {
  initialValues?: any;
}

const ContractDetailForm: React.FC<ContractDetailFormProps> = ({ initialValues }) => {
  const [dataSource, setDataSource] = useState<ContractDetail[]>(
    initialValues ? [{ ...initialValues, key: 0 }] : []
  );
  const [count, setCount] = useState(initialValues ? 1 : 0);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const { mutate } = useCreateUserDetail();
  const { id } = useParams();
  const [currentUserId] = useState(localStorage.getItem("userId") || "");
  const [isAdmin] = useState(!!localStorage.getItem("isAdmin") || false);

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter(item => item.key !== key);
    setDataSource(newData);
    message.success('Record deleted');
  };

  const handleAdd = () => {
    const newData: ContractDetail = {
      key: count,
      filename: '',
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
    setEditingKey(count);
  };

  const handleSave = async (record: ContractDetail) => {
    try {
      const formData = new FormData();
      formData.append('filename', record.filename || '');

      if (record.id) {
        formData.append('id', record.id);
      }

      // Add validity dates if provided
      if (record.validityStartDate) {
        formData.append('validityStartDate', new Date(record.validityStartDate).toISOString());
      }

      if (record.validityEndDate) {
        formData.append('validityEndDate', new Date(record.validityEndDate).toISOString());
      }

      // Handle file upload
      if (record.documentFile && typeof record.documentFile === 'object' && 'originFileObj' in record.documentFile) {
        formData.append('documentFile', record.documentFile.originFileObj as File);
      }

      await mutate(
        { id, payload: formData, query: 'contract' },
        {
          onSuccess: () => {
            message.success('Contract details saved successfully');
            setEditingKey(null);
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to save contract details');
          }
        }
      );
    } catch (error) {
      message.error('Failed to save record');
    }
  };
  
  const handleVerifyDocument = async (record: ContractDetail, verified: boolean) => {
    try {
      const currentUserId = localStorage.getItem("userId") || "";
      const formData = new FormData();
      
      // Keep existing data
      formData.append('filename', record.filename || '');
      if (record.id) {
        formData.append('id', record.id);
      }
      
      // Add verification data
      formData.append('isVerified', String(verified));
      formData.append('verifiedById', currentUserId);
      formData.append('verifiedAt', new Date().toISOString());
      
      // Keep validity dates if they exist
      if (record.validityStartDate) {
        formData.append('validityStartDate', new Date(record.validityStartDate).toISOString());
      }
      if (record.validityEndDate) {
        formData.append('validityEndDate', new Date(record.validityEndDate).toISOString());
      }

      await mutate(
        { id, payload: formData, query: 'contract' },
        {
          onSuccess: () => {
            message.success(`Contract ${verified ? 'verified' : 'rejected'} successfully`);
            
            // Update local data
            const newData = dataSource.map(item => {
              if (item.id === record.id) {
                return {
                  ...item,
                  isVerified: verified,
                  verifiedById: currentUserId,
                  verifiedAt: new Date()
                };
              }
              return item;
            });
            
            setDataSource(newData);
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || `Failed to ${verified ? 'verify' : 'reject'} contract`);
          }
        }
      );
    } catch (error) {
      message.error(`Failed to ${verified ? 'verify' : 'reject'} contract`);
    }
  };

  const handleEdit = (key: number) => {
    setEditingKey(key);
  };

  const handleCancel = () => {
    setEditingKey(null);
  };

  const handleInputChange = (key: number, field: keyof ContractDetail, value: any) => {
    const newData = dataSource.map(item => {
      if (item.key === key) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setDataSource(newData);
  };

  const handlePreview = (fileUrl: string) => {
    setPreviewFile(fileUrl);
    setPreviewVisible(true);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewFile(null);
  };

  const columns = [
    {
      title: 'Contract Title/Filename',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string, record: ContractDetail) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'filename', e.target.value)}
              placeholder="Enter contract filename"
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Validity Start',
      dataIndex: 'validityStartDate',
      key: 'validityStartDate',
      render: (date: any, record: ContractDetail) => {
        if (editingKey === record.key) {
          return (
            <DatePicker
              value={date ? dayjs(date) : null}
              onChange={(value) => handleInputChange(record.key, 'validityStartDate', value ? value.toDate() : null)}
              placeholder="Select start date"
            />
          );
        }
        return date ? dayjs(date).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: 'Validity End',
      dataIndex: 'validityEndDate',
      key: 'validityEndDate',
      render: (date: any, record: ContractDetail) => {
        if (editingKey === record.key) {
          return (
            <DatePicker
              value={date ? dayjs(date) : null}
              onChange={(value) => handleInputChange(record.key, 'validityEndDate', value ? value.toDate() : null)}
              placeholder="Select end date"
            />
          );
        }
        return date ? dayjs(date).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: 'Document',
      dataIndex: 'documentFile',
      key: 'documentFile',
      render: (_: any, record: ContractDetail) => {
        if (editingKey === record.key) {
          return (
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              onChange={(info) => {
                if (info.fileList.length > 0) {
                  handleInputChange(record.key, 'documentFile', info.fileList[0]);
                }
              }}
              fileList={record.documentFile && typeof record.documentFile === 'object' && 'originFileObj' in record.documentFile ? [record.documentFile as UploadFile] : []}
            >
              <Button icon={<UploadOutlined />} size="small">
                Upload
              </Button>
            </Upload>
          );
        }
        return record.documentFile && typeof record.documentFile === 'string' 
          ? (
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => handlePreview(`${import.meta.env.VITE_BACKEND_URI}${record.documentFile}`)}
            >
              View Contract
            </Button>
          )
          : 'No document';
      },
    },
    {
      title: 'Verification Status',
      key: 'verification',
      render: (_: any, record: ContractDetail) => {
        const isAdmin = localStorage.getItem("isAdmin") === "true";
        const isCurrentUser = id === localStorage.getItem("userId");
        
        if (record.isVerified) {
          return (
            <Tag color="green">
              Verified {record.verifiedAt ? `on ${dayjs(record.verifiedAt).format('YYYY-MM-DD')}` : ''}
            </Tag>
          );
        } else {
          return (
            <Space>
              <Tag color="orange">Pending Verification</Tag>
              {isAdmin && !isCurrentUser && (
                <Space size="small">
                  <Tooltip title="Verify">
                    <Button 
                      type="link" 
                      icon={<CheckCircleOutlined />} 
                      onClick={() => handleVerifyDocument(record, true)} 
                      style={{ color: 'green' }}
                    />
                  </Tooltip>
                  <Tooltip title="Reject">
                    <Button 
                      type="link" 
                      icon={<CloseCircleOutlined />} 
                      onClick={() => handleVerifyDocument(record, false)} 
                      danger
                    />
                  </Tooltip>
                </Space>
              )}
            </Space>
          );
        }
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ContractDetail) => {
        if (editingKey === record.key) {
          return (
            <span>
              <Button type="link" onClick={() => handleSave(record)} style={{ marginRight: 8 }}>
                Save
              </Button>
              <Button type="link" onClick={handleCancel}>
                Cancel
              </Button>
            </span>
          );
        }
        return (
          <span>
            <Button type="link" onClick={() => handleEdit(record.key)} style={{ marginRight: 8 }}>
              Edit
            </Button>
            <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.key)}>
              <Button type="link" danger>
                Delete
              </Button>
            </Popconfirm>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <Table
        bordered
        dataSource={dataSource}
        columns={columns}
        rowClassName="editable-row"
        pagination={false}
        rowKey="key"
      />
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={24}>
          <Button
            onClick={handleAdd}
            type="dashed"
            icon={<PlusOutlined />}
            block
          >
            Add Contract Detail
          </Button>
        </Col>
      </Row>

      {/* Document Preview Modal */}
      <Modal
        open={previewVisible}
        title="Contract Preview"
        footer={null}
        onCancel={handleClosePreview}
        width={800}
      >
        {previewFile && (
          <div style={{ textAlign: 'center' }}>
            {previewFile.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={previewFile}
                style={{ width: '100%', height: '600px', border: 'none' }}
                title="Contract Preview"
              />
            ) : (
              <img
                src={previewFile}
                alt="Contract Preview"
                style={{ maxWidth: '100%', maxHeight: '600px' }}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ContractDetailForm;



import React, { useState } from 'react';
import { Table, Input, Button, Popconfirm, message, Upload, Row, Col, Modal } from 'antd';
import { UploadOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useCreateUserDetail } from '@/hooks/user/userCreateuserDetail';
import { useParams } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';

interface BankDetail {
  key: number;
  id?: string;
  bankName: string;
  bankBranch: string;
  accountNo: string;
  documentFile?: string | UploadFile;
}

const BankDetailForm = ({ initialValues }: any) => {
  const [dataSource, setDataSource] = useState<BankDetail[]>(
    initialValues && initialValues.length > 0 ? initialValues.map((item: any, index: number) => ({
      ...item,
      key: index
    })) : []
  );
  const [count, setCount] = useState(initialValues?.length || 0);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const { mutate } = useCreateUserDetail();
  const { id } = useParams();

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter(item => item.key !== key);
    setDataSource(newData);
    message.success('Record deleted');
  };

  const handleAdd = () => {
    const newData: BankDetail = {
      key: count,
      bankName: '',
      bankBranch: '',
      accountNo: '',
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
    setEditingKey(count);
  };

  const handleSave = async (record: BankDetail) => {
    try {
      const formData = new FormData();
      formData.append('bankName', record.bankName || '');
      formData.append('bankBranch', record.bankBranch || '');
      formData.append('accountNo', record.accountNo || '');

      if (record.id) {
        formData.append('id', record.id);
      }

      // Handle file upload
      if (record.documentFile && typeof record.documentFile === 'object' && 'originFileObj' in record.documentFile) {
        formData.append('documentFile', record.documentFile.originFileObj as File);
      }

      await mutate(
        { id, payload: formData, query: 'bank' },
        {
          onSuccess: () => {
            message.success('Bank details saved successfully');
            setEditingKey(null);
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to save bank details');
          }
        }
      );
    } catch (error) {
      message.error('Failed to save record');
    }
  };

  const handleEdit = (key: number) => {
    setEditingKey(key);
  };

  const handleCancel = () => {
    setEditingKey(null);
  };

  const handleInputChange = (key: number, field: keyof BankDetail, value: any) => {
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
      title: 'Bank Name',
      dataIndex: 'bankName',
      key: 'bankName',
      render: (text: string, record: BankDetail) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'bankName', e.target.value)}
              placeholder="Enter bank name"
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Bank Branch',
      dataIndex: 'bankBranch',
      key: 'bankBranch',
      render: (text: string, record: BankDetail) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'bankBranch', e.target.value)}
              placeholder="Enter bank branch"
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Account Number',
      dataIndex: 'accountNo',
      key: 'accountNo',
      render: (text: string, record: BankDetail) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'accountNo', e.target.value)}
              placeholder="Enter account number"
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Document',
      dataIndex: 'documentFile',
      key: 'documentFile',
      render: (_: any, record: BankDetail) => {
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
              View Document
            </Button>
          )
          : 'No document';
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: BankDetail) => {
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
            Add Bank Detail
          </Button>
        </Col>
      </Row>

      {/* Document Preview Modal */}
      <Modal
        open={previewVisible}
        title="Document Preview"
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
                title="Document Preview"
              />
            ) : (
              <img
                src={previewFile}
                alt="Document Preview"
                style={{ maxWidth: '100%', maxHeight: '600px' }}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default BankDetailForm;



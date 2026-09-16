import React, { useState } from 'react';
import { Table, Input, Button, Popconfirm, message, Upload, Row, Col, Modal, DatePicker, Select } from 'antd';
import { UploadOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useCreateUserDetail } from '@/hooks/user/userCreateuserDetail';
import { useParams } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

interface UserDocument {
  key: number;
  id?: string;
  documentType: string;
  identificationNo: string;
  dateOfIssue?: Date | string | null;
  placeOfIssue: string;
  filename?: string;
  documentFile?: string | UploadFile;
}

const documentTypeOptions = [
  { value: 'citizenship', label: 'Citizenship' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'pan_no', label: 'PAN Number' },
  { value: 'membership', label: 'Membership' },
  { value: 'others', label: 'Others' },
];

const UserDocumentForm = ({ initialValues }: any) => {
  const [dataSource, setDataSource] = useState<UserDocument[]>(
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
    const newData: UserDocument = {
      key: count,
      documentType: '',
      identificationNo: '',
      placeOfIssue: '',
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
    setEditingKey(count);
  };

  const handleSave = async (record: UserDocument) => {
    try {
      const formData = new FormData();
      formData.append('documentType', record.documentType || '');
      formData.append('identificationNo', record.identificationNo || '');
      formData.append('placeOfIssue', record.placeOfIssue || '');
      
      if (record.filename) {
        formData.append('filename', record.filename);
      }

      if (record.id) {
        formData.append('id', record.id);
      }

      // Add date of issue if provided
      if (record.dateOfIssue) {
        formData.append('dateOfIssue', new Date(record.dateOfIssue).toISOString());
      }

      // Handle file upload
      if (record.documentFile && typeof record.documentFile === 'object' && 'originFileObj' in record.documentFile) {
        formData.append('documentFile', record.documentFile.originFileObj as File);
      }

      await mutate(
        { id, payload: formData, query: 'document' },
        {
          onSuccess: () => {
            message.success('Document saved successfully');
            setEditingKey(null);
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to save document');
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

  const handleInputChange = (key: number, field: keyof UserDocument, value: any) => {
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
      title: 'Document Type',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (text: string, record: UserDocument) => {
        if (editingKey === record.key) {
          return (
            <Select
              style={{ width: '100%' }}
              value={text}
              onChange={(value) => handleInputChange(record.key, 'documentType', value)}
              placeholder="Select document type"
              options={documentTypeOptions}
            />
          );
        }
        return documentTypeOptions.find(opt => opt.value === text)?.label || text;
      },
    },
    {
      title: 'Identification No.',
      dataIndex: 'identificationNo',
      key: 'identificationNo',
      render: (text: string, record: UserDocument) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'identificationNo', e.target.value)}
              placeholder="Enter identification number"
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Date of Issue',
      dataIndex: 'dateOfIssue',
      key: 'dateOfIssue',
      render: (date: any, record: UserDocument) => {
        if (editingKey === record.key) {
          return (
            <DatePicker
              value={date ? dayjs(date) : null}
              onChange={(value) => handleInputChange(record.key, 'dateOfIssue', value ? value.toDate() : null)}
              placeholder="Select date"
            />
          );
        }
        return date ? dayjs(date).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: 'Place of Issue',
      dataIndex: 'placeOfIssue',
      key: 'placeOfIssue',
      render: (text: string, record: UserDocument) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'placeOfIssue', e.target.value)}
              placeholder="Enter place of issue"
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
      render: (_: any, record: UserDocument) => {
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
      render: (_: any, record: UserDocument) => {
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
            Add Document
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

export default UserDocumentForm;



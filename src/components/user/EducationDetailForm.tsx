import React, { useState } from 'react';
import { Table, Input, InputNumber, Button, Popconfirm, message, Upload, Row, Col, Modal } from 'antd';
import { UploadOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useCreateUserDetail } from '@/hooks/user/userCreateuserDetail';
import { useParams } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';

interface EducationDetail {
  key: number;
  id?: string;
  universityCollege: string;
  faculty: string;
  yearOfPassing: number | string;
  placeOfIssue: string;
  documentFile?: string | UploadFile;
}

const EducationDetailForm = ({ initialValues }: any) => {
  const [dataSource, setDataSource] = useState<EducationDetail[]>(
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
    const newData: EducationDetail = {
      key: count,
      universityCollege: '',
      faculty: '',
      yearOfPassing: '',
      placeOfIssue: '',
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
    setEditingKey(count);
  };

  const handleSave = async (record: EducationDetail) => {
    try {
      const formData = new FormData();
      formData.append('universityCollege', record.universityCollege || '');
      formData.append('faculty', record.faculty || '');
      formData.append('yearOfPassing', record.yearOfPassing?.toString() || '');
      formData.append('placeOfIssue', record.placeOfIssue || '');

      if (record.id) {
        formData.append('id', record.id);
      }

      // Handle file upload
      if (record.documentFile && typeof record.documentFile === 'object' && 'originFileObj' in record.documentFile) {
        formData.append('documentFile', record.documentFile.originFileObj as File);
      }

      await mutate(
        { id, payload: formData, query: 'education' },
        {
          onSuccess: () => {
            message.success('Education details saved successfully');
            setEditingKey(null);
          },
          onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to save education details');
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

  const handleInputChange = (key: number, field: keyof EducationDetail, value: any) => {
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
      title: 'University/College',
      dataIndex: 'universityCollege',
      key: 'universityCollege',
      render: (text: string, record: EducationDetail) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'universityCollege', e.target.value)}
              placeholder="Enter university/college"
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Faculty',
      dataIndex: 'faculty',
      key: 'faculty',
      render: (text: string, record: EducationDetail) => {
        if (editingKey === record.key) {
          return (
            <Input
              value={text}
              onChange={(e) => handleInputChange(record.key, 'faculty', e.target.value)}
              placeholder="Enter faculty"
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Year of Passing',
      dataIndex: 'yearOfPassing',
      key: 'yearOfPassing',
      render: (text: string, record: EducationDetail) => {
        if (editingKey === record.key) {
          return (
            <InputNumber
              value={text}
              onChange={(value) => handleInputChange(record.key, 'yearOfPassing', value)}
              placeholder="Enter year"
              style={{ width: '100%' }}
            />
          );
        }
        return text;
      },
    },
    {
      title: 'Place of Issue',
      dataIndex: 'placeOfIssue',
      key: 'placeOfIssue',
      render: (text: string, record: EducationDetail) => {
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
      title: 'Certificate',
      dataIndex: 'documentFile',
      key: 'documentFile',
      render: (_: any, record: EducationDetail) => {
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
              View Certificate
            </Button>
          )
          : 'No certificate';
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: EducationDetail) => {
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
            Add Education Detail
          </Button>
        </Col>
      </Row>

      {/* Document Preview Modal */}
      <Modal
        open={previewVisible}
        title="Certificate Preview"
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
                title="Certificate Preview"
              />
            ) : (
              <img
                src={previewFile}
                alt="Certificate Preview"
                style={{ maxWidth: '100%', maxHeight: '600px' }}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
export default EducationDetailForm;



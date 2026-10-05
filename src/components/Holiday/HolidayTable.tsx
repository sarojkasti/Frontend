import React, { useState, useRef } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Popconfirm,
  message,
  Tag,
  Typography,
  Upload,
  Modal,
  Tooltip,
  Input
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { PowerTable, PowerTableColumn, useTableSearch, useColumnVisibility } from "@/components/Table";
import { useHolidays, useDeleteHoliday, useImportHolidaysFromCSV } from '../../hooks/holiday/useHoliday';
import { HolidayType } from '../../types/holiday';

const { Title } = Typography;
const { Dragger } = Upload;

interface HolidayTableProps {
  onEdit?: (holiday: HolidayType) => void;
}

const HolidayTable: React.FC<HolidayTableProps> = ({ onEdit }) => {
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // For sorting functionality
  const [sortedInfo, setSortedInfo] = useState<any>({});

  const { data: holidays = [], isLoading, refetch } = useHolidays();
  const deleteHoliday = useDeleteHoliday();
  const importHolidays = useImportHolidaysFromCSV();

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday.mutateAsync(id);
      message.success('Holiday deleted successfully');
      refetch();
    } catch (error) {
      message.error('Failed to delete holiday');
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };

  const handleImport = async (file: File) => {
    setUploading(true);
    try {
      await importHolidays.mutateAsync(file);
      message.success('Holidays imported successfully');
      setImportModalVisible(false);
      refetch();
    } catch (error) {
      message.error('Failed to import holidays');
    } finally {
      setUploading(false);
    }
  };

  const { getColumnSearchProps } = useTableSearch({ dataSource: holidays });

  const getHolidayTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'public': return 'red';
      case 'company': return 'blue';
      case 'festival': return 'gold';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      ...getColumnSearchProps('date', 'Date'),
      sorter: (a: HolidayType, b: HolidayType) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      sortOrder: sortedInfo.columnKey === 'date' && sortedInfo.order,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title', 'Title'),
      sorter: (a: HolidayType, b: HolidayType) => a.title.localeCompare(b.title),
      sortOrder: sortedInfo.columnKey === 'title' && sortedInfo.order
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      ...getColumnSearchProps('type', 'Type'),
      render: (type: string) => (
        <Tag color={getHolidayTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      ),
      sorter: (a: HolidayType, b: HolidayType) => a.type.localeCompare(b.type),
      sortOrder: sortedInfo.columnKey === 'type' && sortedInfo.order,
      filters: [
        { text: 'Public', value: 'public' },
        { text: 'Company', value: 'company' },
        { text: 'Festival', value: 'festival' }
      ],
      onFilter: (value: any, record: HolidayType) => record.type === value
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ...getColumnSearchProps('description', 'Description'),
      sorter: (a: HolidayType, b: HolidayType) => (a.description || '').localeCompare(b.description || ''),
      sortOrder: sortedInfo.columnKey === 'description' && sortedInfo.order,
      ellipsis: {
        showTitle: false
      },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          {description || '-'}
        </Tooltip>
      )
    },
    {
      title: 'BS Date',
      dataIndex: 'bsDate',
      key: 'bsDate',
      ...getColumnSearchProps('bsDate', 'BS Date'),
      sorter: (a: HolidayType, b: HolidayType) => (a.bsDate || '').localeCompare(b.bsDate || ''),
      sortOrder: sortedInfo.columnKey === 'bsDate' && sortedInfo.order,
      render: (bsDate: string) => bsDate || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: HolidayType) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this holiday?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const { visibleColumnKeys, columnCustomizer } = useColumnVisibility({
    persistenceKey: "holiday_table",
    columns: columns as any,
  });

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv',
    beforeUpload: (file: File) => {
      const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
      if (!isCsv) {
        message.error('You can only upload CSV files!');
        return false;
      }
      handleImport(file);
      return false; // Prevent default upload behavior
    },
    showUploadList: false
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: '8px' }} />
            <Title level={4} style={{ margin: 0 }}>Holidays</Title>
          </div>
          <Space>
            {columnCustomizer}
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              Import CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                // Download CSV template
                const csvContent = "date,title,type,description,bsDate\n2024-01-01,New Year,public,New Year's Day,2080-09-17";
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'holiday_template.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
            >
              Template
            </Button>
          </Space>
        </div>
      }
    >
      <PowerTable
        columns={columns as any}
        dataSource={holidays}
        rowKey="id"
        loading={isLoading}
        enableResize
        visibleColumnKeys={visibleColumnKeys}
        showToolbar={false}
        persistenceKey="holiday_table"
        onChange={handleTableChange}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} holidays`
        }}
      />

      {/* CSV Import Modal */}
      <Modal
        title="Import Holidays from CSV"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Typography.Text>
            Upload a CSV file with holiday data. The CSV should have columns: date, title, type, description, bsDate
          </Typography.Text>
        </div>
        
        <Dragger {...uploadProps} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            {uploading ? 'Importing...' : 'Click or drag CSV file to this area to upload'}
          </p>
          <p className="ant-upload-hint">
            Only CSV files are supported. Download the template for the correct format.
          </p>
        </Dragger>
      </Modal>
    </Card>
  );
};

export default HolidayTable;

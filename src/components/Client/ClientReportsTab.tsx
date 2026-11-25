import React, { useState, useMemo } from 'react';
import { Table, Spin, Tag, Button, Input, Space, Empty, Typography, Tooltip, Dropdown, MenuProps } from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  SearchOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  CalendarOutlined,
  FolderOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useClientReportsByCustomer } from '@/hooks/clientReport';
import { ClientReportType, ReportAccessStatus } from '@/types/clientReport';
import { formatNepaliFiscalYear } from '@/utils/fiscalYear';
import dayjs from 'dayjs';

const { Text } = Typography;
const backendURI = import.meta.env.VITE_BACKEND_URI;

interface ClientReportsTabProps {
  clientId: string;
  clientName?: string;
}

const ClientReportsTab: React.FC<ClientReportsTabProps> = ({ clientId, clientName }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: reports, isLoading } = useClientReportsByCustomer(clientId);

  const filteredReports = useMemo(() => {
    if (!reports || !Array.isArray(reports)) return [];
    if (!searchTerm.trim()) return reports;
    const term = searchTerm.toLowerCase();
    return reports.filter((r: ClientReportType) => {
      const title = r.title?.toLowerCase() || '';
      const docType = r.documentType?.name?.toLowerCase() || '';
      const proj = r.project?.name?.toLowerCase() || '';
      return title.includes(term) || docType.includes(term) || proj.includes(term);
    });
  }, [reports, searchTerm]);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getStatusBadge = (status: ReportAccessStatus) => {
    switch (status) {
      case ReportAccessStatus.ACCESSIBLE:
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Accessible
          </Tag>
        );
      case ReportAccessStatus.PENDING:
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Pending Review
          </Tag>
        );
      case ReportAccessStatus.REVOKED:
        return (
          <Tag color="error" icon={<StopOutlined />}>
            Revoked
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Report Title & Document',
      key: 'title',
      render: (_: any, record: ClientReportType) => {
        const fileCount = record.files?.length || (record.filePath ? 1 : 0);
        return (
          <div className="py-1">
            <div className="font-semibold text-slate-800 flex items-center gap-2">
              <FileTextOutlined className="text-blue-500 text-base" />
              <span>{record.title}</span>
              {fileCount > 1 && (
                <Tag color="blue" className="text-[11px] px-1 py-0 leading-tight">
                  {fileCount} files
                </Tag>
              )}
            </div>
            {record.description && (
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {record.description}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Document Type',
      key: 'docType',
      render: (_: any, record: ClientReportType) => (
        <Tag color="purple" className="font-medium text-xs">
          {record.documentType?.name || 'General Document'}
        </Tag>
      )
    },
    {
      title: 'Project & Fiscal Year',
      key: 'project',
      render: (_: any, record: ClientReportType) => (
        <div className="text-xs space-y-1">
          {record.project ? (
            <div className="font-medium text-slate-700 flex items-center gap-1">
              <FolderOutlined className="text-slate-400" />
              <span>{record.project.name}</span>
            </div>
          ) : (
            <span className="text-slate-400">Direct Client Document</span>
          )}
          {record.fiscalYear && (
            <Tag color="cyan" className="m-0 text-[11px]">
              <CalendarOutlined className="mr-1" />
              {formatNepaliFiscalYear(record.fiscalYear)}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: 'Access Status',
      key: 'accessStatus',
      render: (_: any, record: ClientReportType) => getStatusBadge(record.accessStatus)
    },
    {
      title: 'Uploaded',
      key: 'createdAt',
      render: (_: any, record: ClientReportType) => (
        <span className="text-xs text-slate-500">
          {record.createdAt ? dayjs(record.createdAt).format('MMM DD, YYYY') : '-'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: ClientReportType) => {
        const files = record.files && record.files.length > 0 ? record.files : null;

        if (files && files.length > 1) {
          const menuItems: MenuProps['items'] = files.map((file) => ({
            key: file.id,
            label: (
              <a
                href={`${backendURI}/client-reports/${record.id}/files/${file.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs"
              >
                <DownloadOutlined />
                {file.displayFileName || file.originalFileName}
              </a>
            )
          }));

          return (
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button size="small" icon={<DownloadOutlined />}>
                Download ({files.length})
              </Button>
            </Dropdown>
          );
        }

        const singleFileUrl = files && files.length === 1
          ? `${backendURI}/client-reports/${record.id}/files/${files[0].id}/download`
          : record.filePath
          ? `${backendURI}/client-reports/${record.id}/download`
          : null;

        return singleFileUrl ? (
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            href={singleFileUrl}
            target="_blank"
            className="text-blue-600 font-medium"
          >
            Download
          </Button>
        ) : (
          <span className="text-xs text-slate-400">No file</span>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search reports by title, document type, or project..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 320 }}
            size="middle"
          />
          <Text type="secondary" className="text-xs">
            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => navigate('/client-reports')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Manage / Upload Reports
          </Button>
        </Space>
      </div>

      {filteredReports.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-1 py-2">
              <div className="text-slate-600 font-medium">No reports found for this client</div>
              <div className="text-slate-400 text-xs">
                {searchTerm
                  ? 'Try adjusting your search query.'
                  : 'Client reports, audit declarations, and compliance certificates will show here.'}
              </div>
            </div>
          }
        >
          {!searchTerm && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => navigate('/client-reports')}
            >
              Upload Report to Client
            </Button>
          )}
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="id"
          pagination={{ pageSize: 8, hideOnSinglePage: true, showSizeChanger: false }}
          size="middle"
          className="border border-slate-200/80 rounded-lg overflow-hidden"
        />
      )}
    </div>
  );
};

export default ClientReportsTab;

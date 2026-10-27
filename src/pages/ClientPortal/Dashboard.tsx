import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Spin,
  Empty,
  message,
  Dropdown,
  Select
} from "antd";
import {
  FileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  LogoutOutlined,
  SwapOutlined,
  BankOutlined,
  FilterOutlined
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useClientAuth } from "@/context/ClientAuthContext";
import {
  useMyClientReports,
  useMyClientReportStats,
  useDownloadClientReport,
  useProjectsByCustomer
} from "@/hooks/clientReport";
import { useDocumentTypesForCustomer } from "@/hooks/clientReport/useClientReportDocumentTypes";
import { ClientReportType, ReportAccessStatus } from "@/types/clientReport";
import { formatDistanceToNow } from "date-fns";
import { formatNepaliFiscalYear } from "@/utils/fiscalYear";

const { Title, Text } = Typography;

const ClientDashboard: React.FC = () => {
  const { clientUser, selectedCustomer, logout, selectCustomer } = useClientAuth();
  const { data: reports, isLoading: reportsLoading } = useMyClientReports(selectedCustomer?.id);
  const { data: stats, isLoading: statsLoading } = useMyClientReportStats(selectedCustomer?.id);
  const { mutate: download, isPending: downloading } = useDownloadClientReport();
  
  // Filters
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<string | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  
  // Fetch document types and projects for filtering
  const { data: documentTypes } = useDocumentTypesForCustomer(selectedCustomer?.id);
  const { data: projects } = useProjectsByCustomer(selectedCustomer?.id);
  
  // Filter reports based on selected filters
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter((report: ClientReportType) => {
      if (selectedDocumentTypeId && report.documentTypeId !== selectedDocumentTypeId) {
        return false;
      }
      if (selectedProjectId && report.projectId !== selectedProjectId) {
        return false;
      }
      return true;
    });
  }, [reports, selectedDocumentTypeId, selectedProjectId]);
  
  const handleClearFilters = () => {
    setSelectedDocumentTypeId(undefined);
    setSelectedProjectId(undefined);
  };

  const handleDownload = (report: ClientReportType) => {
    if (report.accessStatus !== ReportAccessStatus.ACCESSIBLE) {
      message.warning(
        report.accessStatus === ReportAccessStatus.PENDING
          ? "Payment pending for this report. Please contact us."
          : "Access to this report has been revoked."
      );
      return;
    }

    download(
      { id: report.id, fileName: report.originalFileName },
      {
        onSuccess: () => {
          message.success("Download started");
        },
        onError: () => {
          message.error("Download failed. Please try again.");
        }
      }
    );
  };

  const handleCustomerSwitch = async (customerId: string) => {
    const success = await selectCustomer(customerId);
    if (success) {
      message.success("Switched company successfully");
    } else {
      message.error("Failed to switch company");
    }
  };

  // Build customer switcher dropdown items
  const customerMenuItems: MenuProps["items"] = clientUser?.customers?.map((customer) => ({
    key: customer.id,
    label: (
      <div className="flex items-center gap-2">
        <BankOutlined />
        <span>{customer.name}</span>
        {customer.id === selectedCustomer?.id && (
          <Tag color="blue" className="ml-2">Current</Tag>
        )}
      </div>
    ),
    onClick: () => {
      if (customer.id !== selectedCustomer?.id) {
        handleCustomerSwitch(customer.id);
      }
    }
  })) || [];

  const getStatusTag = (status: ReportAccessStatus) => {
    switch (status) {
      case ReportAccessStatus.ACCESSIBLE:
        return <Tag color="success" icon={<CheckCircleOutlined />}>Ready to Download</Tag>;
      case ReportAccessStatus.PENDING:
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Payment Pending</Tag>;
      case ReportAccessStatus.REVOKED:
        return <Tag color="error">Access Revoked</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: "Report",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: ClientReportType) => (
        <div>
          <div className="font-medium">{title || "-"}</div>
          {record.description && (
            <Text type="secondary" className="text-sm">
              {record.description}
            </Text>
          )}
        </div>
      )
    },
    {
      title: "Document Type",
      dataIndex: "documentType",
      key: "documentType",
      render: (documentType: any) => documentType?.name || "-"
    },
    {
      title: "Project",
      dataIndex: "project",
      key: "project",
      render: (project: any) => project?.name || "-"
    },
    {
      title: "Fiscal Year",
      dataIndex: "fiscalYear",
      key: "fiscalYear",
      render: (year: number) => formatNepaliFiscalYear(year)
    },
    {
      title: "Status",
      dataIndex: "accessStatus",
      key: "accessStatus",
      render: (status: ReportAccessStatus) => getStatusTag(status)
    },
    {
      title: "Uploaded",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true })
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ClientReportType) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          disabled={record.accessStatus !== ReportAccessStatus.ACCESSIBLE}
          loading={downloading}
          onClick={() => handleDownload(record)}
        >
          Download
        </Button>
      )
    }
  ];

  if (reportsLoading || statsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Title level={4} className="!mb-0">
              Client Portal
            </Title>
            <Text type="secondary">
              Welcome, {clientUser?.name || clientUser?.email}
            </Text>
          </div>
          <Space>
            {clientUser?.customers && clientUser.customers.length > 1 ? (
              <Dropdown menu={{ items: customerMenuItems }} trigger={["click"]}>
                <Button icon={<SwapOutlined />}>
                  {selectedCustomer?.name || "Select Company"}
                </Button>
              </Dropdown>
            ) : (
              <Button icon={<BankOutlined />}>
                {selectedCustomer?.name || "My Company"}
              </Button>
            )}
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Logout
            </Button>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Reports"
                value={stats?.total || 0}
                prefix={<FileOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Available for Download"
                value={stats?.accessible || 0}
                prefix={<CheckCircleOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Pending Payment"
                value={stats?.pending || 0}
                prefix={<ClockCircleOutlined className="text-orange-500" />}
              />
            </Card>
          </Col>
        </Row>

        {/* Reports Table */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <FileOutlined />
              <span>Your Reports</span>
            </div>
          }
          extra={
            <Space wrap>
              <Select
                placeholder="Filter by Document Type"
                allowClear
                style={{ width: 200 }}
                value={selectedDocumentTypeId}
                onChange={setSelectedDocumentTypeId}
                options={documentTypes?.map((dt: any) => ({
                  label: dt.name,
                  value: dt.id
                })) || []}
              />
              <Select
                placeholder="Filter by Project"
                allowClear
                style={{ width: 200 }}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                options={projects?.map((p: any) => ({
                  label: p.name,
                  value: p.id
                })) || []}
              />
              {(selectedDocumentTypeId || selectedProjectId) && (
                <Button icon={<FilterOutlined />} onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </Space>
          }
        >
          {filteredReports && filteredReports.length > 0 ? (
            <Table
              dataSource={filteredReports}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
            />
          ) : (
            <Empty description={
              (selectedDocumentTypeId || selectedProjectId) 
                ? "No reports match the selected filters" 
                : "No reports available yet"
            } />
          )}
        </Card>

        {/* Info Section */}
        <Card className="mt-8">
          <Title level={5}>Need Help?</Title>
          <Text type="secondary">
            If you have questions about your reports or need to make a payment,
            please contact our team. Reports will be available for download
            once payment is confirmed.
          </Text>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
